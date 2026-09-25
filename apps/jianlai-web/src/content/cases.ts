export type CasePlate = {
  src: string
  caption: string
}

export type CaseRecord = {
  slug: string
  industry: string
  stuckAt?: string
  built?: string
  processWords: string[]
  whoUses?: string
  pitch?: string
  published: boolean
  plates: CasePlate[]
}

export const CASES: CaseRecord[] = [
  {
    slug: 'k12-jiajiao',
    industry: 'K12 一对一家教',
    stuckAt: '试课、成交、上课、消课、课酬、家长沟通散在表格和聊天里。',
    built: '一条能跑的经营链路：试课、成交、消课、课酬、四端。',
    processWords: ['试课', '成交', '消课', '课酬', '四端'],
    whoUses: '教务、转化、老师、家长',
    pitch: '派人进一家 K12 一对一家教公司，把试课到课酬做成能跑的系统。',
    published: true,
    plates: [
      { src: '/cases/jiajiao-trials.png', caption: '试课台。名单已糊，留下工序。' },
      { src: '/cases/jiajiao-input.png', caption: '录单台。线索进成交的那一格。' },
      { src: '/cases/jiajiao-deals.png', caption: '成交台。数字是空的，栏是真的。' },
      { src: '/cases/jiajiao-lessons.png', caption: '课酬审核。今日待审是空的，链路在。' },
    ],
  },
  {
    slug: 'yiliao-fenxiao',
    industry: '医疗器械批发分销',
    stuckAt: '客户、供应商、货品、订单、渠道各在一套账里，对不上。',
    built: '主数据、多渠道订单、仓配、对账接到同一套经营系统。',
    processWords: ['主数据', '订单', '仓配', '对账'],
    whoUses: '老板、采购、仓库、门店、对账',
    pitch: '派人进一家医疗器械批发分销公司，把货、渠道、仓、账做成能对上的系统。',
    published: true,
    plates: [],
  },
  {
    slug: 'guancai-maoyi',
    industry: '管材贸易',
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
