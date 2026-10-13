import { httpJson } from '@/lib/http'

/** watch：跟着观摩学；work：时间够，能接活 */
export type RecruitTrack = 'watch' | 'work'

export type RecruitPayload = {
  name: string
  school?: string
  major: string
  grade: string
  track: RecruitTrack
  weekly_hours: string
  cs_base: string
  talents: string[]
  /** 本事、做过的东西，自由写 */
  strengths?: string
  phone: string
  wechat?: string
  source?: string
}

export function submitRecruit(body: RecruitPayload) {
  return httpJson<{ ok: boolean; id: string; updated: boolean; track: RecruitTrack }>('/api/recruits', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
