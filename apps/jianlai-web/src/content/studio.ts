export type Tone = 'yellow' | 'pink' | 'teal'

export type ResumeField = 'skills' | 'prefers' | 'projects' | 'character' | 'window'

export const RESUME_FIELDS: { key: ResumeField; label: string }[] = [
  { key: 'skills', label: '擅长' },
  { key: 'prefers', label: '想做的' },
  { key: 'projects', label: '做过的项目' },
  { key: 'character', label: '性格' },
  { key: 'window', label: '有空的时间' },
]

export type StaffRecord = {
  slug: string
  alias: string
  name?: string
  role: 'principal' | 'fde'
  craft: '道长' | '开发' | '设计' | '销售'
  portrait: string
  tone: Tone
  resume: Partial<Record<ResumeField, string>>
  public: boolean
}

export const STAFF: StaffRecord[] = [
  {
    slug: 'shujian',
    alias: '书剑',
    name: '赵书剑',
    role: 'principal',
    craft: '道长',
    portrait: '/people/shujian.webp',
    tone: 'yellow',
    resume: {
      skills: '接活，判断能不能帮上忙，安排谁去、做多久。',
      projects: 'K12 一对一家教、医疗器械批发分销、管材贸易。',
    },
    public: true,
  },
  {
    slug: 'mumu',
    alias: '木木',
    name: '吴桐',
    role: 'fde',
    craft: '开发',
    portrait: '/people/mumu.webp',
    tone: 'teal',
    resume: {},
    public: true,
  },
  {
    slug: 'yungu',
    alias: '云故',
    name: '杨成焯',
    role: 'fde',
    craft: '开发',
    portrait: '/people/yungu.webp',
    tone: 'pink',
    resume: {},
    public: true,
  },
  {
    slug: 'xiaoyu',
    alias: '小鱼',
    name: '喻翔宇',
    role: 'fde',
    craft: '开发',
    portrait: '/people/xiaoyu.webp',
    tone: 'yellow',
    resume: {},
    public: true,
  },
  {
    slug: 'huangyixuan',
    alias: '黄奕轩',
    role: 'fde',
    craft: '开发',
    portrait: '/people/huangyixuan.webp',
    tone: 'teal',
    resume: {},
    public: true,
  },
  {
    slug: 'jiong',
    alias: '囧',
    name: '易鑫辉',
    role: 'fde',
    craft: '开发',
    portrait: '/people/jiong.webp',
    tone: 'pink',
    resume: {},
    public: true,
  },
  {
    slug: 'xiaodui',
    alias: '小兑',
    name: '王悦',
    role: 'fde',
    craft: '设计',
    portrait: '/people/xiaodui.webp',
    tone: 'yellow',
    resume: {},
    public: true,
  },
]

export function publicStaff() {
  return STAFF.filter((item) => item.public)
}

export function principal() {
  return STAFF.find((item) => item.role === 'principal')
}

export function residents() {
  return publicStaff().filter((item) => item.role === 'fde')
}

export function displayName(person: StaffRecord) {
  return person.name && person.name !== person.alias ? `${person.alias} · ${person.name}` : person.alias
}
