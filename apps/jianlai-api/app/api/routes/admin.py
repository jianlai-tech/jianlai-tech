"""管理员：开通账号、改剑来认证（门派 / 境界 / 四维 / 项目角色）、维护项目进度。"""

from __future__ import annotations

import json
import re
from datetime import date
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.api.routes.accounts import _cert, _jsonable
from app.auth import AdminAccount, hash_password
from app.db.pool import get_pool
from app.timezone import now_cn

router = APIRouter(prefix="/api/admin", tags=["管理"])

PHONE_RE = re.compile(r"^1\d{10}$")
ID_TAIL_RE = re.compile(r"^\d{5}[\dXx]$")
Gate = Literal["问剑门", "破阵门", "映剑门"]
Stage = Literal["先看", "先斩一处", "上线护航", "教会交接", "已完结"]


def _check_phone(phone: str) -> str:
    phone = phone.strip()
    if not PHONE_RE.fullmatch(phone):
        raise HTTPException(status_code=400, detail="手机号写成 11 位大陆号")
    return phone


# —— 账号 ——


@router.get("/accounts")
async def list_accounts(_: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT a.id, a.kind, a.phone, a.name, a.is_admin, a.status, a.staff_slug, a.company,
                   a.paid_at, a.must_change_password, a.last_login_at, a.created_at,
                   p.alias, p.tagline, c.gate, c.realm_no, c.dims, c.certified_at
            FROM accounts a
            LEFT JOIN staff_profiles p ON p.account_id = a.id
            LEFT JOIN staff_certs c ON c.account_id = a.id
            ORDER BY a.kind DESC, a.is_admin DESC, a.created_at
            """
        )
    return {"items": [_cert(row) for row in rows]}


class StaffAccountIn(BaseModel):
    phone: str
    name: str = Field(min_length=1, max_length=20)
    id_tail: str = Field(description="身份证后 6 位，作初始密码；库里只存哈希")
    staff_slug: str | None = Field(default=None, max_length=40)


@router.post("/accounts/staff")
async def create_staff(body: StaffAccountIn, _: AdminAccount):
    phone = _check_phone(body.phone)
    if not ID_TAIL_RE.fullmatch(body.id_tail.strip()):
        raise HTTPException(status_code=400, detail="身份证后 6 位：前 5 位数字，末位数字或 X")
    pool = await get_pool()
    async with pool.acquire() as conn, conn.transaction():
        row = await conn.fetchrow(
            """
                INSERT INTO accounts (kind, phone, name, password_hash, staff_slug, status, must_change_password)
                VALUES ('staff', $1, $2, $3, $4, 'active', false)
                ON CONFLICT (phone) DO NOTHING
                RETURNING id
                """,
            phone,
            body.name.strip(),
            hash_password(body.id_tail.strip().upper()),
            body.staff_slug,
        )
        if row is None:
            raise HTTPException(status_code=409, detail="这个手机号已经有账号了")
        await conn.execute("INSERT INTO staff_certs (account_id) VALUES ($1)", row["id"])
        await conn.execute("INSERT INTO staff_profiles (account_id) VALUES ($1)", row["id"])
    return {"ok": True, "id": str(row["id"])}


class ClientAccountIn(BaseModel):
    phone: str
    name: str = Field(min_length=1, max_length=20, description="对接人称呼")
    company: str = Field(min_length=1, max_length=80)
    initial_password: str = Field(min_length=6, max_length=64)


@router.post("/accounts/client")
async def create_client(body: ClientAccountIn, _: AdminAccount):
    """外部公司账号：建好是待开通，确认付款后再开通。"""
    phone = _check_phone(body.phone)
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO accounts (kind, phone, name, company, password_hash, status)
            VALUES ('client', $1, $2, $3, $4, 'pending')
            ON CONFLICT (phone) DO NOTHING
            RETURNING id
            """,
            phone,
            body.name.strip(),
            body.company.strip(),
            hash_password(body.initial_password),
        )
    if row is None:
        raise HTTPException(status_code=409, detail="这个手机号已经有账号了")
    return {"ok": True, "id": str(row["id"])}


class StatusIn(BaseModel):
    status: Literal["active", "disabled"]


@router.post("/accounts/{account_id}/status")
async def set_status(account_id: str, body: StatusIn, admin: AdminAccount):
    if account_id == str(admin["id"]) and body.status != "active":
        raise HTTPException(status_code=400, detail="不能停用自己")
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            """
            UPDATE accounts SET
                status = $2,
                paid_at = CASE WHEN kind = 'client' AND $2 = 'active' AND paid_at IS NULL THEN $3 ELSE paid_at END
            WHERE id = $1::uuid
            """,
            account_id,
            body.status,
            now_cn(),
        )
        if body.status != "active":
            await conn.execute("DELETE FROM sessions WHERE account_id = $1::uuid", account_id)
    if result.endswith(" 0"):
        raise HTTPException(status_code=404, detail="没有这个账号")
    return {"ok": True}


class ResetIn(BaseModel):
    new_password: str = Field(min_length=6, max_length=64)


@router.post("/accounts/{account_id}/reset-password")
async def reset_password(account_id: str, body: ResetIn, _: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE accounts SET password_hash = $2, must_change_password = (kind <> 'staff') WHERE id = $1::uuid",
            account_id,
            hash_password(body.new_password),
        )
        await conn.execute("DELETE FROM sessions WHERE account_id = $1::uuid", account_id)
    if result.endswith(" 0"):
        raise HTTPException(status_code=404, detail="没有这个账号")
    return {"ok": True}


