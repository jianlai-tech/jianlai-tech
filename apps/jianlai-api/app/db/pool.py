from __future__ import annotations

from urllib.parse import parse_qs, urlparse, urlunparse

import asyncpg

from app.config import settings

_pool: asyncpg.Pool | None = None


def row_to_dict(row: asyncpg.Record) -> dict:
    return dict(row)


def _asyncpg_connect_args(database_url: str) -> dict:
    parsed = urlparse(database_url)
    query = parse_qs(parsed.query)
    sslmode = (query.get("sslmode") or [""])[0].lower()
    host = parsed.hostname or ""
    needs_ssl = sslmode in {"require", "verify-ca", "verify-full"} or host.endswith(
        ".proxy.rlwy.net"
    )
    clean = parsed._replace(query="")
    return {
        "dsn": urlunparse(clean),
        "ssl": True if needs_ssl else None,
    }


async def init_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        args = _asyncpg_connect_args(settings.database_url)
        _pool = await asyncpg.create_pool(
            args["dsn"],
            ssl=args["ssl"],
            min_size=1,
            max_size=10,
        )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def get_pool() -> asyncpg.Pool:
    if _pool is None:
        return await init_pool()
    return _pool
