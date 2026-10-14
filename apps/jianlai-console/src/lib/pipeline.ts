import { api, apiBlob, saveBlob } from '@/lib/api'
import type { CoopMode } from '@/lib/account'

// —— 需求文档 ——

export type ProjectDoc = {
  id: string
  project_id: string
  kind: 'requirement' | 'other'
  file_name: string
  file_mime: string
  file_size: number
  note: string | null
  uploaded_at: string
}

export const fetchDocs = (projectId: string) => api<{ items: ProjectDoc[] }>(`/api/admin/projects/${projectId}/docs`)

export function uploadDoc(projectId: string, file: File, note: string | null) {
  const form = new FormData()
  form.append('file', file)
  form.append('kind', 'requirement')
  if (note) form.append('note', note)
  return api<ProjectDoc>(`/api/admin/projects/${projectId}/docs`, { method: 'POST', body: form })
}

export async function downloadDoc(doc: ProjectDoc) {
  const { blob, name } = await apiBlob(`/api/admin/docs/${doc.id}/file`)
  saveBlob(blob, name ?? doc.file_name)
}

export const deleteDoc = (id: string) => api(`/api/admin/docs/${id}`, { method: 'DELETE' })

// —— 报价 ——

export type QuoteItem = { name: string; content: string; days: number; amount: number }
export type PayStep = { name: string; pct: number; condition: string }
export type ScheduleStep = { when: string; what: string; client: string }
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: '拟定中',
  sent: '已发客户',
  accepted: '客户已认',
  rejected: '没谈成',
}

export type QuoteInput = {
  project_id: string
  title: string
  party_a: string
  weeks: number
  items: QuoteItem[]
  ai_fee: number
  pay_plan: PayStep[]
  schedule: ScheduleStep[]
  onsite_per_week: number
  maintain_low: number
  maintain_high: number
  out_of_scope: string | null
  assumptions: string | null
  valid_days: number
}

export type Quote = QuoteInput & {
  id: string
  code: string
  status: QuoteStatus
  project_name: string
  dev_total: number
  days_total: number
  total: number
  created_at: string
  updated_at: string
}

/** 剑来项目制默认口径：40 / 30 / 25 / 5，每周 2 次驻场沟通，运维 1500–3000 */
export const DEFAULT_PAY_PLAN: PayStep[] = [
  { name: '预付款', pct: 40, condition: '合同签订后 3 个工作日内；到账后开工' },
  { name: '中期款', pct: 30, condition: '设计定稿，且中期可演示版经甲方确认' },
  { name: '验收款', pct: 25, condition: '上线并验收通过（提交验收后 7 个工作日内未书面提出问题的，视为通过）' },
  { name: '质保金', pct: 5, condition: '上线满 1 个月且无严重缺陷' },
]

export const fetchQuotes = () => api<{ items: Quote[] }>('/api/admin/quotes')

export const createQuote = (body: QuoteInput) =>
  api<Quote>('/api/admin/quotes', { method: 'POST', body: JSON.stringify(body) })

export const updateQuote = (id: string, body: QuoteInput) =>
  api<Quote>(`/api/admin/quotes/${id}`, { method: 'PUT', body: JSON.stringify(body) })

export const setQuoteStatus = (id: string, status: QuoteStatus) =>
  api<Quote>(`/api/admin/quotes/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) })

export async function downloadQuoteDocx(quote: Quote) {
  const { blob, name } = await apiBlob(`/api/admin/quotes/${quote.id}/docx`)
  saveBlob(blob, name ?? `${quote.code}-报价估算书.docx`)
}

// —— 分期 ——

export type PhaseKey = '前期' | '中期' | '后期' | '维护'
export const PHASES: PhaseKey[] = ['前期', '中期', '后期', '维护']
export const PHASE_HINT: Record<PhaseKey, string> = {
  前期: '需求确认、设计、方案定稿',
  中期: '开发、可演示版本',
  后期: '联调测试、上线、验收、培训',
  维护: '质保与月度运维；新功能另开模块',
}

export type PhaseStatus = 'todo' | 'doing' | 'done'
export const PHASE_STATUS_LABEL: Record<PhaseStatus, string> = { todo: '未开始', doing: '进行中', done: '完成' }

export type Phase = {
  phase: PhaseKey
  start_on: string | null
  end_on: string | null
  goal: string | null
  status: PhaseStatus
  pay_amount: number | null
  paid_on: string | null
}

export const fetchPhases = (projectId: string) => api<{ items: Phase[] }>(`/api/admin/projects/${projectId}/phases`)

export const savePhase = (projectId: string, body: Phase) =>
  api(`/api/admin/projects/${projectId}/phases`, { method: 'PUT', body: JSON.stringify(body) })

// —— 维护期新模块 ——

export const createModule = (projectId: string, name: string, mode: CoopMode) =>
  api<{ id: string }>(`/api/admin/projects/${projectId}/modules`, {
    method: 'POST',
    body: JSON.stringify({ name, mode }),
  })
