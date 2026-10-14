"""项目全流程：需求文档上传 → 报价（估算书 Word）→ 从报价拟合同 → 分期（前/中/后/维护）→ 维护期开新模块。只给管理员。"""

from __future__ import annotations

import json
from datetime import date
from decimal import Decimal
from typing import Annotated, Literal
from urllib.parse import quote as urlquote
from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.auth import AdminAccount
from app.db.pool import get_pool
from app.quote_doc import build_quote_docx, quote_totals
from app.timezone import now_cn

router = APIRouter(prefix="/api/admin", tags=["项目流程"])

MAX_FILE = 20 * 1024 * 1024
DOC_MIME = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/markdown",
}
PHASES = ("前期", "中期", "后期", "维护")
Phase = Literal["前期", "中期", "后期", "维护"]


def _iso(item: dict) -> dict:
    for key, value in list(item.items()):
        if isinstance(value, UUID):
            item[key] = str(value)
        elif hasattr(value, "isoformat"):
            item[key] = value.isoformat()
        elif isinstance(value, Decimal):
            item[key] = float(value)
    return item


async def _project_or_404(conn, project_id) -> dict:
    row = await conn.fetchrow(
        "SELECT id, name, client_name, stage, parent_id, mode FROM projects WHERE id = $1",
        project_id,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="没有这个项目")
    return dict(row)


async def _advance(conn, project_id, to: str) -> None:
    """阶段只往前推，不往回拉。"""
    order = ["需求", "报价", "签约", "前期", "中期", "后期", "维护", "已完结"]
    await conn.execute(
        """
        UPDATE projects SET stage = $2, updated_at = $3
        WHERE id = $1 AND array_position($4::text[], stage) < array_position($4::text[], $2)
        """,
        project_id,
        to,
        now_cn(),
        order,
    )


# —— 需求文档 ——


@router.get("/projects/{project_id}/docs")
async def list_docs(project_id: UUID, _: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, project_id, kind, file_name, file_mime, file_size, note, uploaded_at
            FROM project_docs WHERE project_id = $1 ORDER BY uploaded_at DESC
            """,
            project_id,
        )
    return {"items": [_iso(dict(r)) for r in rows]}


@router.post("/projects/{project_id}/docs")
async def upload_doc(
    project_id: UUID,
    admin: AdminAccount,
    file: Annotated[UploadFile, File(description="客户需求文档 / 纪要 / 原型")],
    kind: Annotated[Literal["requirement", "other"], Form()] = "requirement",
    note: Annotated[str | None, Form(max_length=200)] = None,
):
    mime = (file.content_type or "").lower()
    if mime not in DOC_MIME:
        raise HTTPException(status_code=400, detail="只收 PDF、Word、Excel、PPT、图片或文本")
    data = await file.read(MAX_FILE + 1)
    if len(data) > MAX_FILE:
        raise HTTPException(status_code=400, detail="文件超过 20MB")
    if not data:
        raise HTTPException(status_code=400, detail="文件是空的")
    pool = await get_pool()
    async with pool.acquire() as conn, conn.transaction():
        await _project_or_404(conn, project_id)
        row = await conn.fetchrow(
            """
            INSERT INTO project_docs (project_id, kind, file_name, file_mime, file_size, file_data, note,
                                      uploaded_by, uploaded_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8::uuid, $9)
            RETURNING id, project_id, kind, file_name, file_mime, file_size, note, uploaded_at
            """,
            project_id,
            kind,
            file.filename or "需求文档",
            mime,
            len(data),
            data,
            (note or "").strip() or None,
            admin["id"],
            now_cn(),
        )
    return _iso(dict(row))


@router.get("/docs/{doc_id}/file")
async def download_doc(doc_id: UUID, _: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT file_name, file_mime, file_data FROM project_docs WHERE id = $1", doc_id
        )
    if row is None:
        raise HTTPException(status_code=404, detail="没有这份文件")
    return Response(
        bytes(row["file_data"]),
        media_type=row["file_mime"],
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{urlquote(row['file_name'])}"
        },
    )


@router.delete("/docs/{doc_id}")
async def delete_doc(doc_id: UUID, _: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM project_docs WHERE id = $1", doc_id)
    if result.endswith(" 0"):
        raise HTTPException(status_code=404, detail="没有这份文件")
    return {"ok": True}


# —— 报价 ——


class QuoteItem(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    content: str = Field(default="", max_length=400)
    days: float = Field(default=0, ge=0, le=999)
    amount: float = Field(ge=0, le=10_000_000)


class PayStep(BaseModel):
    name: str = Field(min_length=1, max_length=20)
    pct: float = Field(gt=0, le=100)
    condition: str = Field(default="", max_length=200)


class ScheduleStep(BaseModel):
    when: str = Field(default="", max_length=20)
    what: str = Field(default="", max_length=200)
    client: str = Field(default="", max_length=120)


class QuoteIn(BaseModel):
    project_id: UUID
    title: str = Field(min_length=1, max_length=80)
    party_a: str = Field(min_length=1, max_length=80)
    weeks: int = Field(default=4, ge=1, le=104)
    items: list[QuoteItem] = Field(min_length=1, max_length=40)
    ai_fee: float = Field(default=0, ge=0, le=1_000_000)
    pay_plan: list[PayStep] = Field(default_factory=list, max_length=8)
    schedule: list[ScheduleStep] = Field(default_factory=list, max_length=20)
    onsite_per_week: int = Field(default=2, ge=0, le=7)
    maintain_low: float = Field(default=1500, ge=0)
    maintain_high: float = Field(default=3000, ge=0)
    out_of_scope: str | None = Field(default=None, max_length=1000)
    assumptions: str | None = Field(default=None, max_length=2000)
    valid_days: int = Field(default=30, ge=1, le=365)


_Q_COLS = """q.id, q.code, q.project_id, q.status, q.title, q.party_a, q.weeks, q.items, q.ai_fee, q.pay_plan,
             q.schedule, q.onsite_per_week, q.maintain_low, q.maintain_high, q.out_of_scope, q.assumptions,
             q.valid_days, q.created_at, q.updated_at, p.name AS project_name"""


def _quote_row(record) -> dict:
    item = dict(record)
    for key in ("items", "pay_plan", "schedule"):
        if isinstance(item[key], str):
            item[key] = json.loads(item[key])
    sums = quote_totals(item["items"], item["ai_fee"])
    item["dev_total"] = float(sums["dev"])
    item["days_total"] = float(sums["days"])
    item["total"] = float(sums["total"])
    return _iso(item)


def _check_pay(body: QuoteIn) -> None:
    if body.pay_plan and abs(sum(p.pct for p in body.pay_plan) - 100) > 0.01:
        raise HTTPException(status_code=400, detail="付款比例加起来要等于 100%")
    if body.maintain_high < body.maintain_low:
        raise HTTPException(status_code=400, detail="运维价格上限不能低于下限")


def _q_values(body: QuoteIn) -> list:
    return [
        body.title.strip(),
        body.party_a.strip(),
        body.weeks,
        json.dumps([i.model_dump() for i in body.items], ensure_ascii=False),
        body.ai_fee,
        json.dumps([p.model_dump() for p in body.pay_plan], ensure_ascii=False),
        json.dumps([s.model_dump() for s in body.schedule], ensure_ascii=False),
        body.onsite_per_week,
        body.maintain_low,
        body.maintain_high,
        (body.out_of_scope or "").strip() or None,
        (body.assumptions or "").strip() or None,
        body.valid_days,
    ]


@router.get("/quotes")
async def list_quotes(_: AdminAccount, project_id: UUID | None = None):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT {_Q_COLS} FROM quotes q JOIN projects p ON p.id = q.project_id
            WHERE ($1::uuid IS NULL OR q.project_id = $1) ORDER BY q.created_at DESC
            """,
            project_id,
        )
    return {"items": [_quote_row(r) for r in rows]}


