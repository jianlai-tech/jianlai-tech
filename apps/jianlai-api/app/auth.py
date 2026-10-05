"""后台登录：手机号 + 密码，会话令牌存哈希。不引第三方库，密码用 hashlib.scrypt。"""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from datetime import timedelta
from typing import Annotated

from fastapi import Depends, Header, HTTPException

from app.db.pool import get_pool
from app.timezone import now_cn

SESSION_DAYS = 14
_SCRYPT = {"n": 2**14, "r": 8, "p": 1, "dklen": 32}


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, **_SCRYPT)
    return "scrypt$" + base64.b64encode(salt).decode() + "$" + base64.b64encode(digest).decode()


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, salt_b64, digest_b64 = stored.split("$")
    except ValueError:
        return False
    if scheme != "scrypt":
        return False
    salt = base64.b64decode(salt_b64)
    expected = base64.b64decode(digest_b64)
    actual = hashlib.scrypt(password.encode(), salt=salt, **_SCRYPT)
    return hmac.compare_digest(actual, expected)


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


_token_hash = token_hash


async def create_session(account_id) -> str:
    token = secrets.token_urlsafe(32)
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO sessions (token_hash, account_id, created_at, expires_at)
            VALUES ($1, $2::uuid, $3, $4)
            """,
            _token_hash(token),
            account_id,
            now_cn(),
            now_cn() + timedelta(days=SESSION_DAYS),
        )
    return token


async def drop_session(token: str) -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM sessions WHERE token_hash = $1", _token_hash(token))


def _bearer(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="请先登录")
    return authorization[7:].strip()


async def current_account(authorization: Annotated[str | None, Header()] = None) -> dict:
    token = _bearer(authorization)
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT a.id, a.kind, a.phone, a.name, a.is_admin, a.status, a.staff_slug,
                   a.company, a.must_change_password
            FROM sessions s
            JOIN accounts a ON a.id = s.account_id
            WHERE s.token_hash = $1 AND s.expires_at > $2
            """,
            _token_hash(token),
            now_cn(),
        )
    if row is None:
        raise HTTPException(status_code=401, detail="登录已过期，请重新登录")
    account = dict(row)
    if account["status"] != "active":
        raise HTTPException(status_code=403, detail="账号未开通或已停用")
    account["token"] = token
    return account


CurrentAccount = Annotated[dict, Depends(current_account)]


async def require_admin(account: CurrentAccount) -> dict:
    if not account["is_admin"]:
        raise HTTPException(status_code=403, detail="只有管理员能做这件事")
    return account


AdminAccount = Annotated[dict, Depends(require_admin)]


async def require_staff(account: CurrentAccount) -> dict:
    if account["kind"] != "staff":
        raise HTTPException(status_code=403, detail="只有剑来同门能看")
    return account


StaffAccount = Annotated[dict, Depends(require_staff)]
