import type { ShelfItem } from '@/components/CaseShelf'
import { cn } from '@/lib/cn'
import { cnNum } from '@/lib/numerals'

/**
 * 书目：架上书多了一眼看不全时，换成一页古籍目录。
 * 卷次、行业、门类、做了哪几件事，点一行就翻开那一册；待续的只列名不能点。
 */
export function CaseIndex({
  items,
  current,
  onPick,
}: {
  items: ShelfItem[]
  current?: string
  onPick: (slug: string) => void
}) {
  return (
    <div className="guji-leaf mx-auto max-w-[1000px] px-5 py-6 sm:px-10 sm:py-8">
      <div className="guji-frame px-4 py-3 sm:px-8 sm:py-5">
        <p className="kai border-b border-ink/25 pb-3 text-[15px] tracking-[0.3em] text-ink/60">
          剑来案例集 · 书目
        </p>
        <ol>
          {items.map(({ item, ready, vol }) => {
            const active = item.slug === current
            return (
              <li key={item.slug} className="border-b border-dashed border-ink/20 last:border-b-0">
                <button
                  type="button"
                  disabled={!ready}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => onPick(item.slug)}
                  className={cn(
                    'group flex w-full items-baseline gap-3 py-3.5 text-left transition-colors sm:gap-5',
                    ready ? 'hover:bg-ink/[0.035]' : 'cursor-default',
                  )}
                >
                  <span className={cn('kai w-[3.6em] shrink-0 text-[15px]', ready ? 'text-cinnabar' : 'text-ink/35')}>
                    {ready && vol ? `卷${cnNum(vol)}` : '待续'}
                  </span>
                  <span className="min-w-0">
                    <span className={cn('kai text-[19px] sm:text-[21px]', ready ? 'text-ink' : 'text-ink/45')}>
                      {item.industry}
                    </span>
                    <span className="ml-2 border border-ink/25 px-1.5 text-[12px] text-ink/55">{item.sector}</span>
                    {item.processWords.length > 0 ? (
                      <span className="mt-1 block text-[14px] text-ink/55 sm:hidden">{item.processWords.join(' · ')}</span>
                    ) : null}
                  </span>
                  <span aria-hidden className="mx-1 hidden min-w-[2em] flex-1 translate-y-[-0.3em] border-b border-dotted border-ink/35 sm:block" />
                  {item.processWords.length > 0 ? (
                    <span className="hidden shrink-0 text-[14px] text-ink/60 sm:inline">{item.processWords.join(' · ')}</span>
                  ) : null}
                  <span
                    className={cn(
                      'kai ml-auto shrink-0 text-[14px] sm:ml-0 sm:w-[4.5em] sm:text-right',
                      active ? 'text-cinnabar' : ready ? 'text-ink/60 group-hover:text-ink' : 'text-ink/35',
                    )}
                  >
                    {active ? '正翻开' : ready ? '翻开 →' : '还在写'}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