async def _fetch_quote(conn, quote_id) -> dict:
    row = await conn.fetchrow(
        f"SELECT {_Q_COLS} FROM quotes q JOIN projects p ON p.id = q.project_id WHERE q.id = $1",
        quote_id,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="没有这份报价")
    return _quote_row(row)


@router.post("/quotes")
async def create_quote(body: QuoteIn, admin: AdminAccount):
    _check_pay(body)
    now = now_cn()
    pool = await get_pool()
    async with pool.acquire() as conn, conn.transaction():
        await _project_or_404(conn, body.project_id)
        prefix = f"BJ-{now:%Y%m}-"
        count = await conn.fetchval("SELECT count(*) FROM quotes WHERE code LIKE $1", prefix + "%")
        quote_id = await conn.fetchval(
            """
            INSERT INTO quotes (code, project_id, title, party_a, weeks, items, ai_fee, pay_plan, schedule,
                onsite_per_week, maintain_low, maintain_high, out_of_scope, assumptions, valid_days,
                created_by, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb, $9::jsonb, $10, $11, $12, $13, $14, $15,
                    $16::uuid, $17, $17)
            RETURNING id
            """,
            f"{prefix}{count + 1:02d}",
            body.project_id,
            *_q_values(body),
            admin["id"],
            now,
        )
        await _advance(conn, body.project_id, "报价")
        return await _fetch_quote(conn, quote_id)


