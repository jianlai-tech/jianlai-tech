# jianlai-tech 本地开发快捷命令

set shell := ["bash", "-cu"]

default:
    @just --list

db-up:
    docker compose up -d postgres

db-down:
    docker compose down

migrate:
    psql "${DATABASE_URL:-postgresql://jianlai:jianlai_dev@127.0.0.1:5434/jianlai}" -f schemas/001_leads.sql
    psql "${DATABASE_URL:-postgresql://jianlai:jianlai_dev@127.0.0.1:5434/jianlai}" -f schemas/003_leads_kind.sql
    psql "${DATABASE_URL:-postgresql://jianlai:jianlai_dev@127.0.0.1:5434/jianlai}" -f schemas/004_accounts.sql

# 按本地名单开同门账号（名单不进仓库）。先不加 --apply 预览
seed-accounts *args:
    cd apps/jianlai-api && uv run python -m app.seed_accounts {{args}}

dev-api:
    cd apps/jianlai-api && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8020

dev-web:
    cd apps/jianlai-web && bun run dev

dev-console:
    cd apps/jianlai-console && bun run dev

dev:
    @echo "API: http://localhost:8020  Web: http://localhost:5190  Console: http://localhost:5191"
    @echo "分开两个终端跑 just dev-api 和 just dev-web"

# 官网文案改完后重切毛笔字（志莽行书），只把用到的字打进首屏那份
font-subset:
    uv run --with fonttools --with brotli python apps/jianlai-web/scripts/subset-brush-font.py

build:
    cd apps/jianlai-api && uv sync
    cd apps/jianlai-web && bun install && bun run build
    cd apps/jianlai-console && bun install && bun run build

# 官网在根路径，内务后台在 /dashboard。账号是 Cloudflare 的 onion。
deploy-pages:
    cd apps/jianlai-web && bun run build
    cd apps/jianlai-console && bun run build
    rm -rf dist-pages
    mkdir -p dist-pages/dashboard
    cp -R apps/jianlai-web/dist/. dist-pages/
    cp -R apps/jianlai-console/dist/. dist-pages/dashboard/
    printf '%s\n' '/dashboard /dashboard/index.html 200' '/dashboard/* /dashboard/index.html 200' '/* /index.html 200' > dist-pages/_redirects
    CLOUDFLARE_ACCOUNT_ID=b2e1f77e9ddad81bcb8f00349b89e32e wrangler pages deploy dist-pages --project-name jianlai --branch main --commit-dirty=true
