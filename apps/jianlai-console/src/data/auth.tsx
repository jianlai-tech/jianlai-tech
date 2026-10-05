import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchMe, logout as apiLogout, type MeResponse } from '@/lib/account'
import { getToken, setToken, setUnauthorizedHandler } from '@/lib/api'

type AuthState = {
  me: MeResponse | null
  loading: boolean
  refresh: () => Promise<void>
  signIn: (token: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setMe(null)
      setLoading(false)
      return
    }
    try {
      setMe(await fetchMe())
    } catch {
      setMe(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => setMe(null))
    void refresh()
    return () => setUnauthorizedHandler(null)
  }, [refresh])

  const signIn = useCallback(
    async (token: string) => {
      setToken(token)
      setLoading(true)
      await refresh()
    },
    [refresh],
  )

  const signOut = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      /* 会话已失效也照样退出 */
    }
    setToken(null)
    setMe(null)
  }, [])

  const value = useMemo(() => ({ me, loading, refresh, signIn, signOut }), [me, loading, refresh, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 要在 AuthProvider 里用')
  return ctx
}
