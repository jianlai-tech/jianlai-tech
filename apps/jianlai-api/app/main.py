import asyncio
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.accounts import router as accounts_router
from app.api.routes.admin import router as admin_router
from app.api.routes.health import router as health_router
from app.api.routes.leads import router as leads_router
from app.config import settings
from app.db.migrate import run_migrations
from app.db.pool import close_pool, init_pool


async def _run_suier() -> None:
    from app.xiantong import serve

    try:
        await serve()
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        print(f"穗儿退出：{exc}", file=sys.stderr)


@asynccontextmanager
async def lifespan(app: FastAPI):
    bot_task = None
    if settings.wecom_bot_id and settings.wecom_bot_secret:
        bot_task = asyncio.create_task(_run_suier())
    pool = await init_pool()
    await run_migrations(pool)
    yield
    if bot_task is not None:
        bot_task.cancel()
    await close_pool()


app = FastAPI(
    title="jianlai-tech API",
    description="剑来科技接单留资",
    version="0.1.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
allow_all = origins == ["*"]
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
