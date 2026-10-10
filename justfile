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
    psql "${DATABASE_URL:-postgresql://jianlai:jianlai_dev@127.0.0.1:5434/jianlai}" -f schemas/002_studio.sql
    psql "${DATABASE_URL:-postgresql://jianlai:jianlai_dev@127.0.0.1:5434/jianlai}" -f schemas/003_leads_kind.sql
    psql "${DATABASE_URL:-postgresql://jianlai:jianlai_dev@127.0.0.1:5434/jianlai}" -f schemas/004_accounts.sql
    psql "${DATABASE_URL:-postgresql://jianlai:jianlai_dev@127.0.0.1:5434/jianlai}" -f schemas/005_staff_hr.sql

# 按本地名单开同门账号（名单不进仓库）。先不加 --apply 预览
seed-accounts *args:
    cd apps/jianlai-api && uv run python -m app.seed_accounts {{args}}

# 灌人事档案（身份证/银行卡/手机，名单不进仓库）。先不加 --apply 预览
seed-staff-hr *args:
    cd apps/jianlai-api && uv run python -m app.seed_staff_hr {{args}}

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

# API 必须在仓库根目录传。服务 Root Directory 已经是 apps/jianlai-api。
deploy-api:
    railway up --project 31662acf-0808-4b80-b63c-8ecbbe80be87 --environment production --service jianlai-api --detach

# 官网在根路径，内务后台在 /dashboard。账号是 Cloudflare 的 onion。
# 后台登录打 Railway 上的 jianlai-api。
deploy-pages:
    cd apps/jianlai-web && bun run build
    cd apps/jianlai-console && VITE_API_BASE_URL=https://jianlai-api-production.up.railway.app bun run build
    rm -rf dist-pages
    mkdir -p dist-pages/dashboard
    cp -R apps/jianlai-web/dist/. dist-pages/
    cp -R apps/jianlai-console/dist/. dist-pages/dashboard/
    printf '%s\n' \
      '/dashboard /dashboard/index.html 200' \
      '/dashboard/sales /dashboard/index.html 200' \
      '/dashboard/hr /dashboard/index.html 200' \
      '/dashboard/finance /dashboard/index.html 200' \
      '/dashboard/accounts /dashboard/index.html 200' \
      '/dashboard/me /dashboard/index.html 200' \
      '/dashboard/project /dashboard/index.html 200' \
      '/dashboard/* /dashboard/index.html 200' \
      '/* /index.html 200' > dist-pages/_redirects
    CLOUDFLARE_ACCOUNT_ID=b2e1f77e9ddad81bcb8f00349b89e32e wrangler pages deploy dist-pages --project-name jianlai --branch main --commit-dirty=true
