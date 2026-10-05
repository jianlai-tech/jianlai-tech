import { httpJson } from '@/lib/http'

export type LeadKind = 'project' | 'referral'

export type LeadPayload = {
  kind: LeadKind
  /** 简要介绍：项目写哪里卡住，转介绍写引荐的是谁、什么情况 */
  note: string
  contact_name: string
  phone: string
  company_name?: string
  wechat?: string
  scene?: string
  source?: string
}

export function submitLead(body: LeadPayload) {
  return httpJson<{ ok: boolean; id: string }>('/api/leads', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
