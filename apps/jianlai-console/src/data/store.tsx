import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fromToday, todayIso } from '@/lib/date'
import { PEOPLE, type DimKey, type FormName, type Tier } from '@/data/studio'

/**
 * 本文件里除名册（studio.ts）外，全是示意数据，页面上都标「示意」。
 * 接库之前，所有改动只活在内存里，刷新即回到初始。
 * 日期用 fromToday 偏移，所以示意数据永远跟着真实日期走。
 */

/* ───────── 销售 ───────── */

export type Stage = 'new' | 'talked' | 'judge' | 'sent' | 'drop'

export const STAGES: { key: Stage; label: string }[] = [
  { key: 'new', label: '待回访' },
  { key: 'talked', label: '已回访' },
  { key: 'judge', label: '待判断' },
  { key: 'sent', label: '已派人' },
  { key: 'drop', label: '不接' },
]

export type Lead = {
  id: string
  company: string
  contact: string
  phone: string
  source: '官网' | '笔记' | '转介绍'
  scene: FormName
  note: string
  createdAt: string
  nextFollow: string | null
  stage: Stage
  sentTo: string[]
  dropReason?: string
}

const SEED_LEADS: Lead[] = [
  {
    id: 'l1',
    company: '某连锁药房',
    contact: '王总',
    phone: '138 **** 5821',
    source: '笔记',
    scene: '降妖',
    note: '门店和总部对账靠人核，月底最慌。',
    createdAt: fromToday(-1),
    nextFollow: fromToday(0),
    stage: 'new',
    sentTo: [],
  },
  {
    id: 'l2',
    company: '某钢管贸易商',
    contact: '李经理',
    phone: '139 **** 0417',
    source: '官网',
    scene: '摧城',
    note: '进销存和财务两套软件，数据互相不认。',
    createdAt: fromToday(-4),
    nextFollow: fromToday(-1),
    stage: 'new',
    sentTo: [],
  },
  {
    id: 'l3',
    company: '某少儿美术机构',
    contact: '陈老师',
    phone: '137 **** 9063',
    source: '转介绍',
    scene: '搬山',
    note: '排课、收费、续费都在表格里，三个人轮着录。',
    createdAt: fromToday(-6),
    nextFollow: fromToday(2),
    stage: 'talked',
    sentTo: [],
  },
  {
    id: 'l4',
    company: '某跨境电商公司',
    contact: '周总',
    phone: '186 **** 3350',
    source: '官网',
    scene: '倒海',
    note: '多个平台后台的订单要汇到一处，想看真实利润。',
    createdAt: fromToday(-8),
    nextFollow: null,
    stage: 'judge',
    sentTo: [],
  },
  {
    id: 'l5',
    company: '某医疗器械经销商',
    contact: '赵经理',
    phone: '135 **** 7742',
    source: '笔记',
    scene: '断江',
    note: '渠道返点和库存损耗说不清。',
    createdAt: fromToday(-14),
    nextFollow: null,
    stage: 'sent',
    sentTo: ['mumu', 'yungu'],
  },
  {
    id: 'l6',
    company: '某小型装修公司',
    contact: '孙老板',
    phone: '151 **** 2208',
    source: '官网',
    scene: '开天',
    note: '想要“全自动”，但手上没有可联通的系统。',
    createdAt: fromToday(-11),
    nextFollow: null,
    stage: 'drop',
    sentTo: [],
    dropReason: '现阶段没有可以接的系统',
  },
]

export type SiteStatus = '立项中' | '驻场中' | '维保'

export type Site = {
  id: string
  industry: string
  status: SiteStatus
  staff: string[]
  since: string
  next: string
}

const SEED_SITES: Site[] = [
  {
    id: 's1',
    industry: '医疗器械批发分销',
    status: '驻场中',
    staff: ['mumu', 'yungu'],
    since: fromToday(-70),
    next: '渠道订单和仓配对账接通',
  },
  {
    id: 's2',
    industry: 'K12 一对一家教',
    status: '维保',
    staff: ['xiaoyu', 'xiaodui'],
    since: fromToday(-300),
    next: '课酬口径调整',
  },
  {
    id: 's3',
    industry: '管材贸易',
    status: '立项中',
    staff: ['huangyixuan'],
    since: fromToday(-9),
    next: '梳理进销存和财务的对接点',
  },
]

/* ───────── 人事 ───────── */

export type Eval = Partial<Record<DimKey, Tier>>

/** 每人周一到周五能否驻场（示意）。下标 0–4 对应周一到周五 */
const SEED_WINDOWS: Record<string, boolean[]> = {
  shujian: [true, true, true, true, true],
  mumu: [true, true, false, true, true],
  yungu: [true, false, true, true, false],
  huangyixuan: [false, true, true, false, true],
  jiong: [true, true, true, false, false],
  xiaoyu: [false, false, true, true, true],
  xiaodui: [true, true, false, false, true],
}

/* ───────── 财务 ───────── */

export type EntryKind = 'in' | 'out'

export const IN_CATS = ['驻场费', '开发费', '维保费'] as const
export const OUT_CATS = ['驻场补贴', '模型与工具', '场地', '差旅', '税费', '其他'] as const

export type Entry = {
  id: string
  date: string
  kind: EntryKind
  category: string
  memo: string
  counterparty: string
  amount: number
}

