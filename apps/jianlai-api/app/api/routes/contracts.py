"""合同：拟定 → 导出 Word → 现场签约后上传留档 → 联动剑修工作状态。只给管理员。"""

from __future__ import annotations

import calendar
from datetime import date
from decimal import Decimal
from typing import Annotated, Literal
from urllib.parse import quote
from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.auth import AdminAccount
from app.contract_doc import build_contract_docx, totals
from app.db.pool import get_pool
from app.timezone import now_cn

router = APIRouter(prefix="/api/admin", tags=["合同"])

MAX_FILE = 15 * 1024 * 1024
ALLOWED_MIME = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

_COLS = """c.id, c.code, c.project_id, c.mode, c.status, c.party_a, c.party_a_rep, c.party_a_contact,
           c.party_a_address, c.start_on, c.months, c.end_on, c.staff_fee, c.consult_fee,
           c.work_place, c.pay_terms, c.extra_terms, c.signed_on, c.file_name, c.file_mime,
           c.file_size, c.uploaded_at, c.created_at, c.updated_at, p.name AS project_name"""


class StaffPick(BaseModel):
    slug: str = Field(min_length=1, max_length=40)
    alias: str | None = Field(default=None, max_length=20)
    role: str = Field(default="驻场", min_length=1, max_length=20)


class ContractIn(BaseModel):
    project_id: UUID
    mode: Literal["dispatch", "project"] = "dispatch"
    party_a: str = Field(min_length=1, max_length=80)
    party_a_rep: str | None = Field(default=None, max_length=20)
    party_a_contact: str | None = Field(default=None, max_length=60)
    party_a_address: str | None = Field(default=None, max_length=120)
    start_on: date
    months: int = Field(default=1, ge=1, le=36)
    staff_fee: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    consult_fee: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    work_place: str | None = Field(default=None, max_length=120)
    pay_terms: str | None = Field(default=None, max_length=300)
    extra_terms: str | None = Field(default=None, max_length=1000)
    staff: list[StaffPick] = Field(min_length=1, max_length=20)


def _end_on(start: date, months: int) -> date:
    """一个月 = 到下月同日的前一天。31 号起算落到月底。"""
    y, m = divmod(start.month - 1 + months, 12)
    year, month = start.year + y, m + 1
    last = calendar.monthrange(year, month)[1]
    if start.day > last:
        return date(year, month, last)
    return date.fromordinal(date(year, month, start.day).toordinal() - 1)


def _clean(value: str | None) -> str | None:
    return (value or "").strip() or None


def _row(record, staff: list[dict]) -> dict:
    item = dict(record)
    for key in ("id", "project_id"):
        item[key] = str(item[key])
    for key, value in list(item.items()):
        if hasattr(value, "isoformat"):
            item[key] = value.isoformat()
        elif isinstance(value, Decimal):
            item[key] = float(value)
    sums = totals(record["staff_fee"], record["consult_fee"], len(staff), record["months"])
    item["monthly_total"] = float(sums["monthly"])
    item["total"] = float(sums["total"])
    item["staff"] = staff
    item["has_file"] = record["file_name"] is not None
    return item


async def _staff_of(conn, ids: list) -> dict[str, list[dict]]:
    rows = await conn.fetch(
        """
        SELECT cs.contract_id, cs.staff_slug, cs.legal_name, cs.alias, cs.role
        FROM contract_staff cs
        JOIN staff s ON s.slug = cs.staff_slug
        WHERE cs.contract_id = ANY($1::uuid[])
        ORDER BY s.sort_order
        """,
        ids,
    )
    out: dict[str, list[dict]] = {}
    for r in rows:
        out.setdefault(str(r["contract_id"]), []).append(
            {"slug": r["staff_slug"], "legal_name": r["legal_name"], "alias": r["alias"], "role": r["role"]}
        )
    return out


