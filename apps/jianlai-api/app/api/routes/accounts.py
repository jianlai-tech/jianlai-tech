"""登录、本人资料。个性化部分本人改；剑来认证部分只读，管理员在 admin 路由里改。"""

from __future__ import annotations

import json
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.auth import (
    CurrentAccount,
    StaffAccount,
    create_session,
    drop_session,
    hash_password,
    token_hash,
    verify_password,
)
from app.db.pool import get_pool
from app.timezone import now_cn

router = APIRouter(tags=["账号"])

PHONE_RE = re.compile(r"^1\d{10}$")


class LoginIn(BaseModel):
    phone: str = Field(min_length=11, max_length=11)
    password: str = Field(min_length=1, max_length=64)


def _public_account(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "kind": row["kind"],
        "phone": row["phone"],
        "name": row["name"],
        "is_admin": row["is_admin"],
        "staff_slug": row.get("staff_slug"),
        "company": row.get("company"),
        "must_change_password": row["must_change_password"],
    }


@router.post("/api/auth/login")
async def login(body: LoginIn):
    phone = body.phone.strip()
    if not PHONE_RE.fullmatch(phone):
        raise HTTPException(status_code=400, detail="手机号写成 11 位大陆号")
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, kind, phone, name, is_admin, status, staff_slug, company,
                   must_change_password, password_hash
            FROM accounts WHERE phone = $1
            """,
            phone,
        )
        if row is None or not verify_password(body.password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="手机号或密码不对")
        if row["status"] == "pending":
            raise HTTPException(status_code=403, detail="账号还没开通：付款确认后由剑来开通")
        if row["status"] != "active":
            raise HTTPException(status_code=403, detail="账号已停用，请联系剑来")
        await conn.execute(
            "UPDATE accounts SET last_login_at = $2 WHERE id = $1", row["id"], now_cn()
        )
    token = await create_session(row["id"])
    return {"token": token, "account": _public_account(dict(row))}


@router.post("/api/auth/logout")
async def logout(account: CurrentAccount):
    await drop_session(account["token"])
    return {"ok": True}


class PasswordIn(BaseModel):
    old_password: str = Field(min_length=1, max_length=64)
    new_password: str = Field(min_length=8, max_length=64)


@router.post("/api/auth/password")
async def change_password(body: PasswordIn, account: CurrentAccount):
    if body.new_password == body.old_password:
        raise HTTPException(status_code=400, detail="新密码不能和旧密码一样")
    pool = await get_pool()
    async with pool.acquire() as conn:
        stored = await conn.fetchval(
            "SELECT password_hash FROM accounts WHERE id = $1", account["id"]
        )
        if not verify_password(body.old_password, stored):
            raise HTTPException(status_code=400, detail="旧密码不对")
        await conn.execute(
            "UPDATE accounts SET password_hash = $2, must_change_password = false WHERE id = $1",
            account["id"],
            hash_password(body.new_password),
        )
        # 改密后其它设备下线，只留当前会话
        await conn.execute(
            "DELETE FROM sessions WHERE account_id = $1 AND token_hash <> $2",
            account["id"],
            token_hash(account["token"]),
        )
    return {"ok": True}


@router.get("/api/me")
async def me(account: CurrentAccount):
    data = {"account": _public_account(account)}
    if account["kind"] == "staff":
        data.update(await _staff_detail(account["id"]))
    else:
        data["projects"] = await _client_projects(account["id"])
    return data


async def _client_projects(account_id) -> list[dict]:
    """外部公司只看挂在自己名下的项目：进度和驻场的人（只露称呼和角色）。"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT p.id, p.name, p.industry, p.stage, p.progress, p.progress_note,
                   p.started_on, p.ended_on, p.updated_at,
                   COALESCE(
                     json_agg(json_build_object('name', COALESCE(sp.alias, a.name), 'role', m.role))
                       FILTER (WHERE m.account_id IS NOT NULL),
                     '[]'
                   ) AS members
            FROM projects p
            LEFT JOIN project_members m ON m.project_id = p.id
            LEFT JOIN accounts a ON a.id = m.account_id
            LEFT JOIN staff_profiles sp ON sp.account_id = m.account_id
            WHERE p.client_account_id = $1
            GROUP BY p.id
            ORDER BY p.ended_on IS NOT NULL, p.updated_at DESC
            """,
            account_id,
        )
    items = []
    for row in rows:
        item = _jsonable(row)
        if isinstance(item["members"], str):
            item["members"] = json.loads(item["members"])
        items.append(item)
    return items


async def _staff_detail(account_id) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        profile = await conn.fetchrow(
            """
            SELECT alias, tagline, skills, prefers, character, availability, updated_at
            FROM staff_profiles WHERE account_id = $1
            """,
            account_id,
        )
        cert = await conn.fetchrow(
            """
            SELECT c.gate, c.realm_no, c.dims, c.note, c.certified_at, a.name AS certified_by
            FROM staff_certs c LEFT JOIN accounts a ON a.id = c.certified_by
            WHERE c.account_id = $1
            """,
            account_id,
        )
        projects = await conn.fetch(
            """
            SELECT p.id, p.name, p.industry, p.stage, p.progress, p.progress_note,
                   p.started_on, p.ended_on, m.role
            FROM project_members m JOIN projects p ON p.id = m.project_id
            WHERE m.account_id = $1
            ORDER BY p.ended_on IS NOT NULL, p.started_on DESC NULLS LAST
            """,
            account_id,
        )
    return {
        "profile": _jsonable(profile),
        "cert": _cert(cert),
        "projects": [_jsonable(row) for row in projects],
    }


def _jsonable(row) -> dict | None:
    if row is None:
        return None
    out = {}
    for key, value in dict(row).items():
        if hasattr(value, "isoformat"):
            out[key] = value.isoformat()
        elif key == "id":
            out[key] = str(value)
        else:
            out[key] = value
    return out


def _cert(row) -> dict | None:
    data = _jsonable(row)
    if data is not None and isinstance(data.get("dims"), str):
        data["dims"] = json.loads(data["dims"])
    return data


class ProfileIn(BaseModel):
    alias: str | None = Field(default=None, max_length=20)
    tagline: str | None = Field(default=None, max_length=60)
    skills: str | None = Field(default=None, max_length=300)
    prefers: str | None = Field(default=None, max_length=300)
    character: str | None = Field(default=None, max_length=300)
    availability: str | None = Field(default=None, max_length=200)


@router.put("/api/me/profile")
async def update_profile(body: ProfileIn, account: StaffAccount):
    """个性化部分：本人改，对外展示用。认证字段不在这里。"""
    clean = {
        k: (v.strip() or None) if isinstance(v, str) else None for k, v in body.model_dump().items()
    }
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO staff_profiles (account_id, alias, tagline, skills, prefers, character, availability, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (account_id) DO UPDATE SET
                alias = EXCLUDED.alias,
                tagline = EXCLUDED.tagline,
                skills = EXCLUDED.skills,
                prefers = EXCLUDED.prefers,
                character = EXCLUDED.character,
                availability = EXCLUDED.availability,
                updated_at = EXCLUDED.updated_at
            """,
            account["id"],
            clean["alias"],
            clean["tagline"],
            clean["skills"],
            clean["prefers"],
            clean["character"],
            clean["availability"],
            now_cn(),
        )
    return {"ok": True}
