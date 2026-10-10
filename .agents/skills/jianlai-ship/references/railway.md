# jianlai-api 的 Railway

运行时以 `use-railway` / Railway MCP 实际返回为准。ID 会变，变了改本页，不要写进代码。

| 项 | 当前值 |
|----|--------|
| 项目 | `jianlai-tech`（`31662acf-0808-4b80-b63c-8ecbbe80be87`） |
| 环境 | `production`（`651eeb60-76ef-498c-a110-1429dfcd8a34`） |
| 服务 | `jianlai-api`（`ab7afa1e-7f99-4fe4-9153-ffa18d4152ad`） |
| Postgres | 同项目服务，TCP 代理另查，不要把连接串写进 git |
| 公网 | `https://jianlai-api-production.up.railway.app` |
| Root Directory | `apps/jianlai-api` |
| 健康检查 | `/health` |
| 启动 | `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT --no-access-log --log-level warning` |

GitHub 仓已接到这个服务。`git push main` 会按 Root Directory 构建 `apps/jianlai-api`。

## 两种发法

1. **默认：推 `main`。** 等这次 Git 提交对应的部署 SUCCESS。MCP `list_deployments` 要带 `environment_id`。
2. **本地直传：`just deploy-api`。** 只在仓库根目录跑（justfile 已固定）。等价于 `railway up --service jianlai-api --environment production --detach`。用于还没提交但要看线上。直传部署记录常常没有 git SHA，verify 改看部署 ID 是否 SUCCESS，不要拿上一次 SUCCESS 充数。

禁止：`cd apps/jianlai-api && railway up`。云端已经在上传内容里再找 `apps/jianlai-api`，会构建失败。

## 上线证据

1. `GET https://jianlai-api-production.up.railway.app/health` → 200，`{"status":"ok","service":"jianlai-api"}`。`/health` 不打请求日志，这是有意的。
2. 部署记录：本次触发的那条是 SUCCESS。滚动发版时旧部署 `REMOVED` 正常。
3. 新增 GET 路由不是 404/5xx；401/403/422 说明路由在。有副作用的 POST 不自动探测。
4. 后台跨域：`Origin: https://jianlai.brewshujian.cafe`（以及本地 `http://localhost:5190`）预检登录接口必须 200。CORS 来自 `CORS_ORIGINS` / `app/config.py` 默认值，改完要发 API 才生效。

## DDL

`schemas/*.sql` 与 `apps/jianlai-api/sql/` 要先在生产 Postgres 执行，再发依赖新表的代码。`plan` 看到 `.sql` 会提醒。人事 seed、开账号不是发版步骤，用本地 csv + `just seed-* --apply`，且指向的库要说清楚是开发还是生产。

## 日志

对照 onion-agent：请求一行 `handler METHOD path status ms`。穗儿（AiBotSDK）心跳必须安静，走 `QuietAiBotLogger`，不要让 DEBUG 心跳把请求刷掉。