const SEED_LEDGER: Entry[] = [
  {
    id: 'e1',
    date: fromToday(-8),
    kind: 'out',
    category: '场地',
    memo: '研发中心 1 期 2 栋 102 室 · 首季租金',
    counterparty: '园区',
    amount: 6000,
  },
  {
    id: 'e2',
    date: fromToday(-5),
    kind: 'out',
    category: '模型与工具',
    memo: '文字模型接口充值',
    counterparty: 'Sophnet',
    amount: 500,
  },
  {
    id: 'e3',
    date: fromToday(-3),
    kind: 'out',
    category: '其他',
    memo: '刻章与银行开户',
    counterparty: '—',
    amount: 420,
  },
  {
    id: 'e4',
    date: fromToday(-1),
    kind: 'in',
    category: '驻场费',
    memo: '首期款',
    counterparty: '医疗器械批发分销',
    amount: 30000,
  },
  {
    id: 'e5',
    date: fromToday(0),
    kind: 'out',
    category: '模型与工具',
    memo: '识图模型接口充值',
    counterparty: 'OpenRouter',
    amount: 300,
  },
]

export type Receivable = {
  id: string
  counterparty: string
  reason: string
  due: string
  amount: number
  category: (typeof IN_CATS)[number]
  paidOn?: string
}

const SEED_RECEIVABLES: Receivable[] = [
  {
    id: 'r1',
    counterparty: 'K12 一对一家教',
    reason: '维保月费',
    due: fromToday(-3),
    amount: 3000,
    category: '维保费',
  },
  {
    id: 'r2',
    counterparty: '医疗器械批发分销',
    reason: '驻场二期款',
    due: fromToday(5),
    amount: 20000,
    category: '驻场费',
  },
  {
    id: 'r3',
    counterparty: '管材贸易',
    reason: '立项定金',
    due: fromToday(12),
    amount: 10000,
    category: '开发费',
  },
]

/* ───────── store ───────── */

type Store = {
  leads: Lead[]
  sites: Site[]
  evals: Record<string, Eval>
  windows: Record<string, boolean[]>
  ledger: Entry[]
  receivables: Receivable[]
  advanceLead: (id: string) => void
  sendLead: (id: string, slugs: string[]) => void
  dropLead: (id: string, reason: string) => void
  reopenLead: (id: string) => void
  setEval: (slug: string, dim: DimKey, tier: Tier | null) => void
  toggleWindow: (slug: string, day: number) => void
  addEntry: (entry: Omit<Entry, 'id'>) => void
  receive: (id: string) => void
}

const StoreContext = createContext<Store | null>(null)

let seq = 100

function nextId(prefix: string) {
  seq += 1
  return `${prefix}${seq}`
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState(SEED_LEADS)
  const [sites] = useState(SEED_SITES)
  const [evals, setEvals] = useState<Record<string, Eval>>({})
  const [windows, setWindows] = useState(SEED_WINDOWS)
  const [ledger, setLedger] = useState(SEED_LEDGER)
  const [receivables, setReceivables] = useState(SEED_RECEIVABLES)

  const patchLead = useCallback((id: string, patch: Partial<Lead>) => {
    setLeads((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }, [])

  const advanceLead = useCallback(
    (id: string) => {
      setLeads((rows) =>
        rows.map((row) => {
          if (row.id !== id) return row
          if (row.stage === 'new') return { ...row, stage: 'talked', nextFollow: fromToday(3) }
          if (row.stage === 'talked') return { ...row, stage: 'judge', nextFollow: null }
          return row
        }),
      )
    },
    [],
  )

  const sendLead = useCallback(
    (id: string, slugs: string[]) => patchLead(id, { stage: 'sent', sentTo: slugs, nextFollow: null }),
    [patchLead],
  )

  const dropLead = useCallback(
    (id: string, reason: string) =>
      patchLead(id, { stage: 'drop', dropReason: reason, nextFollow: null }),
    [patchLead],
  )

  const reopenLead = useCallback(
    (id: string) =>
      patchLead(id, { stage: 'new', nextFollow: todayIso(), dropReason: undefined, sentTo: [] }),
    [patchLead],
  )

  const setEval = useCallback((slug: string, dim: DimKey, tier: Tier | null) => {
    setEvals((all) => {
      const current = { ...(all[slug] ?? {}) }
      if (tier === null) delete current[dim]
      else current[dim] = tier
      return { ...all, [slug]: current }
    })
  }, [])

  const toggleWindow = useCallback((slug: string, day: number) => {
    setWindows((all) => {
      const row = [...(all[slug] ?? [false, false, false, false, false])]
      row[day] = !row[day]
      return { ...all, [slug]: row }
    })
  }, [])

  const addEntry = useCallback((entry: Omit<Entry, 'id'>) => {
    setLedger((rows) => [{ ...entry, id: nextId('e') }, ...rows])
  }, [])

  const receive = useCallback(
    (id: string) => {
      const target = receivables.find((row) => row.id === id)
      if (!target || target.paidOn) return
      const date = todayIso()
      setReceivables((rows) => rows.map((row) => (row.id === id ? { ...row, paidOn: date } : row)))
      setLedger((rows) => [
        {
          id: nextId('e'),
          date,
          kind: 'in',
          category: target.category,
          memo: target.reason,
          counterparty: target.counterparty,
          amount: target.amount,
        },
        ...rows,
      ])
    },
    [receivables],
  )

  const value = useMemo<Store>(
    () => ({
      leads,
      sites,
      evals,
      windows,
      ledger,
      receivables,
      advanceLead,
      sendLead,
      dropLead,
      reopenLead,
      setEval,
      toggleWindow,
      addEntry,
      receive,
    }),
    [
      leads,
      sites,
      evals,
      windows,
      ledger,
      receivables,
      advanceLead,
      sendLead,
      dropLead,
      reopenLead,
      setEval,
      toggleWindow,
      addEntry,
      receive,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore 必须在 DataProvider 内使用')
  return store
}

/** 驻场可派的人：不含道长 */
export const DISPATCHABLE = PEOPLE.filter((item) => !item.chief)
