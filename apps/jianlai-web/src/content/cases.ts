import { JIAOPEI_CHAPTERS, JIAOPEI_LEDGER, JIAOPEI_MODEL, JIAOPEI_VISIT } from '@/content/case-jiaopei'

export type CasePlate = {
  src: string
  caption: string
}

/** 一章：按剑来九式拆，一式一章 */
export type CaseChapter = {
  /** 对应九式的式名 */
  form: string
  title: string
  body: string
  did: string[]
  /** 驻场眉批，只写过程 */
  note?: string
  plate?: CasePlate
}

/** 商业模式这一页：两条线怎么赚钱，卡在哪，怎么盘活 */
export type CaseModel = {
  lead: string
  flow: string[]
  lines: { k: string; v: string }[]
  insight?: string
}

/** 投入与产出：不写价格；只写我们的投入（人、时间）和交付，客户的经营数字一律不写 */
export type CaseLedger = {
  span: string
  /** 账页大字，一句话说清结果，例如「十个月，全公司上线」 */
  headline: string
  team: string
  phases: { when: string; who: string; what: string }[]
  output: { k: string; v: string }[]
  /** 怎么干：响应、速度、往后 */
  craft: { k: string; v: string }[]
  /** 估算口径，必须写明，页面上一起展示 */
  basis: string
}

export type CaseRecord = {
  slug: string
  industry: string
  /** 书脊和封面用的短名，四个字以内；不写就用 industry */
  short?: string
  /** 门类：书架按它分格筛选，两个字，同一门类写法要一致 */
  sector: string
  stuckAt?: string
  built?: string
  /** 驻场的人进去具体干了什么，证明不是远程外包 */
  onSite?: string
  /** 眉批：驻场时真实踩过的坑。只写过程，不写数字、不写客户名 */
  notes?: string[]
  processWords: string[]
  whoUses?: string
  pitch?: string
  published: boolean
  plates: CasePlate[]
  /** 整册：有这三项的案例，可以翻开读成一本书 */
  model?: CaseModel
  visit?: string[]
  chapters?: CaseChapter[]
  /** 账页：投入与产出。只写我们的投入与交付，估值必须带口径 */
  ledger?: CaseLedger
}

export const CASES: CaseRecord[] = [
  {
    slug: 'jiaopei',
    industry: '教培 · 雅思与家教',
    short: '雅思家教',
    sector: '教育',
    stuckAt: '一家公司两门生意：成人雅思和中小学一对一家教。投流、线索、试课、成交、消课、课酬、人事、财务散在表格、聊天和几套软件里，段和段之间没人接。',
    built: '自研一套底座，把两门生意从投流到续费接成一条；财务、人事、审批、合同在同一套数据上；再在上面养了会自主迭代的数字员工。',
    onSite: '道长一个人先驻场摸透两门生意，从家教老师端起手，逐步接上雅思、财务、人事；暑期剑修入场集中驻场两个月，全公司上线。线上按部门开支撑群，一线提，当周改。',
    notes: [
      '跟了几周单才发现，课酬不止一套算法：一对一、一对二、试课各算各的。',
      '老师交课靠截图，审核全凭人眼看；先把「交课」做成一张有必填项的单，才谈得上自动过审。',
      '剩余课时以前在三个地方各记一份，对不上时谁也说不清该信哪个。定下一处为准，其余只读。',
      '家长端上线后，问得最多的不是功能，是「这节课到底算没算」。',
    ],
    processWords: ['转化', '教务', '财务', '人事', '运营', '数字员工'],
    whoUses: '老板、转化、教务、运营、财务、人事、老师、家长',
    pitch: '派人进一家同时做雅思和家教的教培公司，把两门生意从投流到续费接成一条，再养上会自主迭代的数字员工。',
    published: true,
    plates: [
      { src: '/cases/edu/overview.webp', caption: '经营看板，数字已清零' },
      { src: '/cases/edu/fam-trials.webp', caption: '试课管理，人名已打圈' },
      { src: '/cases/edu/finance.webp', caption: '财务管理，金额已清零' },
    ],
    model: JIAOPEI_MODEL,
    visit: JIAOPEI_VISIT,
    chapters: JIAOPEI_CHAPTERS,
    ledger: JIAOPEI_LEDGER,
  },
  {
    slug: 'yiliao-fenxiao',
    industry: '医疗器械批发分销',
    short: '器械分销',
    sector: '医疗',
    stuckAt: '客户、供应商、货品、订单、渠道各在一套账里，对不上。',
    built: '客户和货品统一成一份资料，各渠道订单、仓库发货、对账都在同一套系统里。',
    onSite: '先把散在几套账里的客户、货品收成一份，再一个渠道一个渠道把订单接进来；仓库、门店的人边用边提，盘点、收货这些现场活跟着补上。',
    notes: [
      '同一个货在几套系统里名字都不一样，先花了大力气认「这几个是不是同一个东西」。',
      '外卖平台的单和自家仓的单对不上，追下去是两边的时间口径不一样。',
      '盘点原来靠纸和笔，先做手机扫码录入，仓库的人才愿意用。',
    ],
    processWords: ['主数据', '订单', '仓配', '对账'],
    whoUses: '老板、采购、仓库、门店、对账',
    pitch: '派人进一家医疗器械批发分销公司，把货、销售渠道、仓库和账接到一套系统里，能对上。',
    published: true,
    plates: [],
  },
  {
    slug: 'guancai-maoyi',
    industry: '管材贸易',
    sector: '贸易',
    processWords: [],
    published: false,
    plates: [],
  },
]

export function publishedCases() {
  return CASES.filter((item) => item.published)
}

export function caseBySlug(slug: string) {
  return CASES.find((item) => item.slug === slug)
}
