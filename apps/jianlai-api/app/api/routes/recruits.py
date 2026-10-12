"""英雄帖：官网招剑修。公开表单只写入；名单、跟进只给管理员。"""

from __future__ import annotations

import re
from datetime import timedelta
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.auth import AdminAccount
from app.db.pool import get_pool
from app.timezone import now_cn

router = APIRouter(tags=["英雄帖"])

PHONE_RE = re.compile(r"^1\d{10}$")
RecruitStatus = Literal["new", "contacted", "trial", "joined", "declined"]
STATUSES: tuple[str, ...] = ("new", "contacted", "trial", "joined", "declined")


class RecruitIn(BaseModel):
    name: str = Field(min_length=1, max_length=20)
    age: int = Field(ge=14, le=60)
    school: str | None = Field(default=None, max_length=60)
    major: str = Field(min_length=1, max_length=40)
    ai_story: str = Field(min_length=1, max_length=1500)
    strengths: str = Field(min_length=1, max_length=800)
    phone: str = Field(min_length=11, max_length=11)
    wechat: str | None = Field(default=None, max_length=40)
    source: str = "官网"


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    text = value.strip()
    return text or None


@router.post("/api/recruits")
async def create_recruit(body: RecruitIn):
    phone = body.phone.strip()
    if not PHONE_RE.fullmatch(phone):
        raise HTTPException(status_code=400, detail="手机号写成 11 位大陆号")
    name = body.name.strip()
    major = body.major.strip()
    ai_story = body.ai_story.strip()
    strengths = body.strengths.strip()
    if not (name and major and ai_story and strengths):
        raise HTTPException(status_code=400, detail="姓名、专业、AI 经历、特长都要写")

    pool = await get_pool()
    async with pool.acquire() as conn:
        # 同一手机号一天内重复递帖：更新原帖，不刷屏
        existing = await conn.fetchval(
            """
            SELECT id FROM recruits
            WHERE phone = $1 AND created_at > $2
            ORDER BY created_at DESC
            LIMIT 1
            """,
            phone,
            now_cn() - timedelta(days=1),
        )
        if existing is not None:
            await conn.execute(
                """
                UPDATE recruits
                SET name = $2, age = $3, school = $4, major = $5, ai_story = $6,
                    strengths = $7, wechat = $8
                WHERE id = $1
                """,
                existing,
                name,
                body.age,
                _clean(body.school),
                major,
                ai_story,
                strengths,
                _clean(body.wechat),
            )
            return {"ok": True, "id": str(existing), "updated": True}

        row_id = await conn.fetchval(
            """
            INSERT INTO recruits (
                name, age, school, major, ai_story, strengths, phone, wechat, source, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
            """,
            name,
            body.age,
            _clean(body.school),
            major,
            ai_story,
            strengths,
            phone,
            _clean(body.wechat),
            (body.source or "官网").strip()[:20] or "官网",
            now_cn(),
        )
    return {"ok": True, "id": str(row_id), "updated": False}


def _row(record) -> dict:
    item = dict(record)
    item["id"] = str(item["id"])
    for key in ("created_at", "handled_at"):
        if item.get(key) is not None:
            item[key] = item[key].isoformat()
    return item


@router.get("/api/admin/recruits")
async def list_recruits(
    _: AdminAccount,
    status: RecruitStatus | None = None,
    q: str | None = Query(default=None, max_length=40),
):
    keyword = _clean(q)
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, name, age, school, major, ai_story, strengths, phone, wechat, source,
                   status, admin_note, handled_at, created_at
            FROM recruits
            WHERE ($1::text IS NULL OR status = $1)
              AND ($2::text IS NULL
                   OR name ILIKE '%' || $2 || '%'
                   OR major ILIKE '%' || $2 || '%'
                   OR school ILIKE '%' || $2 || '%'
                   OR phone LIKE '%' || $2 || '%')
            ORDER BY created_at DESC
            LIMIT 500
            """,
            status,
            keyword,
        )
        counts = await conn.fetch("SELECT status, count(*)::int AS n FROM recruits GROUP BY status")
    by_status = {key: 0 for key in STATUSES}
    for row in counts:
        by_status[row["status"]] = row["n"]
    return {"items": [_row(r) for r in rows], "counts": by_status, "total": sum(by_status.values())}


class RecruitPatch(BaseModel):
    status: RecruitStatus | None = None
    admin_note: str | None = Field(default=None, max_length=1000)


@router.patch("/api/admin/recruits/{recruit_id}")
async def update_recruit(recruit_id: UUID, body: RecruitPatch, _: AdminAccount):
    if body.status is None and body.admin_note is None:
        raise HTTPException(status_code=400, detail="没有要改的")
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE recruits
            SET status = COALESCE($2, status),
                admin_note = CASE WHEN $3::boolean THEN $4 ELSE admin_note END,
                handled_at = CASE WHEN $2::text IS NOT NULL AND $2 <> status THEN $5 ELSE handled_at END
            WHERE id = $1::uuid
            RETURNING id, name, age, school, major, ai_story, strengths, phone, wechat, source,
                      status, admin_note, handled_at, created_at
            """,
            recruit_id,
            body.status,
            body.admin_note is not None,
            _clean(body.admin_note),
            now_cn(),
        )
    if row is None:
        raise HTTPException(status_code=404, detail="这张帖子不在了")
    return _row(row)
