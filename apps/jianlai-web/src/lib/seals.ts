import { useSyncExternalStore } from 'react'

/** 藏书印：看过剑谱、案例集、名册，各钤一方。存在本地，不上传。 */
export type SealKey = 'forms' | 'cases' | 'people'

export const SEAL_LIST: { key: SealKey; char: string; label: string }[] = [
  { key: 'forms', char: '谱', label: '剑谱' },
  { key: 'cases', char: '卷', label: '案例集' },
  { key: 'people', char: '册', label: '剑修名册' },
]

const STORAGE_KEY = 'jianlai.seals'
const listeners = new Set<() => void>()

function read(): SealKey[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter((k): k is SealKey => SEAL_LIST.some((s) => s.key === k)) : []
  } catch {
    return []
  }
}

let cache: SealKey[] = typeof window === 'undefined' ? [] : read()

export function stamp(key: SealKey) {
  if (cache.includes(key)) return
  cache = [...cache, key]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    /* 隐私模式写不进去也无妨 */
  }
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useSeals(): SealKey[] {
  return useSyncExternalStore(subscribe, () => cache, () => cache)
}
