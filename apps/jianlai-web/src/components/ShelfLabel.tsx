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
  onJumpBook,
}: {
  entry?: ShelfItem
  /** 这一函就是正翻开的那一函 */
  open: boolean
  onOpen: () => void
  onJumpBook?: () => void
}) {
  if (!entry) return null
  const { item, ready, vol } = entry

  return (
    <div
      aria-live="polite"
      className="mx-auto mt-4 flex max-w-[1000px] flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-[2px] border border-ink/25 bg-[#f2e7cf]/65 px-5 py-3.5 shadow-[inset_0_0_0_2px_#eddec4]"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span
          className={cn(
            'kai rounded-[2px] px-2 py-0.5 text-[12.5px] tracking-[0.15em]',
            ready ? 'bg-cinnabar text-[#f5ecd9]' : 'border border-ink/25 text-ink/45',
          )}
        >
          {ready && vol ? `卷${cnNum(vol)}` : '待续'}
        </span>
        <span className="brush text-[28px] leading-none text-ink">{item.industry}</span>
        {item.ledger ? (
          <span className="kai text-[14px] text-ink/60">
            {item.ledger.span} · <b className="font-normal text-cinnabar">{item.ledger.headline}</b>
          </span>
        ) : item.pitch ? (
          <span className="kai text-[14px] text-ink/60">{item.pitch}</span>
        ) : null}
      </div>

      {ready ? (
        <div className="flex flex-wrap items-center gap-4">
          {item.processWords.length > 0 ? (
            <div className="hidden flex-wrap items-center gap-1.5 lg:flex">
              {item.processWords.map((w) => (
                <span
                  key={w}
                  className="kai rounded-[2px] border border-ink/20 bg-[#eddec4]/80 px-2 py-0.5 text-[12px] text-ink/70"
                >
                  {w}
                </span>
              ))}
            </div>
          ) : null}
          {open ? (
            <button
              type="button"
              onClick={onJumpBook}
              className="kai inline-flex items-center gap-1 text-[14px] text-cinnabar transition-opacity hover:opacity-80"
            >
              <span>已在下方展卷</span>
              <span aria-hidden>↓</span>
            </button>
          ) : (
            <button type="button" onClick={onOpen} className="ink-link kai text-[15px] text-cinnabar">
              抽出来翻 ↓
            </button>
          )}
        </div>
      ) : (
        <p className="kai text-[14px] text-ink/45">驻场实录整理中，敬请期待</p>
      )}
    </div>
  )
}
