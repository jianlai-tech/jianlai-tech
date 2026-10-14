import { api, apiBlob, saveBlob } from '@/lib/api'
import type { CoopMode } from '@/lib/account'

export type ContractStatus = 'draft' | 'signed' | 'void'

export type ContractStaff = { slug: string; legal_name: string; alias: string | null; role: string }

export type Contract = {
  id: string
  code: string
  project_id: string
  project_name: string
  mode: CoopMode
  status: ContractStatus
  party_a: string
  party_a_rep: string | null
  party_a_contact: string | null
  party_a_address: string | null
  start_on: string
  months: number
  end_on: string
  staff_fee: number
  consult_fee: number
  monthly_total: number
  total: number
  work_place: string | null
  pay_terms: string | null
  extra_terms: string | null
  signed_on: string | null
  file_name: string | null
  file_size: number | null
  has_file: boolean
  quote_id: string | null
  amount: number | null
  staff: ContractStaff[]
}

export type ContractInput = {
  project_id: string
  mode: CoopMode
  party_a: string
  party_a_rep: string | null
  party_a_contact: string | null
  party_a_address: string | null
  start_on: string
  months: number
  staff_fee: number
  consult_fee: number
  work_place: string | null
  pay_terms: string | null
  extra_terms: string | null
  quote_id?: string | null
  amount?: number | null
  staff: { slug: string; alias: string | null; role: string }[]
}

export const DEFAULT_PAY_TERMS = '甲方于每个服务月开始后 5 个工作日内，支付当月服务费'

export const fetchContracts = () => api<{ items: Contract[] }>('/api/admin/contracts')

export const createContract = (body: ContractInput) =>
  api<Contract>('/api/admin/contracts', { method: 'POST', body: JSON.stringify(body) })

export const updateContract = (id: string, body: ContractInput) =>
  api<Contract>(`/api/admin/contracts/${id}`, { method: 'PUT', body: JSON.stringify(body) })

export const voidContract = (id: string) => api(`/api/admin/contracts/${id}/void`, { method: 'POST' })

export async function downloadContractDocx(contract: Contract) {
  const { blob, name } = await apiBlob(`/api/admin/contracts/${contract.id}/docx`)
  saveBlob(blob, name ?? `${contract.code}.docx`)
}

export async function openContractFile(contract: Contract) {
  const { blob } = await apiBlob(`/api/admin/contracts/${contract.id}/file`)
  window.open(URL.createObjectURL(blob), '_blank', 'noopener')
}

export function signContract(id: string, file: File, signedOn: string) {
  const form = new FormData()
  form.append('file', file)
  form.append('signed_on', signedOn)
  return api<Contract>(`/api/admin/contracts/${id}/sign`, { method: 'POST', body: form })
}

/** 剑修工作状态：active 在跟 / upcoming 已签未开始 / planned 合同还在拟 */
export type LoadState = 'active' | 'upcoming' | 'planned'

export type LoadItem = {
  project_id: string
  project: string
  role: string
  state: LoadState
  start_on: string | null
  end_on: string | null
  contract_code: string | null
}

export const fetchStaffLoad = () =>
  api<{ today: string; items: Record<string, LoadItem[]> }>('/api/admin/staff-load')
