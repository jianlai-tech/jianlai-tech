import asyncio
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.routes.accounts import router as accounts_router
from app.api.routes.admin import router as admin_router
from app.api.routes.health import router as health_router
from app.api.routes.leads import router as leads_router
from app.config import settings
from app.db.migrate import run_migrations
from app.db.pool import close_pool, init_pool
from app.logging_config import SLOW_REQUEST_THRESHOLD_MS, get_logger, setup_logging

setup_logging()
logger = get_logger("jianlai")

_SKIP_LOG_PATHS = {"/health", "/favicon.ico"}


async def _run_suier() -> None:
    from app.xiantong import serve

    try:
        await serve()
    except asyncio.CancelledError:
        raise
    except Exception as exc:  # noqa: BLE001  穗儿挂了不拖垮 API
        logger.warning("穗儿退出：%s", exc)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    bot_task = None
    if settings.wecom_bot_id and settings.wecom_bot_secret:
        bot_task = asyncio.create_task(_run_suier())
    pool = await init_pool()
    await run_migrations(pool)
    logger.info("jianlai-api 已启动")
    yield
    if bot_task is not None:
        bot_task.cancel()
    await close_pool()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """对照 onion-agent：一行请求日志，健康检查不刷。"""

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000)
        response.headers["X-Process-Time"] = str(duration_ms)

        path = request.url.path
        if path in _SKIP_LOG_PATHS:
            return response

        route = request.scope.get("endpoint")
        name = getattr(route, "__name__", "") or "request"
        status = response.status_code
        msg = f"{name} {request.method} {path} {status} {duration_ms}ms"
        extra = {
            "method": request.method,
            "path": path,
            "status": status,
            "duration_ms": duration_ms,
        }
        if status >= 500:
            logger.error(msg, extra=extra)
        elif status >= 400 or duration_ms >= SLOW_REQUEST_THRESHOLD_MS:
            logger.warning(msg, extra=extra)
        else:
            logger.info(msg, extra=extra)
        return response


app = FastAPI(
    title="jianlai-tech API",
    description="剑来科技接单留资",
    version="0.1.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
allow_all = origins == ["*"]
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else origins,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(leads_router)
app.include_router(accounts_router)
app.include_router(admin_router)
