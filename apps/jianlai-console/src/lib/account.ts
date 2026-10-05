import { api } from '@/lib/api'

export type AccountKind = 'staff' | 'client'

export type Account = {
  id: string
  kind: AccountKind
  phone: string
  name: string
  is_admin: boolean
  staff_slug: string | null
  company: string | null
  must_change_password: boolean
}

export type Profile = {
  alias: string | null
  tagline: string | null
  skills: string | null
  prefers: string | null
  character: string | null
  availability: string | null
  updated_at?: string
}

export type DimLevels = { edge: number; sheath: number; heart: number; qi: number }

export type Cert = {
  gate: '问剑门' | '破阵门' | '映剑门' | null
  realm_no: number
  dims: Partial<DimLevels>
  note: string | null
  certified_at: string | null
  certified_by: string | null
}

export type Stage = '先看' | '先斩一处' | '上线护航' | '教会交接' | '已完结'
export const STAGES: Stage[] = ['先看', '先斩一处', '上线护航', '教会交接', '已完结']

export type MyProject = {
  id: string
  name: string
  industry: string | null
  stage: Stage
  progress: number
  progress_note: string | null
  started_on: string | null
  ended_on: string | null
  role?: string
  members?: { name: string; role: string }[]
}

export type MeResponse = {
  account: Account
  profile?: Profile | null
  cert?: Cert | null
  projects?: MyProject[]
}

export const fetchMe = () => api<MeResponse>('/api/me')

export const login = (phone: string, password: string) =>
  api<{ token: string; account: Account }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  })

export const logout = () => api('/api/auth/logout', { method: 'POST' })

export const changePassword = (old_password: string, new_password: string) =>
  api('/api/auth/password', { method: 'POST', body: JSON.stringify({ old_password, new_password }) })

export const saveProfile = (profile: Profile) =>
  api('/api/me/profile', { method: 'PUT', body: JSON.stringify(profile) })

// —— 管理员 ——

export type AdminAccountRow = {
  id: string
  kind: AccountKind
  phone: string
  name: string
  is_admin: boolean
  status: 'pending' | 'active' | 'disabled'
  staff_slug: string | null
  company: string | null
  paid_at: string | null
  must_change_password: boolean
  last_login_at: string | null
  alias: string | null
  tagline: string | null
  gate: Cert['gate']
  realm_no: number | null
  dims: Partial<DimLevels> | null
  certified_at: string | null
}

export type AdminProject = Omit<MyProject, 'members' | 'role'> & {
  client_account_id: string | null
  client_company: string | null
  updated_at: string
  members: { account_id: string; name: string; role: string }[]
}

export const adminAccounts = () => api<{ items: AdminAccountRow[] }>('/api/admin/accounts')

export const createStaff = (body: { phone: string; name: string; id_tail: string; staff_slug?: string }) =>
  api('/api/admin/accounts/staff', { method: 'POST', body: JSON.stringify(body) })

export const createClient = (body: { phone: string; name: string; company: string; initial_password: string }) =>
  api('/api/admin/accounts/client', { method: 'POST', body: JSON.stringify(body) })

export const setAccountStatus = (id: string, status: 'active' | 'disabled') =>
  api(`/api/admin/accounts/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) })

export const resetPassword = (id: string, new_password: string) =>
  api(`/api/admin/accounts/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password }) })

export const saveCert = (
  id: string,
  body: { gate: Cert['gate']; realm_no: number; dims: DimLevels | null; note: string | null },
) => api(`/api/admin/staff/${id}/cert`, { method: 'PUT', body: JSON.stringify(body) })

export const adminProjects = () => api<{ items: AdminProject[] }>('/api/admin/projects')

export type ProjectInput = {
  name: string
  industry: string | null
  client_account_id: string | null
  stage: Stage
  progress: number
  progress_note: string | null
  started_on: string | null
  ended_on: string | null
  members: { account_id: string; role: string }[]
}

export const createProject = (body: ProjectInput) =>
  api('/api/admin/projects', { method: 'POST', body: JSON.stringify(body) })

export const updateProject = (id: string, body: ProjectInput) =>
  api(`/api/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) })
