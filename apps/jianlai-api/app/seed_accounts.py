"""
从本地名单开通同门账号。名单里有手机号和身份证后 6 位，属于个人信息，不进仓库。

名单文件（默认 apps/jianlai-api/staff_accounts.local.csv，已 gitignore），表头：
    phone,name,id_tail,staff_slug,is_admin,gate,realm_no

用法：
    uv run python -m app.seed_accounts            # 只打印要做什么
    uv run python -m app.seed_accounts --apply    # 写库

已有账号（按手机号）跳过，不覆盖密码。
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import re
from pathlib import Path

from app.auth import hash_password
from app.db.migrate import run_migrations
from app.db.pool import close_pool, init_pool

DEFAULT_FILE = Path(__file__).resolve().parents[1] / "staff_accounts.local.csv"
PHONE_RE = re.compile(r"^1\d{10}$")
ID_TAIL_RE = re.compile(r"^\d{5}[\dX]$")


def _rows(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    out = []
    for i, row in enumerate(rows, start=2):
        phone = (row.get("phone") or "").strip()
        id_tail = (row.get("id_tail") or "").strip().upper()
        if not PHONE_RE.fullmatch(phone):
            raise SystemExit(f"第 {i} 行手机号不对：{phone!r}")
        if not ID_TAIL_RE.fullmatch(id_tail):
            raise SystemExit(f"第 {i} 行身份证后 6 位不对")
        out.append(
            {
                "phone": phone,
                "name": row["name"].strip(),
                "id_tail": id_tail,
                "staff_slug": (row.get("staff_slug") or "").strip() or None,
                "is_admin": (row.get("is_admin") or "").strip().lower() in {"1", "true", "是", "y"},
                "gate": (row.get("gate") or "").strip() or None,
                "realm_no": int((row.get("realm_no") or "0").strip() or 0),
            }
        )
    admins = [r for r in out if r["is_admin"]]
    if len(admins) != 1:
        raise SystemExit(f"名单里管理员必须正好 1 个，现在是 {len(admins)} 个")
    return out


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=Path, default=DEFAULT_FILE)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    if not args.file.exists():
        raise SystemExit(f"找不到名单：{args.file}")
    rows = _rows(args.file)

    for row in rows:
        tag = "管理员" if row["is_admin"] else "同门"
        print(
            f"{tag}  {row['name']}  {row['phone'][:3]}****{row['phone'][-4:]}  {row['gate'] or '-'} {row['realm_no']}"
        )
    if not args.apply:
        print("（只打印。加 --apply 写库）")
        return

    pool = await init_pool()
    await run_migrations(pool)
    created = 0
    async with pool.acquire() as conn:
        for row in rows:
            async with conn.transaction():
                account_id = await conn.fetchval(
                    """
                    INSERT INTO accounts (kind, phone, name, password_hash, staff_slug, is_admin, status, must_change_password)
                    VALUES ('staff', $1, $2, $3, $4, $5, 'active', false)
                    ON CONFLICT (phone) DO NOTHING
                    RETURNING id
                    """,
                    row["phone"],
                    row["name"],
                    hash_password(row["id_tail"]),
                    row["staff_slug"],
                    row["is_admin"],
                )
                if account_id is None:
                    continue
                await conn.execute(
                    "INSERT INTO staff_certs (account_id, gate, realm_no) VALUES ($1, $2, $3)",
                    account_id,
                    row["gate"],
                    row["realm_no"],
                )
                await conn.execute(
                    "INSERT INTO staff_profiles (account_id) VALUES ($1)", account_id
                )
                created += 1
    await close_pool()
    print(f"新开 {created} 个，跳过 {len(rows) - created} 个（手机号已有账号）")


if __name__ == "__main__":
    asyncio.run(main())
