"""财务流水（真账）。只给管理员。银行明细带 bank_ref，同一笔不重复入账。"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.auth import AdminAccount
from app.db.pool import get_pool
from app.timezone import CN_TZ, now_cn

router = APIRouter(tags=["财务"])

IN_CATS = ("驻场费", "开发费", "维保费", "股东投入", "其他收入")
OUT_CATS = ("驻场补贴", "模型与工具", "场地", "住宿", "押金保证金", "差旅", "税费", "其他")

_COLUMNS = """id, occurred_on, occurred_at, kind, category, memo, counterparty, amount,
              account, balance_after, source, created_at"""


class EntryIn(BaseModel):
    occurred_on: date
    kind: Literal["in", "out"]
    category: str = Field(min_length=1, max_length=20)
    memo: str = Field(min_length=1, max_length=120)
    counterparty: str | None = Field(default=None, max_length=60)
    amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    account: str | None = Field(default=None, max_length=30)


def _row(record) -> dict:
    item = dict(record)
    item["id"] = str(item["id"])
    item["occurred_on"] = item["occurred_on"].isoformat()
    # 库会话是 UTC，统一换回东八区再给前端，页面直接截时分
    for key in ("occurred_at", "created_at"):
        if item.get(key) is not None:
            item[key] = item[key].astimezone(CN_TZ).isoformat()
    for key in ("amount", "balance_after"):
        if item.get(key) is not None:
            item[key] = float(item[key])
    return item


@router.get("/api/admin/ledger")
async def list_ledger(
    _: AdminAccount,
    start: Annotated[date | None, Query(alias="from")] = None,
    end: Annotated[date | None, Query(alias="to")] = None,
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT {_COLUMNS}
            FROM ledger
            WHERE voided_at IS NULL
              AND ($1::date IS NULL OR occurred_on >= $1)
              AND ($2::date IS NULL OR occurred_on <= $2)
            ORDER BY occurred_on DESC, occurred_at DESC NULLS LAST, created_at DESC
            LIMIT 2000
            """,
            start,
            end,
        )
    return {"items": [_row(r) for r in rows], "in_cats": IN_CATS, "out_cats": OUT_CATS}


@router.post("/api/admin/ledger")
async def create_entry(body: EntryIn, admin: AdminAccount):
    cats = IN_CATS if body.kind == "in" else OUT_CATS
    if body.category not in cats:
        raise HTTPException(status_code=400, detail="类别从选项里挑")
    if body.occurred_on > now_cn().date():
        raise HTTPException(status_code=400, detail="日期不能晚于今天")
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""
            INSERT INTO ledger (occurred_on, kind, category, memo, counterparty, amount, account,
                                source, created_by, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, '手记', $8::uuid, $9)
            RETURNING {_COLUMNS}
            """,
            body.occurred_on,
            body.kind,
            body.category,
            body.memo.strip(),
            (body.counterparty or "").strip() or None,
            body.amount,
            (body.account or "").strip() or None,
            admin["id"],
            now_cn(),
        )
    return _row(row)


@router.post("/api/admin/ledger/{entry_id}/void")
async def void_entry(entry_id: UUID, _: AdminAccount):
    pool = await get_pool()
    async with pool.acquire() as conn:
        done = await conn.fetchval(
            "UPDATE ledger SET voided_at = $2 WHERE id = $1::uuid AND voided_at IS NULL RETURNING id",
            entry_id,
            now_cn(),
        )
    if done is None:
        raise HTTPException(status_code=404, detail="这笔不在了")
    return {"ok": True}
