from __future__ import annotations

import re
from typing import Annotated, Literal

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.db.pool import get_pool, row_to_dict
from app.timezone import now_cn

router = APIRouter(tags=["留资"])

PHONE_RE = re.compile(r"^1\d{10}$")
ALLOWED_SCENES = {"未选", "家教教培", "分销批发", "制造贸易", "其他"}
LeadKind = Literal["project", "referral"]


class LeadIn(BaseModel):
    kind: LeadKind = "project"
    # 简要介绍：项目留资写公司哪里卡住；转介绍写引荐的是谁、什么情况
    note: str = Field(min_length=1, max_length=500)
    contact_name: str = Field(min_length=1, max_length=40)
    phone: str = Field(min_length=11, max_length=11)
    company_name: str | None = Field(default=None, max_length=80)
    wechat: str | None = Field(default=None, max_length=40)
    scene: str = "未选"
    source: str = "官网"


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    text = value.strip()
    return text or None


@router.post("/api/leads")
async def create_lead(body: LeadIn):
    phone = body.phone.strip()
    if not PHONE_RE.fullmatch(phone):
        raise HTTPException(status_code=400, detail="手机号写成 11 位大陆号")
    scene = body.scene.strip() if body.scene else "未选"
    if scene not in ALLOWED_SCENES:
        raise HTTPException(status_code=400, detail="场景不在可选里")
    note = body.note.strip()
    contact = body.contact_name.strip()
    if not note or not contact:
        raise HTTPException(status_code=400, detail="介绍和称呼不能空")

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO leads (
                kind, company_name, contact_name, phone, wechat, scene, note, source, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, created_at
            """,
            body.kind,
            _clean(body.company_name),
            contact,
            phone,
            _clean(body.wechat),
            scene,
            note,
            (body.source or "官网").strip() or "官网",
            now_cn(),
        )
    data = row_to_dict(row)
    return {"ok": True, "id": str(data["id"])}


@router.get("/api/leads")
async def list_leads(x_admin_token: Annotated[str | None, Header()] = None):
    if not settings.leads_admin_token:
        raise HTTPException(status_code=403, detail="还没设回访口令")
    if x_admin_token != settings.leads_admin_token:
        raise HTTPException(status_code=403, detail="回访口令不对")
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, kind, company_name, contact_name, phone, wechat, scene, note, source, created_at
            FROM leads
            ORDER BY created_at DESC
            LIMIT 200
            """
        )
    items = []
    for row in rows:
        item = row_to_dict(row)
        item["id"] = str(item["id"])
        created = item.get("created_at")
        if created is not None:
            item["created_at"] = created.isoformat()
        items.append(item)
    return {"items": items}
