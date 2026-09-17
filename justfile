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

dev-api:
    cd apps/jianlai-api && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8020

dev-web:
    cd apps/jianlai-web && bun run dev

dev:
    @echo "API: http://localhost:8020  Web: http://localhost:5190"
    @echo "分开两个终端跑 just dev-api 和 just dev-web"

build:
    cd apps/jianlai-api && uv sync
    cd apps/jianlai-web && bun install && bun run build
