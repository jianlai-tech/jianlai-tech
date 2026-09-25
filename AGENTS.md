---
description: jianlai-tech — 剑来科技 FDE 工作室（L1 热启动）
alwaysApply: true
---

# jianlai-tech · 剑来科技

```text
角色：AI + 大学生驻场，打通系统、自研底座、定制智能体的工作室（组织上像建筑事务所）
边界：官网接单留资 + 案例集 + 驻场名册；不做客户业务后台
语言：中文沟通 · 中文注释 · 中文提交
对外名：剑来科技 / 剑来。禁止写「见来」
```

## 仓库结构

| 路径 | 说明 |
|------|------|
| `apps/jianlai-api` | FastAPI，默认端口 **8020** |
| `apps/jianlai-web` | React 人机界面，默认端口 **5190** |
| `knowledge/` | 产品业务知识；案例底稿在 `knowledge/案例/` |
| `schemas/` | PostgreSQL DDL |

## 工程 SOP

### 后端

- FastAPI + Pydantic v2 + asyncpg，依赖管理用 `uv`
- SQL 占位符 `$1/$2`，禁止字符串拼接
- 写入 timestamptz 用 `now_cn()`，禁止 `datetime.now()`
- 凭据只从 `.env` 读

### 前端

- bun + Vite + React 19 + TanStack Router / Query
- API 走 `src/lib/http.ts`
- 案例与名册先走 `src/content/`，与 `knowledge/` 同步
- 完成改动后 `bun run build`

## 红线

1. 禁止 hardcoded 生产凭据
2. 禁止对外写客户真名或编造业绩数字
3. 禁止把本站做成家教招生或 SaaS 定价
4. 本地只用 `docker-compose` 开发库
5. 视觉世界未锁定前，禁止把 jpp / 洋葱的界面皮抄过来
6. 对内档位以 `knowledge/工作室.md` 的剑修门派为准，禁止再编一套；人名未收入本仓不上官网；道长、门派、境界禁止写进官网正文

## 端口

- API：**8020**
- Web：**5190**
- PG 开发：**5434** → 容器 5432

## 部署

前台：腾讯云 EdgeOne Makers，接 GitHub `main`，根目录 `apps/jianlai-web`。
推 `main` 自动构建。默认 `.edgeone.cool` 未绑自定义域时直开会 401。

本期 EdgeOne 免费构建次数已超额（控制台曾见 586/500），新项目可能要升配额才能自动构建。

## 提交规范

中文 Commit：`<类型>(<范围>): <描述>`

类型：`新增` / `修复` / `优化` / `重构` / `文档` / `配置`
范围示例：`官网` / `留资` / `案例` / `名册` / `部署`
