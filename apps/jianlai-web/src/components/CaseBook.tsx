import { useMemo, useState } from 'react'
import { casePages } from '@/components/CaseBookPages'
import { GujiBook } from '@/components/GujiBook'
import type { CaseRecord } from '@/content/cases'

/** 整册案例：封面 → 目录 → 生意 → 驻场 → 九式九章，像剑谱一样翻 */
export function CaseBook({ item, vol }: { item: CaseRecord; vol: number }) {
  const [page, setPage] = useState(0)
  const pages = useMemo(() => casePages(item, vol, setPage), [item, vol])
  return (
    <GujiBook
      label={`${item.industry} 案例册`}
      pages={pages}
      page={page}
      onPageChange={setPage}
    />
  )
}
