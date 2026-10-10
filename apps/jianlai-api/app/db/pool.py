from __future__ import annotations

import ssl
from urllib.parse import parse_qs, urlparse, urlunparse

import asyncpg

from app.config import settings

_pool: asyncpg.Pool | None = None


def row_to_dict(row: asyncpg.Record) -> dict:
    return dict(row)


def _ssl_for(host: str, sslmode: str):
    railway_proxy = host.endswith((".proxy.rlwy.net", ".rlwy.net"))
    needs_ssl = sslmode in {"require", "verify-ca", "verify-full"} or railway_proxy
    if not needs_ssl:
        return None
    ctx = ssl.create_default_context()
    if railway_proxy or sslmode == "require":
        # Railway TCP 代理链上是自签中间证，校验会失败。
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
    return ctx


def _asyncpg_connect_args(database_url: str) -> dict:
    parsed = urlparse(database_url)
    query = parse_qs(parsed.query)
    sslmode = (query.get("sslmode") or [""])[0].lower()
    host = parsed.hostname or ""
    clean = parsed._replace(query="")
    return {
        "dsn": urlunparse(clean),
        "ssl": _ssl_for(host, sslmode),
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
