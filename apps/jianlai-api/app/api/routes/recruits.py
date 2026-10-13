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
RecruitTrack = Literal["watch", "work"]

# 年级 → 走哪条路：大一大二跟着观摩学，大三起（含研究生）时间够才接活
GRADES: tuple[str, ...] = ("大一", "大二", "大三", "大四", "研一", "研二", "研三", "博士", "其他")
WATCH_ONLY = {"大一", "大二"}
WEEKLY_HOURS: tuple[str, ...] = ("10 小时以内", "10–20 小时", "20–30 小时", "30 小时以上")
CS_BASES: tuple[str, ...] = ("计算机相关专业", "自学过编程", "用 AI 做成过东西", "暂时没有")
TALENTS: tuple[str, ...] = ("唱歌", "跳舞", "设计", "体育", "摄影剪辑", "写作", "主持表达", "乐器", "组织活动")

_COLUMNS = """id, name, age, school, major, grade, track, weekly_hours, cs_base, talents,
              ai_story, strengths, phone, wechat, source, status, admin_note, handled_at, created_at"""


class RecruitIn(BaseModel):
    name: str = Field(min_length=1, max_length=20)
    school: str | None = Field(default=None, max_length=60)
    major: str = Field(min_length=1, max_length=40)
    grade: str = Field(min_length=1, max_length=10)
    track: RecruitTrack
    weekly_hours: str = Field(min_length=1, max_length=20)
    cs_base: str = Field(min_length=1, max_length=20)
    talents: list[str] = Field(default_factory=list, max_length=12)
    strengths: str | None = Field(default=None, max_length=800)
    ai_story: str | None = Field(default=None, max_length=1500)
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
    if not (name and major):
        raise HTTPException(status_code=400, detail="姓名、专业都要写")
    if body.grade not in GRADES:
        raise HTTPException(status_code=400, detail="年级从选项里挑")
    if body.weekly_hours not in WEEKLY_HOURS:
        raise HTTPException(status_code=400, detail="每周时间从选项里挑")
    if body.cs_base not in CS_BASES:
        raise HTTPException(status_code=400, detail="计算机基础从选项里挑")
    # 大一大二只能先观摩，前端绕过来也压回去
    track = "watch" if body.grade in WATCH_ONLY else body.track
    talents = [t for t in dict.fromkeys(x.strip() for x in body.talents) if t in TALENTS]
    values = (
        name,
        _clean(body.school),
        major,
        body.grade,
        track,
        body.weekly_hours,
        body.cs_base,
        talents,
        _clean(body.strengths),
        _clean(body.ai_story),
        _clean(body.wechat),
    )

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
                SET name = $2, school = $3, major = $4, grade = $5, track = $6,
                    weekly_hours = $7, cs_base = $8, talents = $9, strengths = $10,
                    ai_story = $11, wechat = $12
                WHERE id = $1
                """,
                existing,
                *values,
            )
            return {"ok": True, "id": str(existing), "updated": True, "track": track}

        row_id = await conn.fetchval(
            """
            INSERT INTO recruits (
                name, school, major, grade, track, weekly_hours, cs_base, talents,
                strengths, ai_story, wechat, phone, source, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id
            """,
            *values,
            phone,
            (body.source or "官网").strip()[:20] or "官网",
            now_cn(),
        )
    return {"ok": True, "id": str(row_id), "updated": False, "track": track}


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
    track: RecruitTrack | None = None,
    q: str | None = Query(default=None, max_length=40),
):
    keyword = _clean(q)
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT {_COLUMNS}
            FROM recruits
            WHERE ($1::text IS NULL OR status = $1)
              AND ($3::text IS NULL OR track = $3)
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
            track,
        )
        counts = await conn.fetch("SELECT status, count(*)::int AS n FROM recruits GROUP BY status")
        track_counts = await conn.fetch(
            "SELECT track, count(*)::int AS n FROM recruits WHERE track IS NOT NULL GROUP BY track"
        )
    by_status = {key: 0 for key in STATUSES}
    for row in counts:
        by_status[row["status"]] = row["n"]
    by_track = {"watch": 0, "work": 0}
    for row in track_counts:
        by_track[row["track"]] = row["n"]
    return {
        "items": [_row(r) for r in rows],
        "counts": by_status,
        "tracks": by_track,
        "total": sum(by_status.values()),
    }


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
            RETURNING {_COLUMNS}
            """.format(_COLUMNS=_COLUMNS),
            recruit_id,
            body.status,
            body.admin_note is not None,
            _clean(body.admin_note),
            now_cn(),
        )
    if row is None:
        raise HTTPException(status_code=404, detail="这张帖子不在了")
    return _row(row)
