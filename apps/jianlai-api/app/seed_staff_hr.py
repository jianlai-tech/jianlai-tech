"""
把人事档案灌进 staff + staff_hr。身份证、银行卡、手机属于个人信息，不进仓库。

名单默认 apps/jianlai-api/staff_hr.local.csv（*.local.csv 已 gitignore）。

用法：
    uv run python -m app.seed_staff_hr            # 只打印（号码打码）
    uv run python -m app.seed_staff_hr --apply    # 写库
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import re
from datetime import date
from pathlib import Path
from uuid import UUID

from app.db.migrate import run_migrations
from app.db.pool import close_pool, init_pool
from app.timezone import now_cn

DEFAULT_FILE = Path(__file__).resolve().parents[1] / "staff_hr.local.csv"
ID_RE = re.compile(r"^[0-9]{17}[0-9Xx]$")
PHONE_RE = re.compile(r"^1\d{10}$")
BANK_RE = re.compile(r"^\d{16,19}$")
ID_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
ID_CHECK = "10X98765432"

STAFF_META = {
    "shujian": {"role": "principal", "sort_order": 0, "specialty": "接现场、派驻场", "bio": "剑来科技主理人。", "public": True},
    "mumu": {"role": "fde", "sort_order": 10},
    "yungu": {"role": "fde", "sort_order": 20},
    "huangyixuan": {"role": "fde", "sort_order": 30},
    "jiong": {"role": "fde", "sort_order": 40},
    "xiaoyu": {"role": "fde", "sort_order": 50},
    "xiaodui": {"role": "fde", "sort_order": 60},
}


def _empty(value: str | None) -> str | None:
    text = (value or "").strip()
    return text or None


def _date(value: str | None) -> date | None:
    text = _empty(value)
    return date.fromisoformat(text) if text else None


def _check_id(number: str) -> None:
    number = number.upper()
    if not ID_RE.fullmatch(number):
        raise SystemExit(f"身份证号格式不对：{number[:6]}********")
    total = sum(int(ch) * w for ch, w in zip(number[:17], ID_WEIGHTS))
    if ID_CHECK[total % 11] != number[17]:
        raise SystemExit(f"身份证校验位不对：{number[:6]}********")


def _mask_id(number: str) -> str:
    return f"{number[:6]}********{number[-4:]}"


def _mask_phone(phone: str | None) -> str:
    if not phone:
        return "-"
    return f"{phone[:3]}****{phone[-4:]}"


def _mask_bank(card: str | None) -> str:
    if not card:
        return "-"
    return f"{card[:6]}****{card[-4:]}"


def _rows(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as fh:
        raw = list(csv.DictReader(fh))
    out = []
    slugs: set[str] = set()
    for i, row in enumerate(raw, start=2):
        slug = (row.get("slug") or "").strip()
        legal_name = (row.get("legal_name") or "").strip()
        id_number = (row.get("id_number") or "").strip().upper()
        phone = _empty(row.get("phone"))
        bank_card = _empty(row.get("bank_card"))
        staff_id = _empty(row.get("staff_id"))
        if not slug or not legal_name:
            raise SystemExit(f"第 {i} 行缺 slug 或姓名")
        if slug in slugs:
            raise SystemExit(f"第 {i} 行 slug 重复：{slug}")
        slugs.add(slug)
        _check_id(id_number)
        if phone and not PHONE_RE.fullmatch(phone):
            raise SystemExit(f"第 {i} 行手机号不对")
        if bank_card and not BANK_RE.fullmatch(bank_card):
            raise SystemExit(f"第 {i} 行银行卡号不对")
        if staff_id:
            UUID(staff_id)
        gender = _empty(row.get("gender"))
        if gender and gender not in {"男", "女"}:
            raise SystemExit(f"第 {i} 行性别只能是男或女")
        out.append(
            {
                "staff_id": staff_id,
                "slug": slug,
                "legal_name": legal_name,
                "gender": gender,
                "ethnicity": _empty(row.get("ethnicity")),
                "birth_on": _date(row.get("birth_on")),
                "id_number": id_number,
                "id_address": _empty(row.get("id_address")),
                "id_issued_by": _empty(row.get("id_issued_by")),
                "id_valid_from": _date(row.get("id_valid_from")),
                "id_valid_to": _date(row.get("id_valid_to")),
                "phone": phone,
                "bank_card": bank_card,
                "note": _empty(row.get("note")),
            }
        )
    return out


async def _ensure_staff(conn, row: dict) -> str:
    existing = await conn.fetchval("SELECT id::text FROM staff WHERE slug = $1", row["slug"])
    if existing:
        return existing
    meta = STAFF_META.get(row["slug"], {"role": "fde", "sort_order": 90})
    staff_id = row["staff_id"]
    return await conn.fetchval(
        """
        INSERT INTO staff (id, slug, name, role, specialty, bio, sort_order, public)
        VALUES (COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8)
        RETURNING id::text
        """,
        staff_id,
        row["slug"],
        row["legal_name"],
        meta.get("role", "fde"),
        meta.get("specialty"),
        meta.get("bio"),
        meta.get("sort_order", 90),
        meta.get("public", True),
    )


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=Path, default=DEFAULT_FILE)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    if not args.file.exists():
        raise SystemExit(f"找不到名单：{args.file}")
    rows = _rows(args.file)

    for row in rows:
        print(
            f"{row['legal_name']}  {row['slug']}  {row['staff_id'] or '(库内生成)'}  "
            f"{_mask_id(row['id_number'])}  {_mask_phone(row['phone'])}  {_mask_bank(row['bank_card'])}"
        )
    if not args.apply:
        print("（只打印。加 --apply 写库）")
        return

    pool = await init_pool()
    await run_migrations(pool)
    stamped = now_cn()
    async with pool.acquire() as conn:
        for row in rows:
            async with conn.transaction():
                staff_id = await _ensure_staff(conn, row)
                await conn.execute(
                    """
                    INSERT INTO staff_hr (
                        staff_id, legal_name, gender, ethnicity, birth_on,
                        id_number, id_address, id_issued_by, id_valid_from, id_valid_to,
                        phone, bank_card, note, created_at, updated_at
                    )
                    VALUES (
                        $1::uuid, $2, $3, $4, $5,
                        $6, $7, $8, $9, $10,
                        $11, $12, $13, $14, $14
                    )
                    ON CONFLICT (staff_id) DO UPDATE SET
                        legal_name = EXCLUDED.legal_name,
                        gender = EXCLUDED.gender,
                        ethnicity = EXCLUDED.ethnicity,
                        birth_on = EXCLUDED.birth_on,
                        id_number = EXCLUDED.id_number,
                        id_address = EXCLUDED.id_address,
                        id_issued_by = EXCLUDED.id_issued_by,
                        id_valid_from = EXCLUDED.id_valid_from,
                        id_valid_to = EXCLUDED.id_valid_to,
                        phone = EXCLUDED.phone,
                        bank_card = EXCLUDED.bank_card,
                        note = EXCLUDED.note,
                        updated_at = EXCLUDED.updated_at
                    """,
                    staff_id,
                    row["legal_name"],
                    row["gender"],
                    row["ethnicity"],
                    row["birth_on"],
                    row["id_number"],
                    row["id_address"],
                    row["id_issued_by"],
                    row["id_valid_from"],
                    row["id_valid_to"],
                    row["phone"],
                    row["bank_card"],
                    row["note"],
                    stamped,
                )
                print(f"已写入  {row['legal_name']}  {staff_id}")
    await close_pool()
    print(f"共 {len(rows)} 人")


if __name__ == "__main__":
    asyncio.run(main())
