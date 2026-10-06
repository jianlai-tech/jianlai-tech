import type { ShelfItem } from '@/components/CaseShelf'
import { cn } from '@/lib/cn'
import { cnNum } from '@/lib/numerals'

/**
 * 展签：书架下面一条，像博物馆柜前的说明牌。
 * 指到哪一函就说哪一函；没指的时候说正翻开的那一函。
 */
export function ShelfLabel({
  entry,
  open,
  onOpen,
}: {
  entry?: ShelfItem
  /** 这一函就是正翻开的那一函 */
  open: boolean
  onOpen: () => void
}) {
  if (!entry) return null
  const { item, ready, vol } = entry
  const facts = [
    item.ledger ? item.ledger.span : null,
    item.ledger ? item.ledger.headline : null,
    item.processWords.length ? item.processWords.join(' · ') : null,
  ].filter(Boolean) as string[]

  return (
    <div
      aria-live="polite"
      className="mx-auto mt-5 flex max-w-[1000px] flex-wrap items-center gap-x-6 gap-y-2 border-y border-ink/25 px-1 py-3"
    >
      <p className="flex items-baseline gap-3">
        <span className={cn('kai text-[14px]', ready ? 'text-cinnabar' : 'text-ink/40')}>
          {ready && vol ? `卷${cnNum(vol)}` : '待续'}
        </span>
        <span className="brush text-[28px] leading-none">{item.industry}</span>
      </p>
      {ready ? (
        <p className="kai flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1 text-[14.5px] text-ink/60">
          {facts.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </p>
      ) : (
        <p className="kai flex-1 text-[14.5px] text-ink/45">这一册还在写</p>
      )}
      {ready ? (
        open ? (
          <span className="kai text-[14.5px] text-ink/45">正翻开 ↓</span>
        ) : (
          <button type="button" onClick={onOpen} className="ink-link kai text-[15px]">
            抽出来翻 ↓
          </button>
        )
      ) : null}
    </div>
  )
}