async def _fetch_one(conn, contract_id) -> dict:
    record = await conn.fetchrow(
        f"SELECT {_COLS} FROM contracts c JOIN projects p ON p.id = c.project_id WHERE c.id = $1::uuid",
        contract_id,
    )
    if record is None:
        raise HTTPException(status_code=404, detail="没有这份合同")
    staff = (await _staff_of(conn, [record["id"]])).get(str(record["id"]), [])
    return _row(record, staff)


@router.get("/contracts")
async def list_contracts(_: AdminAccount, project_id: UUID | None = None):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT {_COLS} FROM contracts c JOIN projects p ON p.id = c.project_id
            WHERE ($1::uuid IS NULL OR c.project_id = $1)
            ORDER BY c.created_at DESC
            """,
            project_id,
        )
        staff = await _staff_of(conn, [r["id"] for r in rows])
    return {"items": [_row(r, staff.get(str(r["id"]), [])) for r in rows]}


async def _save_staff(conn, contract_id, picks: list[StaffPick]) -> None:
    slugs = [p.slug for p in picks]
    if len(set(slugs)) != len(slugs):
        raise HTTPException(status_code=400, detail="同一位剑修只能写一次")
    names = {
        r["slug"]: r["name"]
        for r in await conn.fetch("SELECT slug, name FROM staff WHERE slug = ANY($1::text[])", slugs)
    }
    missing = [s for s in slugs if s not in names]
    if missing:
        raise HTTPException(status_code=400, detail=f"名册里没有：{'、'.join(missing)}")
    await conn.execute("DELETE FROM contract_staff WHERE contract_id = $1", contract_id)
    await conn.execute(
        """
        INSERT INTO contract_staff (contract_id, staff_slug, legal_name, alias, role)
        SELECT $1, s.slug, s.legal_name, s.alias, s.role
        FROM unnest($2::text[], $3::text[], $4::text[], $5::text[]) AS s(slug, legal_name, alias, role)
        """,
        contract_id,
        slugs,
        [names[s] for s in slugs],
        [_clean(p.alias) for p in picks],
        [p.role.strip() for p in picks],
    )


async def _next_code(conn, start: date) -> str:
    prefix = f"JL-{start:%Y%m}-"
    count = await conn.fetchval("SELECT count(*) FROM contracts WHERE code LIKE $1", prefix + "%")
    return f"{prefix}{count + 1:02d}"


def _values(body: ContractIn) -> list:
    return [
        body.mode,
        body.party_a.strip(),
        _clean(body.party_a_rep),
        _clean(body.party_a_contact),
        _clean(body.party_a_address),
        body.start_on,
        body.months,
        _end_on(body.start_on, body.months),
        body.staff_fee,
        body.consult_fee,
        _clean(body.work_place),
        _clean(body.pay_terms),
        _clean(body.extra_terms),
    ]


@router.post("/contracts")
async def create_contract(body: ContractIn, admin: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn, conn.transaction():
        if not await conn.fetchval("SELECT 1 FROM projects WHERE id = $1", body.project_id):
            raise HTTPException(status_code=404, detail="没有这个项目")
        contract_id = await conn.fetchval(
            """
            INSERT INTO contracts (code, project_id, mode, party_a, party_a_rep, party_a_contact,
                party_a_address, start_on, months, end_on, staff_fee, consult_fee, work_place,
                pay_terms, extra_terms, created_by, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::uuid, $17, $17)
            RETURNING id
            """,
            await _next_code(conn, body.start_on),
            body.project_id,
            *_values(body),
            admin["id"],
            now_cn(),
        )
        await _save_staff(conn, contract_id, body.staff)
        return await _fetch_one(conn, contract_id)


@router.put("/contracts/{contract_id}")
async def update_contract(contract_id: UUID, body: ContractIn, _: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn, conn.transaction():
        status = await conn.fetchval("SELECT status FROM contracts WHERE id = $1", contract_id)
        if status is None:
            raise HTTPException(status_code=404, detail="没有这份合同")
        if status != "draft":
            raise HTTPException(status_code=400, detail="已签或作废的合同不能再改，要改就新拟一份")
        await conn.execute(
            """
            UPDATE contracts SET mode = $2, party_a = $3, party_a_rep = $4, party_a_contact = $5,
                party_a_address = $6, start_on = $7, months = $8, end_on = $9, staff_fee = $10,
                consult_fee = $11, work_place = $12, pay_terms = $13, extra_terms = $14,
                updated_at = $15
            WHERE id = $1
            """,
            contract_id,
            *_values(body),
            now_cn(),
        )
        await _save_staff(conn, contract_id, body.staff)
        return await _fetch_one(conn, contract_id)


@router.get("/contracts/{contract_id}/docx")
async def export_docx(contract_id: UUID, _: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow("SELECT * FROM contracts WHERE id = $1", contract_id)
        if record is None:
            raise HTTPException(status_code=404, detail="没有这份合同")
        staff = (await _staff_of(conn, [contract_id])).get(str(contract_id), [])
    data = dict(record)
    if not data["pay_terms"]:
        data["pay_terms"] = "甲方于每个服务月开始后 5 个工作日内，支付当月服务费"
    content = build_contract_docx(data, staff)
    name = f"{record['code']}-{record['party_a']}-驻场技术服务合同.docx"
    return Response(
        content,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(name)}"},
    )


@router.post("/contracts/{contract_id}/sign")
async def sign_contract(
    contract_id: UUID,
    _: AdminAccount,
    file: Annotated[UploadFile, File(description="签好的合同扫描件 / 照片 / PDF")],
    signed_on: Annotated[date, Form()],
):
    """上传签约留档：合同转已签，并把剑修挂进项目，工作状态跟着变。"""
    if signed_on > now_cn().date():
        raise HTTPException(status_code=400, detail="签约日期不能晚于今天")
    mime = (file.content_type or "").lower()
    if mime not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail="只收 PDF、图片或 Word")
    data = await file.read(MAX_FILE + 1)
    if len(data) > MAX_FILE:
        raise HTTPException(status_code=400, detail="文件超过 15MB，压一下再传")
    if not data:
        raise HTTPException(status_code=400, detail="文件是空的")
    pool = await get_pool()
    async with pool.acquire() as conn, conn.transaction():
        record = await conn.fetchrow(
            "SELECT id, project_id, mode, status, start_on, end_on FROM contracts WHERE id = $1 FOR UPDATE",
            contract_id,
        )
        if record is None:
            raise HTTPException(status_code=404, detail="没有这份合同")
        if record["status"] == "void":
            raise HTTPException(status_code=400, detail="作废的合同不能签")
        now = now_cn()
        await conn.execute(
            """
            UPDATE contracts SET status = 'signed', signed_on = $2, file_name = $3, file_mime = $4,
                file_size = $5, file_data = $6, uploaded_at = $7, updated_at = $7
            WHERE id = $1
            """,
            contract_id,
            signed_on,
            file.filename or "合同留档",
            mime,
            len(data),
            data,
            now,
        )
        # 联动：项目合作方式 / 起止 / 阶段；有后台账号的剑修挂进项目成员
        await conn.execute(
            """
            UPDATE projects SET
                mode = $2,
                started_on = LEAST(COALESCE(started_on, $3), $3),
                ended_on = GREATEST(COALESCE(ended_on, $4), $4),
                stage = CASE WHEN stage = '先看' THEN '先斩一处' ELSE stage END,
                updated_at = $5
            WHERE id = $1
            """,
            record["project_id"],
            record["mode"],
            record["start_on"],
            record["end_on"],
            now,
        )
        await conn.execute(
            """
            INSERT INTO project_members (project_id, account_id, role, joined_on)
            SELECT $1, a.id, cs.role, $3
            FROM contract_staff cs JOIN accounts a ON a.staff_slug = cs.staff_slug
            WHERE cs.contract_id = $2
            ON CONFLICT (project_id, account_id) DO UPDATE SET role = EXCLUDED.role
            """,
            record["project_id"],
            contract_id,
            record["start_on"],
        )
        return await _fetch_one(conn, contract_id)


@router.get("/contracts/{contract_id}/file")
async def download_file(contract_id: UUID, _: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow(
            "SELECT file_name, file_mime, file_data FROM contracts WHERE id = $1", contract_id
        )
    if record is None or record["file_data"] is None:
        raise HTTPException(status_code=404, detail="还没上传签约留档")
    return Response(
        bytes(record["file_data"]),
        media_type=record["file_mime"],
        headers={"Content-Disposition": f"inline; filename*=UTF-8''{quote(record['file_name'])}"},
    )


@router.post("/contracts/{contract_id}/void")
async def void_contract(contract_id: UUID, _: AdminAccount):
    """作废。已签的作废时，这份合同挂进项目的剑修一并撤下（别的有效合同还挂着的不撤）。"""
    pool = await get_pool()
    async with pool.acquire() as conn, conn.transaction():
        done = await conn.fetchrow(
            """
            UPDATE contracts c SET status = 'void', updated_at = $2
            FROM contracts old
            WHERE c.id = $1 AND old.id = c.id AND c.status <> 'void'
            RETURNING c.project_id, old.status AS was
            """,
            contract_id,
            now_cn(),
        )
        if done is None:
            raise HTTPException(status_code=404, detail="没有这份合同，或已作废")
        if done["was"] == "signed":
            await conn.execute(
                """
                DELETE FROM project_members m
                USING accounts a, contract_staff cs
                WHERE m.project_id = $1 AND a.id = m.account_id
                  AND cs.contract_id = $2 AND cs.staff_slug = a.staff_slug
                  AND NOT EXISTS (
                    SELECT 1 FROM contracts c2 JOIN contract_staff cs2 ON cs2.contract_id = c2.id
                    WHERE c2.project_id = $1 AND c2.id <> $2 AND c2.status = 'signed'
                      AND cs2.staff_slug = a.staff_slug
                  )
                """,
                done["project_id"],
                contract_id,
            )
    return {"ok": True}


@router.get("/staff-load")
async def staff_load(_: AdminAccount):
    """剑修工作状态：每人手上挂着哪些项目。来源 = 合同（已签 / 拟定）+ 项目成员（没走合同的老项目）。"""
    today = now_cn().date()
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT cs.staff_slug AS slug, p.id AS project_id, p.name AS project, cs.role,
                   CASE
                     WHEN c.status = 'draft' THEN 'planned'
                     WHEN c.start_on > $1 THEN 'upcoming'
                     ELSE 'active'
                   END AS state,
                   c.start_on, c.end_on, c.code
            FROM contract_staff cs
            JOIN contracts c ON c.id = cs.contract_id
            JOIN projects p ON p.id = c.project_id
            WHERE c.status <> 'void' AND c.end_on >= $1
            UNION ALL
            SELECT a.staff_slug, p.id, p.name, m.role, 'active', p.started_on, p.ended_on, NULL
            FROM project_members m
            JOIN accounts a ON a.id = m.account_id
            JOIN projects p ON p.id = m.project_id
            WHERE a.staff_slug IS NOT NULL
              AND p.stage <> '已完结'
              AND (p.ended_on IS NULL OR p.ended_on >= $1)
              AND NOT EXISTS (
                SELECT 1 FROM contracts c2 JOIN contract_staff cs2 ON cs2.contract_id = c2.id
                WHERE c2.project_id = p.id AND cs2.staff_slug = a.staff_slug
                  AND c2.status <> 'void' AND c2.end_on >= $1
              )
            ORDER BY 1, 6 NULLS LAST
            """,
            today,
        )
    out: dict[str, list[dict]] = {}
    for r in rows:
        out.setdefault(r["slug"], []).append(
            {
                "project_id": str(r["project_id"]),
                "project": r["project"],
                "role": r["role"],
                "state": r["state"],
                "start_on": r["start_on"].isoformat() if r["start_on"] else None,
                "end_on": r["end_on"].isoformat() if r["end_on"] else None,
                "contract_code": r["code"],
            }
        )
    return {"today": today.isoformat(), "items": out}
