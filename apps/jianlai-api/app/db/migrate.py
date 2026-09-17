from __future__ import annotations

from pathlib import Path

import asyncpg

SQL_DIR = Path(__file__).resolve().parents[2] / "sql"


async def run_migrations(pool: asyncpg.Pool) -> None:
    files = sorted(SQL_DIR.glob("*.sql"))
    if not files:
        raise RuntimeError(f"未找到迁移 SQL：{SQL_DIR}")
    async with pool.acquire() as conn:
        for path in files:
            await conn.execute(path.read_text(encoding="utf-8"))
