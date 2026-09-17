import { env } from '@/env'

function buildUrl(path: string): string {
  if (path.startsWith('http')) return path
  if (env.apiBaseUrl) return env.apiBaseUrl + path
  return path
}

export type HttpError = Error & {
  status: number
  detail?: unknown
}

export function getHttpErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export async function httpJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }

  const resp = await fetch(buildUrl(path), { ...init, headers })
  if (!resp.ok) {
    const raw = await resp.text()
    let detail: unknown = raw
    try {
      detail = raw ? JSON.parse(raw) : raw
    } catch {
      detail = raw
    }
    const fromJson =
      typeof detail === 'object' && detail !== null && 'detail' in detail
        ? String((detail as { detail: unknown }).detail)
        : null
    const err = new Error(fromJson || `HTTP ${resp.status}`) as HttpError
    err.status = resp.status
    err.detail = detail
    throw err
  }
  if (resp.status === 204) return undefined as T
  return (await resp.json()) as T
}
