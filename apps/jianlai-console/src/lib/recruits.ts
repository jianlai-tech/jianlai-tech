import { api } from '@/lib/api'

export type RecruitStatus = 'new' | 'contacted' | 'trial' | 'joined' | 'declined'

export const RECRUIT_STATUSES: { key: RecruitStatus; label: string }[] = [
  { key: 'new', label: '新帖' },
  { key: 'contacted', label: '已约聊' },
  { key: 'trial', label: '试手中' },
  { key: 'joined', label: '已入门' },
  { key: 'declined', label: '不合适' },
]

export type Recruit = {
  id: string
  name: string
  age: number
  school: string | null
  major: string
  ai_story: string
  strengths: string
  phone: string
  wechat: string | null
  source: string
  status: RecruitStatus
  admin_note: string | null
  handled_at: string | null
  created_at: string
}

export type RecruitList = {
  items: Recruit[]
  counts: Record<RecruitStatus, number>
  total: number
}

export function fetchRecruits(params: { status?: RecruitStatus; q?: string } = {}) {
  const search = new URLSearchParams()
  if (params.status) search.set('status', params.status)
  if (params.q) search.set('q', params.q)
  const qs = search.toString()
  return api<RecruitList>(`/api/admin/recruits${qs ? `?${qs}` : ''}`)
}

export function updateRecruit(id: string, body: { status?: RecruitStatus; admin_note?: string }) {
  return api<Recruit>(`/api/admin/recruits/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}
