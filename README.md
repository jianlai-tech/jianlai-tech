# 见来 · jianlai-tech

驻场做经营系统的工作室。本仓是接单留资站，不是客户业务后台。

## 结构

```text
jianlai-tech/
├── apps/jianlai-api/    FastAPI，端口 8020
├── apps/jianlai-web/    React 19 + TanStack，端口 5190
├── knowledge/           业务知识
├── schemas/             PostgreSQL DDL
└── AGENTS.md            L1 热启动
```

## 本地启动

```bash
just db-up
just migrate
cp apps/jianlai-api/.env.example apps/jianlai-api/.env
just dev-api
# 另一终端
just dev-web
```

- 前台：http://localhost:5190
- API：http://localhost:8020/health

## 部署

GitHub `main` → 腾讯云 [EdgeOne Makers](https://console.cloud.tencent.com/edgeone/makers)。构建根目录 `apps/jianlai-web`，安装 `bun install`，构建 `bun run build`，输出 `dist`。

[![Deploy with EdgeOne Makers](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https://github.com/ShukriChiu/jianlai-tech&project-name=jianlai-tech&root-directory=apps/jianlai-web&install-command=bun%20install&build-command=bun%20run%20build&output-directory=dist)
