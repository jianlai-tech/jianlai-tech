import { useCallback, useMemo, useState } from 'react'
import { GujiBook, type GujiPage } from '@/components/GujiBook'
import { Contents, Cover, FormPage } from '@/components/NineFormsPages'
import { FORMS, ORDINALS } from '@/content/forms'
import { stamp } from '@/lib/seals'

/** 剑来剑谱：封面 + 目录 + 九式，翻页机制和案例册共用 GujiBook */
export function NineFormsBook() {
  const [page, setPage] = useState(0)

  const pages = useMemo<GujiPage[]>(
    () => [
      { name: '封面', cover: true, render: () => <Cover /> },
      { name: '目录', render: () => <Contents onPick={(form) => setPage(form + 2)} /> },
      ...FORMS.map((form, index) => ({
        name: `第${ORDINALS[index]}式 · ${form.name}`,
        tab: ORDINALS[index],
        render: () => <FormPage form={form} index={index} />,
      })),
    ],
    [],
  )

  // 翻进第三式往后，算读过剑谱
  const onPage = useCallback((p: number) => {
    if (p >= 4) stamp('forms')
  }, [])

  return (
    <GujiBook
      label="剑来剑谱"
      pages={pages}
      page={page}
      onPageChange={setPage}
      onPage={onPage}
    />
  )
}
