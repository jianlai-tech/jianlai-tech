import { useMemo, useState } from 'react'
import { GujiBook, type GujiPage } from '@/components/GujiBook'
import { Contents, Cover, FormPage } from '@/components/NineFormsPages'
import { FORMS, ORDINALS } from '@/content/forms'

/** 剑来剑谱：封面 + 目录 + 九式，翻页机制和案例册共用 GujiBook */
export function NineFormsBook({
  page: controlled,
  onPageChange,
}: {
  /** 首页九式条点进来时由外面控制翻到哪页 */
  page?: number
  onPageChange?: (page: number) => void
} = {}) {
  const [inner, setInner] = useState(0)
  const page = controlled ?? inner
  const setPage = onPageChange ?? setInner

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
    [setPage],
  )

  return (
    <GujiBook
      label="剑来剑谱"
      pages={pages}
      page={page}
      onPageChange={setPage}
    />
  )
}
