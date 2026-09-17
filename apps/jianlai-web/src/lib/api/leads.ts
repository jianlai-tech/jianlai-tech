import { httpJson } from '@/lib/http'

export type LeadPayload = {
  company_name: string
  contact_name: string
  phone: string
  wechat?: string
  scene?: string
  note?: string
  source?: string
}

export function submitLead(body: LeadPayload) {
  return httpJson<{ ok: boolean; id: string }>('/api/leads', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
