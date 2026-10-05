const WEEK = ['日', '一', '二', '三', '四', '五', '六'] as const

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function toIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayIso() {
  return toIso(new Date())
}

export function shiftIso(iso: string, days: number) {
  const date = parseIso(iso)
  date.setDate(date.getDate() + days)
  return toIso(date)
}

/** 从今天算起的偏移日，负数是过去。示意数据靠它跟着真实日期走。 */
export function fromToday(days: number) {
  return shiftIso(todayIso(), days)
}

export function diffDays(aIso: string, bIso: string) {
  return Math.round((parseIso(aIso).getTime() - parseIso(bIso).getTime()) / 86_400_000)
}

export function fmtMD(iso: string) {
  const date = parseIso(iso)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function fmtMDWeek(iso: string) {
  const date = parseIso(iso)
  return `${date.getMonth() + 1}月${date.getDate()}日 周${WEEK[date.getDay()]}`
}

export function monthKey(iso: string) {
  return iso.slice(0, 7)
}

export function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  return `${y} 年 ${m} 月`
}

/** 回访 / 收款到期的口语：逾期 N 天、今天、N 天后 */
export function dueText(iso: string) {
  const delta = diffDays(iso, todayIso())
  if (delta < 0) return `逾期 ${-delta} 天`
  if (delta === 0) return '今天'
  if (delta === 1) return '明天'
  return `${delta} 天后`
}
