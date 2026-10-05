---
description: jianlai-console — 剑来科技内务后台（销售 / 人事 / 财务）
alwaysApply: false
---

# jianlai-console

剑来科技**自己**的内务后台，不是客户业务后台。总览、销售、人事、财务四个模块。端口 **5191**，本地和线上都挂在 `/dashboard`。

线上：`https://jianlai.brewshujian.cafe/dashboard`（Cloudflare Pages 项目 `jianlai`，和官网打在同一个站点里）。重新发布用仓库根目录 `just deploy-pages`。

- bun + Vite + React 19 + TanStack Router + Tailwind 3 + lucide-react
- 单独成 App，不并进 `jianlai-web`：名册里有门派、境界，对内信息不能打进官网的公开包
- 改完跑 `bun run build`
- 禁止把方向合同写进 HTML / JSX 注释

## 骨架参考洋葱，皮不参考

- 骨架学 `onion-dashboard`：Operate 高密度、左侧模块轨、一行灰条汇总（对应 `EmphasisMetricStrip`）、表格加右侧详情、跨模块待办聚合、破坏性操作二次确认。
- 皮用官网已锁定的剑谱世界：旧纸 `paper` / `sheet`、浓墨 `ink`、朱印 `cinnabar`、青灰 `rail`。**禁止**照抄洋葱的雾灰、酸绿、圆角 3xl 软卡。
- 数据区用无衬线 + 等宽数字；衬线只给页标题和区块标题；楷体只给短注释。毛笔字体不进后台。

## 数据口径

| 数据 | 真假 | 来源 |
|---|---|---|
| 账号、登录、剑来认证、项目进度与角色 | 真 | `apps/jianlai-api`（`accounts` / `sessions` / `staff_profiles` / `staff_certs` / `projects` / `project_members`，DDL `schemas/004_accounts.sql`） |
| 名册、门派、境界、四维口径 | 真 | `knowledge/工作室.md`，落在 `src/data/studio.ts` |
| 公司主体 | 真 | `knowledge/公司.md`，落在 `studio.ts` 的 `COMPANY` |
| 留资线索、现场分配、流水、应收、时间窗口 | **示意** | `src/data/store.tsx`，页面上都带「示意」标 |

## 登录与权限

官网顶栏「登录」和页脚进 `/dashboard/`。手机号 + 密码，令牌存 `localStorage`，接口带 `Authorization: Bearer`。

| 身份 | 怎么来 | 能看 |
|---|---|---|
| 管理员 | 只有赵书剑（`is_admin`） | 总览 / 销售 / 人事 / 财务 / 账号与认证 / 我的档案 |
| 同门（驻场） | 名单经 `seed_accounts` 或「账号 → 新开同门」开通；初始密码身份证后 6 位，末位 X 大写 | 只有「我的档案」 |
| 合作企业 | 管理员建号后是「待付款开通」，确认收款点「确认付款并开通」才能登录 | 只有「项目进度」，只看挂在自己名下的项目 |

- 首次登录（或被重置）必须先改密码，至少 8 位。身份证号不入库，只存初始密码的 scrypt 哈希。
- 个人信息分两块：**个性化**（称呼、一句话、擅长、想做的、性格、有空时间）本人改，对外展示用；**剑来认证**（门派、境界、四维、参与项目的角色和进度）只有管理员改，本人只读。
- 停用账号会立刻踢掉它的全部会话；管理员不能停用自己。
- 批量开同门：在 `apps/jianlai-api/staff_accounts.local.csv` 按 `staff_accounts.example.csv` 填真实手机号和身份证后 6 位（`*.local.csv` 已 gitignore），`uv run python -m app.seed_accounts` 先预览，加 `--apply` 写库。

- 示意数据日期一律用 `fromToday(n)` 偏移，不写死日历日。
- 接库之前改动只活在内存里，刷新回到初始。
- 禁止把示意金额、客户数写成真实业绩；客户只写行业；电话只留掩码。
- 接库时：先把 `store.tsx` 的 seed 换成 `apps/jianlai-api` 的接口，删掉对应页面上的 `DemoTag`。`leads` 表已存在（`schemas/001_leads.sql`），`staff` 表已存在（`002_studio.sql`），`ledger` / `receivables` / `evals` / `windows` / `sites` 还没建。

## 视觉约定

- 平面优先，靠发丝线分层，不用投影抬卡。圆角 2px。
- 朱砂只用于：当前选中、逾期、亏损、未读数、朱印。一屏占比要克制。
- 盈亏极性：入账用 `jade`，支出用墨色加减号，亏损和逾期用 `cinnabar`。禁止拿 jade 以外的绿或橙表示钱。
- 朱印（`Stamp`）只盖在“已落定”的事上：已派人、已收。
- 汇总用 `MetricStrip` 灰条，禁止同级彩色图标卡片墙。
- 弹窗不是第一反应：详情走右侧栏，录入走行内展开。
- 动效 ≤ 220ms，尊重 `prefers-reduced-motion`。
