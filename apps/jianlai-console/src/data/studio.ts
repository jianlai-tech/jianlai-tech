/**
 * 名册是真的：来自 knowledge/工作室.md。
 * 门派 / 境界只在对内用，所以这些数据只放在本 App，不进官网包。
 */

export type Gate = '问剑门' | '破阵门' | '映剑门'

export type Person = {
  /** 与 staff.id / 人事档案一致 */
  id: string
  slug: string
  alias: string
  name: string
  /** 道长不入某一门 */
  gate: Gate | null
  /** 1–9；道长九境 */
  realmNo: number
  portrait: string
  chief?: boolean
}

export const REALMS = [
  '识剑境',
  '握剑境',
  '磨剑境',
  '开锋境',
  '出鞘境',
  '御剑境',
  '剑意境',
  '剑域境',
  '剑仙境',
] as const

export type Tier = 1 | 2 | 3

export const TIER_NAME: Record<Tier, string> = {
  1: '下三境',
  2: '中三境',
  3: '上三境',
}

export function tierOfRealm(realmNo: number): Tier {
  if (realmNo <= 3) return 1
  if (realmNo <= 6) return 2
  return 3
}

export function realmName(person: Person) {
  return REALMS[person.realmNo - 1]
}

export const PEOPLE: Person[] = [
  {
    id: 'b2600128-feb6-5147-a88c-cf8b53ca841c',
    slug: 'shujian',
    alias: '书剑',
    name: '赵书剑',
    gate: null,
    realmNo: 9,
    portrait: '/people/shujian.webp',
    chief: true,
  },
  { id: '15688b82-f327-58cc-a86f-816764767d6b', slug: 'mumu', alias: '木木', name: '吴桐', gate: '破阵门', realmNo: 4, portrait: '/people/mumu.webp' },
  { id: '8c9ad04e-d4b9-5bfe-86d6-17279944e606', slug: 'yungu', alias: '云故', name: '杨成焯', gate: '破阵门', realmNo: 4, portrait: '/people/yungu.webp' },
  { id: '6ba1272e-959e-5c65-9503-6315c30cd590', slug: 'huangyixuan', alias: '黄奕轩', name: '黄奕轩', gate: '破阵门', realmNo: 4, portrait: '/people/huangyixuan.webp' },
  { id: '46a6d7f2-56dc-5a57-9322-fcda5f4f5993', slug: 'jiong', alias: '囧', name: '易鑫辉', gate: '破阵门', realmNo: 4, portrait: '/people/jiong.webp' },
  { id: '8e5cf881-fb87-5047-b12d-4ac69bc32a0d', slug: 'xiaoyu', alias: '小鱼', name: '喻翔宇', gate: '破阵门', realmNo: 4, portrait: '/people/xiaoyu.webp' },
  { id: 'c731f666-f84e-5fd6-b7e1-5c9cfc076ffe', slug: 'xiaodui', alias: '小兑', name: '王悦', gate: '映剑门', realmNo: 4, portrait: '/people/xiaodui.webp' },
]

export const GATES: { name: Gate; craft: string; line: string }[] = [
  { name: '问剑门', craft: '销售', line: '登门问剑，把该接的现场接回来' },
  { name: '破阵门', craft: '开发', line: '打通系统，做底座和智能体' },
  { name: '映剑门', craft: '设计', line: '让现场的人一眼会用' },
]

export function person(slug: string) {
  return PEOPLE.find((item) => item.slug === slug)
}

export function personTitle(item: Person) {
  return item.chief ? '道长 · 剑仙境' : `${item.gate} · ${realmName(item)}`
}

/** 剑的四维。口径来自工作室.md「剑的四维」 */
export type DimKey = 'edge' | 'sheath' | 'heart' | 'qi'

export const DIMS: {
  key: DimKey
  name: string
  asks: string
  levels: Record<Tier, string>
  note?: string
}[] = [
  {
    key: 'edge',
    name: '剑锋',
    asks: '专业能力',
    levels: {
      1: '会用工具，照着做对',
      2: '在带领下把一个需求做到上线',
      3: '独立承接复杂、跨系统需求',
    },
  },
  {
    key: 'sheath',
    name: '剑鞘',
    asks: '沟通协调',
    levels: {
      1: '有问题及时问，交接说清楚',
      2: '能跟客户对需求，跟同门对进度',
      3: '能跟老板谈判断，能带人',
    },
  },
  {
    key: 'heart',
    name: '剑心',
    asks: '情绪抗压',
    levels: {
      1: '被指出问题不慌，按时交',
      2: '需求变了、出了错，能稳住改',
      3: '客户施压、线上出事时替同门顶住',
    },
  },
  {
    key: 'qi',
    name: '剑气',
    asks: '身体与精力',
    levels: {
      1: '时间窗口里按时到，不断线',
      2: '连着驻场一段不垮',
      3: '长期驻场状态稳，会自己调',
    },
    note: '只看本人自报和实际出勤，不收体检报告和病历。',
  },
]

export const DISPATCH_BY_TIER: Record<Tier, string> = {
  1: '跟着进现场，不单接',
  2: '可在带领下负责一条链路',
  3: '可独立承接复杂需求',
}

export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'] as const

export const RESUME_FIELDS = ['擅长', '想做的', '做过的项目', '性格', '有空的时间'] as const

/** 与官网留资表一致的“要斩的不平事” */
export const FORMS = ['搬山', '断江', '倒海', '降妖', '镇魔', '敕神', '摘星', '摧城', '开天'] as const
export type FormName = (typeof FORMS)[number]

export const FORM_LINE: Record<FormName, string> = {
  搬山: '表不再手填，原有系统缺的补上',
  断江: '截住算错、重做流走的钱',
  倒海: '把散在各处的数据倒进一处',
  降妖: '统一口径，降住各算各的账',
  镇魔: '镇住不该看的人，翻到不该看的数',
  敕神: '让智能体听令，替人干活',
  摘星: '把增长的机会摘到手',
  摧城: '把 OA、CRM、ERP 打成一套',
  开天: '驻场的人留下，日常自己能跑',
}

/** 公司主体：来自 knowledge/公司.md（国家企业信用信息公示系统，2026-09-25） */
export const COMPANY = {
  name: '长沙市望城区剑来科技有限责任公司',
  creditCode: '91430112MAKP5D3E2T',
  kind: '有限责任公司(自然人独资)',
  legalPerson: '赵书剑',
  capital: '10 万元人民币',
  capitalNote: '认缴，出资期限 2031-09-01；实缴一栏登记处未填',
  founded: '2026-09-23',
  term: '长期',
  address: '湖南省长沙市望城区大泽湖街道大泽湖海归小镇研发中心1期2栋102室',
  authority: '长沙市望城区市场监督管理局',
  board: '不设股东会，不设董事会',
}
