from fastapi import APIRouter

router = APIRouter(tags=["健康检查"])


@router.get("/health")
@router.get("/api/health")
async def health():
    return {"status": "ok", "service": "jianlai-api"}
