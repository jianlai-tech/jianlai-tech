# 官网 + 内务的 Cloudflare Pages

官网和内务打在**同一个** Pages 项目里，不是两个站点。

| 项 | 当前值 |
|----|--------|
| 项目 | `jianlai`（Cloudflare 账号 onion） |
| 发布命令 | 仓库根目录 `just deploy-pages` |
| 自定义域 | `https://jianlai.brewshujian.cafe` |
| DNS | DNSPod，不在 Cloudflare |
| 官网 | 站点根路径 |
| 内务 | `/dashboard` |
| 内务 API | 构建时写入 `VITE_API_BASE_URL=https://jianlai-api-production.up.railway.app` |

`just deploy-pages` 会：构建 web、用线上 API 地址构建 console、拼 `dist-pages/`（内务在 `dashboard/` 子目录）、写 SPA `_redirects`、`wrangler pages deploy`。账号 ID 只活在 justfile，不要抄进提交说明。

## 什么时候发

- 改了 `apps/jianlai-web` 或 `apps/jianlai-console`
- 改了内务依赖的 API 根地址
- 线上后台还在打相对路径 `/api/...`（表现为登录 POST 落到 Pages 上 405）——漏了 `VITE_API_BASE_URL`，必须重发

只改 API 实现、前台路径没变：不必发 Pages。

## 上线证据

1. 发之前记下 `https://jianlai.brewshujian.cafe/dashboard/` 和官网首页的入口 JS 文件名。
2. 发之后入口 JS 要换；内务 chunk 里必须出现 `jianlai-api-production.up.railway.app`。
3. `/dashboard`、`/dashboard/me`、`/dashboard/sales` 这类刷新必须回到内务包（`just deploy-pages` 会给每条后台路径写 200 回写；只写 `/dashboard/*` 时，Pages 会先在 `dashboard/` 目录里找文件，找不到就落到官网 `Not Found`）。
4. wrangler 打印的 `*.jianlai-4o7.pages.dev` 是预览域；用户用的是 `jianlai.brewshujian.cafe`，verify 打自定义域。

本地 `http://localhost:5190/dashboard/` 是 Vite 把 `/dashboard` 代理到 5191，和 Pages 不是同一套。本地 console 的 `.env.local` 可以指向 Railway，那只影响本机。

## 不要走的通道

- **EdgeOne Makers**：曾接 GitHub `main`、根目录 `apps/jianlai-web`。免费构建次数已超额，默认不要发、不要拿 `.edgeone.cool` 当生产。未绑自定义域直开会 401。
- 不要把内务并进官网包。门派、境界、人事只在 console。
- 不要用 CloudBase 发剑来。
- 探测带 `User-Agent: jianlai-ship`。Cloudflare 会拦默认 Python UA。
