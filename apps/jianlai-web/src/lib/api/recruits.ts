import { httpJson } from '@/lib/http'

export type RecruitPayload = {
  name: string
  age: number
  school?: string
  major: string
  /** 和 AI 打过的交道：做过什么、用什么、卡在哪 */
  ai_story: string
  strengths: string
  phone: string
  wechat?: string
  source?: string
}

export function submitRecruit(body: RecruitPayload) {
  return httpJson<{ ok: boolean; id: string; updated: boolean }>('/api/recruits', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
