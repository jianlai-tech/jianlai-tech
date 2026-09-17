from __future__ import annotations

import re
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.db.pool import get_pool, row_to_dict
from app.timezone import now_cn

router = APIRouter(tags=["留资"])

PHONE_RE = re.compile(r"^1\d{10}$")
ALLOWED_SCENES = {"未选", "家教教培", "分销批发", "制造贸易", "其他"}


class LeadIn(BaseModel):
    company_name: str = Field(min_length=1, max_length=80)
    contact_name: str = Field(min_length=1, max_length=40)
    phone: str = Field(min_length=11, max_length=11)
    wechat: str | None = Field(default=None, max_length=40)
    scene: str = "未选"
    note: str | None = Field(default=None, max_length=500)
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
    company = body.company_name.strip()
    contact = body.contact_name.strip()
    if not company or not contact:
        raise HTTPException(status_code=400, detail="公司和联系人不能空")

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO leads (
                company_name, contact_name, phone, wechat, scene, note, source, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, created_at
            """,
            company,
            contact,
            phone,
            _clean(body.wechat),
            scene,
            _clean(body.note),
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
            SELECT id, company_name, contact_name, phone, wechat, scene, note, source, created_at
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
