import { useCallback, useEffect, useState } from 'react'
import { api, errorText } from '@/lib/api'

export type EntryKind = 'in' | 'out'

export type Entry = {
  id: string
  occurred_on: string
  occurred_at: string | null
  kind: EntryKind
  category: string
  memo: string
  counterparty: string | null
  amount: number
  account: string | null
  balance_after: number | null
  /** 手记 / 招行明细 */
  source: string
  created_at: string
}

type LedgerResp = { items: Entry[]; in_cats: string[]; out_cats: string[] }

export type NewEntry = {
  occurred_on: string
  kind: EntryKind
  category: string
  memo: string
  counterparty?: string
  amount: number
  account?: string
}

/** 真账：后端 ledger 表，只给管理员 */
export function useLedger() {
  const [data, setData] = useState<LedgerResp | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      setData(await api<LedgerResp>('/api/admin/ledger'))
    } catch (err) {
      setError(errorText(err, '没拉到流水'))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const add = useCallback(
    async (entry: NewEntry) => {
      await api<Entry>('/api/admin/ledger', { method: 'POST', body: JSON.stringify(entry) })
      await load()
    },
    [load],
  )

  const voidEntry = useCallback(
    async (id: string) => {
      await api(`/api/admin/ledger/${id}/void`, { method: 'POST' })
      await load()
    },
    [load],
  )

  return {
    ledger: data?.items ?? [],
    inCats: data?.in_cats ?? [],
    outCats: data?.out_cats ?? [],
    loading: data === null && !error,
    error,
    reload: load,
    add,
    voidEntry,
  }
}

export type Ledger = ReturnType<typeof useLedger>
