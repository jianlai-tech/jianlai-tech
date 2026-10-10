# 仓库与命令

单仓，不要套 onion 三仓脚本。

## 定位

| 项 | 值 |
|----|-----|
| 仓 | `/Users/shujianzhao/Documents/shujian-coding/jianlai-tech` |
| 远端 | `https://github.com/jianlai-tech/jianlai-tech.git` |
| 日常分支 | `main` |
| API | `apps/jianlai-api`（端口 8020） |
| 官网 | `apps/jianlai-web`（端口 5190） |
| 内务 | `apps/jianlai-console`（端口 5191，路径 `/dashboard`） |
| DDL | `schemas/`，API 侧副本 `apps/jianlai-api/sql/` |

工作区根就是这个仓。命令都在根目录跑。

## 改动面

`plan` 按路径归类，决定发哪一端：

| 路径 | 归类 | 发布 |
|------|------|------|
| `apps/jianlai-api/`、`schemas/` | API / DDL | Railway；DDL 先手工进生产库 |
| `apps/jianlai-web/` | 官网 | Pages（和内务打在同一站点） |
| `apps/jianlai-console/` | 内务 | Pages 的 `/dashboard` |
| `justfile`、本技能、`AGENTS.md` | 工程 | 一般只提交；改了 `deploy-pages` 才重发 Pages |
| `knowledge/` | 文档 / 底稿 | 只提交。`*.local.md` 不提交 |

只改 API 不必发 Pages，除非接口路径或 CORS 影响已上线的后台包。只改官网/内务文案不必 `railway up`，但内务登录依赖的 API 域名是构建时写死的，改了 `VITE_API_BASE_URL` 必须重发 Pages。

## Git

```bash
git status --short
git diff
git diff --staged
git log -5 --oneline
git fetch
git log origin/main..HEAD --oneline
```

提交：

```bash
git add -- <明确路径>
git diff --cached
git commit -m "$(cat <<'EOF'
类型(范围): 描述

EOF
)"
```

推送默认 `git push origin HEAD`。禁止 `--force` 推 `main`。工作区不干净时不要顺手 `stash` 全仓。

## 检查

`python3 .agents/skills/jianlai-ship/scripts/jianlai_ship.py check`

- API 有改：`cd apps/jianlai-api && uv run ruff check app`（没有测试文件就不要空跑 pytest）
- 官网有改：`cd apps/jianlai-web && bun run build`；改了文案先 `just font-subset`
- 内务有改：`cd apps/jianlai-console && bun run build`
- `--full`：两端前端都构建，即使这次没改到

## 不要发进 git

gitignore 已管大部分。审查时再扫一遍：`.env`、`*.local.csv`、`knowledge/*.local.md`、人事/账号本地名单、`dist-pages/`、密钥、完整证件号。示例文件 `*.example.csv` 可以提交。