@router.put("/quotes/{quote_id}")
async def update_quote(quote_id: UUID, body: QuoteIn, _: AdminAccount):
    _check_pay(body)
    pool = await get_pool()
    async with pool.acquire() as conn, conn.transaction():
        status = await conn.fetchval("SELECT status FROM quotes WHERE id = $1", quote_id)
        if status is None:
            raise HTTPException(status_code=404, detail="没有这份报价")
        if status == "accepted":
            raise HTTPException(status_code=400, detail="客户已认的报价不能再改，要改就另出一份")
        await conn.execute(
            """
            UPDATE quotes SET title = $2, party_a = $3, weeks = $4, items = $5::jsonb, ai_fee = $6,
                pay_plan = $7::jsonb, schedule = $8::jsonb, onsite_per_week = $9, maintain_low = $10,
                maintain_high = $11, out_of_scope = $12, assumptions = $13, valid_days = $14, updated_at = $15
            WHERE id = $1
            """,
            quote_id,
            *_q_values(body),
            now_cn(),
        )
        return await _fetch_quote(conn, quote_id)


class QuoteStatusIn(BaseModel):
    status: Literal["draft", "sent", "accepted", "rejected"]


@router.post("/quotes/{quote_id}/status")
async def set_quote_status(quote_id: UUID, body: QuoteStatusIn, _: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn, conn.transaction():
        project_id = await conn.fetchval(
            "UPDATE quotes SET status = $2, updated_at = $3 WHERE id = $1 RETURNING project_id",
            quote_id,
            body.status,
            now_cn(),
        )
        if project_id is None:
            raise HTTPException(status_code=404, detail="没有这份报价")
        return await _fetch_quote(conn, quote_id)


@router.get("/quotes/{quote_id}/docx")
async def export_quote(quote_id: UUID, _: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn:
        q = await _fetch_quote(conn, quote_id)
    q["created_on"] = date.fromisoformat(q["created_at"][:10])
    content = build_quote_docx(q)
    name = f"{q['code']}-{q['title']}-报价估算书-剑来科技.docx"
    return Response(
        content,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{urlquote(name)}"},
    )


# —— 分期 ——


class PhaseIn(BaseModel):
    phase: Phase
    start_on: date | None = None
    end_on: date | None = None
    goal: str | None = Field(default=None, max_length=300)
    status: Literal["todo", "doing", "done"] = "todo"
    pay_amount: float | None = Field(default=None, ge=0)
    paid_on: date | None = None


@router.get("/projects/{project_id}/phases")
async def list_phases(project_id: UUID, _: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM project_phases WHERE project_id = $1 ORDER BY array_position($2::text[], phase)",
            project_id,
            list(PHASES),
        )
    have = {r["phase"]: _iso(dict(r)) for r in rows}
    items = [
        have.get(p)
        or {
            "project_id": str(project_id),
            "phase": p,
            "start_on": None,
            "end_on": None,
            "goal": None,
            "status": "todo",
            "pay_amount": None,
            "paid_on": None,
        }
        for p in PHASES
    ]
    return {"items": items}


@router.put("/projects/{project_id}/phases")
async def save_phase(project_id: UUID, body: PhaseIn, _: AdminAccount):
    if body.start_on and body.end_on and body.end_on < body.start_on:
        raise HTTPException(status_code=400, detail="结束日不能早于开始日")
    now = now_cn()
    pool = await get_pool()
    async with pool.acquire() as conn, conn.transaction():
        await _project_or_404(conn, project_id)
        await conn.execute(
            """
            INSERT INTO project_phases (project_id, phase, start_on, end_on, goal, status, pay_amount, paid_on, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (project_id, phase) DO UPDATE SET
                start_on = EXCLUDED.start_on, end_on = EXCLUDED.end_on, goal = EXCLUDED.goal,
                status = EXCLUDED.status, pay_amount = EXCLUDED.pay_amount, paid_on = EXCLUDED.paid_on,
                updated_at = EXCLUDED.updated_at
            """,
            project_id,
            body.phase,
            body.start_on,
            body.end_on,
            (body.goal or "").strip() or None,
            body.status,
            body.pay_amount,
            body.paid_on,
            now,
        )
        # 这一期开始做了，项目阶段跟着推
        if body.status in ("doing", "done"):
            await _advance(conn, project_id, body.phase)
    return {"ok": True}


# —— 维护期新增模块（同一公司的子项目） ——


class ModuleIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    mode: Literal["dispatch", "project"] = "project"


@router.post("/projects/{project_id}/modules")
async def create_module(project_id: UUID, body: ModuleIn, _: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn, conn.transaction():
        parent = await conn.fetchrow(
            "SELECT id, parent_id, client_name, industry, client_account_id FROM projects WHERE id = $1",
            project_id,
        )
        if parent is None:
            raise HTTPException(status_code=404, detail="没有这个项目")
        root = parent["parent_id"] or parent["id"]
        now = now_cn()
        module_id = await conn.fetchval(
            """
            INSERT INTO projects (name, client_name, industry, client_account_id, mode, stage, progress,
                                  parent_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, '需求', 0, $6, $7, $7)
            RETURNING id
            """,
            body.name.strip(),
            parent["client_name"],
            parent["industry"],
            parent["client_account_id"],
            body.mode,
            root,
            now,
        )
    return {"ok": True, "id": str(module_id)}
