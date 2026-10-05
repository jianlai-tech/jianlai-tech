const TOKEN_KEY = 'jianlai.console.token'
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export type HttpError = Error & { status: number }

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

/** 登录过期时通知外层回到登录页 */
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let resp: Response
  try {
    resp = await fetch(path.startsWith('http') ? path : API_BASE + path, { ...init, headers })
  } catch {
    const err = new Error('连不上服务，稍后再试') as HttpError
    err.status = 0
    throw err
  }
  if (!resp.ok) {
    let message = `出错了（${resp.status}）`
    try {
      const body = await resp.json()
      if (body && typeof body.detail === 'string') message = body.detail
      else if (Array.isArray(body?.detail)) message = '填的内容格式不对'
    } catch {
      /* 非 JSON */
    }
    if (resp.status === 401 && token) {
      setToken(null)
      onUnauthorized?.()
    }
    const err = new Error(message) as HttpError
    err.status = resp.status
    throw err
  }
  if (resp.status === 204) return undefined as T
  return (await resp.json()) as T
}

export function errorText(err: unknown, fallback = '出错了，稍后再试') {
  return err instanceof Error && err.message ? err.message : fallback
}