# —— 剑来认证：能力水平 ——


class DimsIn(BaseModel):
    edge: int = Field(ge=1, le=3)
    sheath: int = Field(ge=1, le=3)
    heart: int = Field(ge=1, le=3)
    qi: int = Field(ge=1, le=3)


class CertIn(BaseModel):
    gate: Gate | None = None
    realm_no: int = Field(ge=0, le=9)
    dims: DimsIn | None = None
    note: str | None = Field(default=None, max_length=300)


@router.put("/staff/{account_id}/cert")
async def update_cert(account_id: str, body: CertIn, admin: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn:
        kind = await conn.fetchval("SELECT kind FROM accounts WHERE id = $1::uuid", account_id)
        if kind != "staff":
            raise HTTPException(status_code=404, detail="没有这个同门账号")
        await conn.execute(
            """
            INSERT INTO staff_certs (account_id, gate, realm_no, dims, note, certified_by, certified_at)
            VALUES ($1::uuid, $2, $3, $4::jsonb, $5, $6, $7)
            ON CONFLICT (account_id) DO UPDATE SET
                gate = EXCLUDED.gate,
                realm_no = EXCLUDED.realm_no,
                dims = EXCLUDED.dims,
                note = EXCLUDED.note,
                certified_by = EXCLUDED.certified_by,
                certified_at = EXCLUDED.certified_at
            """,
            account_id,
            body.gate,
            body.realm_no,
            json.dumps(body.dims.model_dump() if body.dims else {}),
            (body.note or "").strip() or None,
            admin["id"],
            now_cn(),
        )
    return {"ok": True}


# —— 项目：进度 + 成员角色 ——


@router.get("/projects")
async def list_projects(_: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT p.id, p.name, p.industry, p.stage, p.progress, p.progress_note,
                   p.started_on, p.ended_on, p.updated_at, p.client_account_id,
                   ca.company AS client_company,
                   COALESCE(
                     json_agg(json_build_object('account_id', m.account_id, 'name', a.name, 'role', m.role))
                       FILTER (WHERE m.account_id IS NOT NULL),
                     '[]'
                   ) AS members
            FROM projects p
            LEFT JOIN accounts ca ON ca.id = p.client_account_id
            LEFT JOIN project_members m ON m.project_id = p.id
            LEFT JOIN accounts a ON a.id = m.account_id
            GROUP BY p.id, ca.company
            ORDER BY p.ended_on IS NOT NULL, p.updated_at DESC
            """
        )
    items = []
    for row in rows:
        item = _jsonable(row)
        item["client_account_id"] = (
            str(row["client_account_id"]) if row["client_account_id"] else None
        )
        if isinstance(item["members"], str):
            item["members"] = json.loads(item["members"])
        items.append(item)
    return {"items": items}


class MemberIn(BaseModel):
    account_id: str
    role: str = Field(min_length=1, max_length=20)


class ProjectIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    industry: str | None = Field(default=None, max_length=30)
    client_account_id: str | None = None
    stage: Stage = "先看"
    progress: int = Field(default=0, ge=0, le=100)
    progress_note: str | None = Field(default=None, max_length=300)
    started_on: date | None = None
    ended_on: date | None = None
    members: list[MemberIn] = []


async def _save_members(conn, project_id, members: list[MemberIn]) -> None:
    await conn.execute("DELETE FROM project_members WHERE project_id = $1", project_id)
    if not members:
        return
    await conn.execute(
        """
        INSERT INTO project_members (project_id, account_id, role)
        SELECT $1, m.account_id, m.role
        FROM unnest($2::uuid[], $3::text[]) AS m(account_id, role)
        """,
        project_id,
        [m.account_id for m in members],
        [m.role.strip() for m in members],
    )


@router.post("/projects")
async def create_project(body: ProjectIn, _: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn, conn.transaction():
        project_id = await conn.fetchval(
            """
            INSERT INTO projects (name, industry, client_account_id, stage, progress, progress_note,
                                  started_on, ended_on, created_at, updated_at)
            VALUES ($1, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $9)
            RETURNING id
            """,
            body.name.strip(),
            body.industry,
            body.client_account_id,
            body.stage,
            body.progress,
            body.progress_note,
            body.started_on,
            body.ended_on,
            now_cn(),
        )
        await _save_members(conn, project_id, body.members)
    return {"ok": True, "id": str(project_id)}


@router.put("/projects/{project_id}")
async def update_project(project_id: str, body: ProjectIn, _: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn, conn.transaction():
        result = await conn.execute(
            """
            UPDATE projects SET
                name = $2, industry = $3, client_account_id = $4::uuid, stage = $5,
                progress = $6, progress_note = $7, started_on = $8, ended_on = $9, updated_at = $10
            WHERE id = $1::uuid
            """,
            project_id,
            body.name.strip(),
            body.industry,
            body.client_account_id,
            body.stage,
            body.progress,
            body.progress_note,
            body.started_on,
            body.ended_on,
            now_cn(),
        )
        if result.endswith(" 0"):
            raise HTTPException(status_code=404, detail="没有这个项目")
        await _save_members(conn, project_id, body.members)
    return {"ok": True}
