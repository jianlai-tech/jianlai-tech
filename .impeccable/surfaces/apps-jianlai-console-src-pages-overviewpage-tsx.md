---
version: 1
slug: "apps-jianlai-console-src-pages-overviewpage-tsx"
primary_target: "apps/jianlai-console/src/pages/OverviewPage.tsx"
related_targets: ["apps/jianlai-console/src/pages/SalesPage.tsx","apps/jianlai-console/src/pages/HrPage.tsx","apps/jianlai-console/src/pages/FinancePage.tsx"]
---

范围：剑来内务后台（总览、销售、人事、财务），模式 Operate。
使用者：主理人书剑，之后是问剑门道友。每天坐着用：回访留资、判断派人、评四维、记账催款。
约束：骨架学洋葱，皮用官网已锁定的剑谱世界；名册和公司主体是真的，其余示意并带「示意」标；不编业绩；对内档位不进官网包。
未决：登录与权限、接库（销售用 leads 表，其余表未建）、问剑门暂无道友。

## Direction contract

THESIS：后台是一本摊开的账簿，不是一面仪表盘墙。拒绝同级彩色图标卡片、渐变和泡泡圆角。

OWN-WORLD：青灰 #2B372C 的书函做左侧模块轨；旧纸 #EFE6D2 做画布，纸面 #F8F2E3 用发丝线分栏，不用投影；浓墨 #1C1A17；朱砂 #A8322A 只给选中、逾期、亏损、未读和朱印；入账用 #3F5B3F。数据用无衬线加等宽数字，衬线只给标题，楷体只给短注。

STORY：书剑打开就看到“今天要办的事”，逾期的排在最前，三个模块的事混在一处；点进销售从留资办到派人，点进人事评四维看最薄处，点进财务记账催款。

FIRST VIEWPORT：左侧 232px 青灰模块轨，右侧页标题加日期，下面一行六格灰条汇总，再下左宽右窄两栏：左边“要办的事”列表，右边“现场与人”和“本周谁有空”。手机上轨换成底部四格模块条。

FORM：账簿式 Operate 后台，在剑谱世界里扩一个内务表面；未跑方向掷骰（世界已定，书剑要求直接做）。

FINISH：unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
