---
name: jianlai-ship
description: >
  提交、推送并发布剑来科技（jianlai-tech）改动：审查、检查、Git、Railway 上的 jianlai-api、Cloudflare Pages 上的官网+内务，并核对实际上线。
  用户说 ship、提交、推代码、上线、发布、deploy、railway up、deploy-pages，或「一次性推上去部署」时必须用本技能。
  只改代码或只看状态时不要自动发布。不要拿 onion-ship / EdgeOne / CloudBase 来发剑来。
---

# 剑来提交与发布

单仓 `jianlai-tech`。和 onion-ship 同一套节奏：**必须不错的环节交给脚本，语义判断留给 Agent**。路径、ID、命令见 [仓库](references/repos.md)、[Railway](references/railway.md)、[Pages](references/pages.md)。审查口径见 [提交前审查](references/code-review.md)。

密钥、身份证、银行卡、手机号名单不进 skill、不进 git。发版读 `justfile` 和 gitignore，不要把 `.env` 里的值写进提交说明或回复。

## 选模式

| 用户说 | 模式 | 做什么 |
|--------|------|--------|
| ship / 提交 / 推上去 / 上线 | 任务范围 | 只纳入本任务文件 |
| 全部 / 一次性 / 所有改动都推 | 全量 | 工作区全部未提交和未推送 |
| 只发 API / railway up | 仅 API | 不碰 Pages |
| 只发前台 / deploy-pages | 仅 Pages | 不碰 Railway（后台接口没变时） |
| 仅本地 / 不推 | 本地 | 做到提交为止 |
| 开 PR | PR | 功能分支 + `gh pr create`，不默认合并 |

范围说不清时先 `plan`，不要自己删别人的半成品。

## 流程

在仓库**根目录**跑（`jianlai-tech/`，不要进 `apps/jianlai-api`）：

```bash
S=.agents/skills/jianlai-ship/scripts/jianlai_ship.py
python3 $S plan           # 改动面、DDL 提醒、禁止提交的文件
# 读 diff，按 references/code-review.md 审；中高风险先修完
python3 $S check          # 按改动面构建。全量加 --full
# git add 明确路径 → 中文提交。有 DDL：先在生产库执行
git push origin HEAD      # 默认 API 通道，Railway 跟 GitHub main
# 或用户明确要本地直传：just deploy-api（必须在仓库根目录）
# Railway MCP list_deployments：等到这次部署 SUCCESS
just deploy-pages         # 官网 + /dashboard，VITE_API_BASE_URL 打进内务包
python3 $S verify
```

顺序固定：**生产 DDL → API → Pages**。内务登录打线上 API；API 没上、CORS 没放行、Pages 包里没有 API 域名，后台都会挂。

`git push` 是 API 的默认通道（Railway 已接 GitHub `jianlai-tech/jianlai-tech`，Root Directory `apps/jianlai-api`）。`railway up` 只用于「工作区还没提交但要先看线上」；**必须在仓库根目录**，`just deploy-api` 已经写死了这一点。在 `apps/jianlai-api` 里 `railway up` 会变成「找不到 Root directory apps/jianlai-api」。

## 提交

- 中文：`<类型>(<范围>): <描述>`。类型：`新增` / `修复` / `优化` / `重构` / `文档` / `配置`。范围如 `官网` / `内务` / `API` / `留资` / `人事` / `部署`。
- `git add` 只加明确路径。先 `git diff --cached` 再 commit。
- 禁止纳入：`.env`、`*.local.csv`、`knowledge/*.local.md`、`staff_hr.local.csv`、`staff_accounts.local.csv`、`dist/`、`dist-pages/`、身份证/银行卡/手机明文。
- 改了官网正文：发 Pages 前 `just font-subset`。
- 禁止 force push `main`，不跳过 hooks，不改 git 身份。网上有新提交先并入，冲突判断不了业务就停。

## 怎么证明上线

`verify` 分四层，没跑的层写「未验证」。构建通过 ≠ 业务可用。

| 层 | 证据 |
|----|------|
| 已推送 | `origin/main` 包含本次提交（仅 git 通道） |
| API 上线 | `/health` 为 200 且 `service=jianlai-api`；本次部署记录是 SUCCESS，不是上一条别人的 SUCCESS |
| CORS | `Origin: https://jianlai.brewshujian.cafe` 预检 `POST /api/auth/login` 回 200，并带回这个 Origin |
| 前台上线 | `https://jianlai.brewshujian.cafe/dashboard/` 入口 JS 已离开发布前那个；chunk 里有 `jianlai-api-production.up.railway.app` |

最新一条 SUCCESS 不能顶替「这一次」。EdgeOne 免费次数已超额，默认不要用它发剑来。浏览器点登录只在用户要求时做，且不要把密码写进回复。

## 收尾

分开写：提交了什么、API 怎么发的（git / `railway up`）、Pages 发了没有、四层核对各是什么。审查跳过要写明。生产库 seed、改人的密码，不是 ship 的一部分。
