import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookSpread } from '@/components/BookSpread'
import { CaseBook } from '@/components/CaseBook'
import { CaseIndex } from '@/components/CaseIndex'
import { CaseShelf, type ShelfItem } from '@/components/CaseShelf'
import { ShelfLabel } from '@/components/ShelfLabel'
import { CASES } from '@/content/cases'
import { cn } from '@/lib/cn'
import { cnNum } from '@/lib/numerals'
import { stamp } from '@/lib/seals'

const ALL = '全部'

export function WorkPage() {
  // 已公开的在前按顺序编卷次，没写完的放最后当「待续」
  const shelf = useMemo<ShelfItem[]>(() => {
    const ready = CASES.filter((c) => c.published).map((item, i) => ({ item, ready: true, vol: i + 1 }))
    const pending = CASES.filter((c) => !c.published).map((item) => ({ item, ready: false }))
    return [...ready, ...pending]
  }, [])
  const totalReady = shelf.filter((s) => s.ready).length

  const sectors = useMemo(() => {
    const counts = new Map<string, number>()
    for (const { item } of shelf) counts.set(item.sector, (counts.get(item.sector) ?? 0) + 1)
    return [{ name: ALL, count: shelf.length }, ...[...counts].map(([name, count]) => ({ name, count }))]
  }, [shelf])

  const [sector, setSector] = useState(ALL)
  const [view, setView] = useState<'shelf' | 'index'>('shelf')
  const visible = sector === ALL ? shelf : shelf.filter((s) => s.item.sector === sector)
  const readyList = visible.filter((s) => s.ready)

  const [slug, setSlug] = useState(readyList[0]?.item.slug)
  const [peek, setPeek] = useState<string | null>(null)
  const [turn, setTurn] = useState<'forward' | 'back' | undefined>(undefined)
  const bookRef = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)

  // 换门类后原来那册不在这一门里，就翻开这一门的第一册
  const currentIndex = Math.max(
    0,
    readyList.findIndex((s) => s.item.slug === slug),
  )
  const currentEntry = readyList[currentIndex]
  const current = currentEntry?.item

  const go = useCallback(
    (next: number, scroll = false) => {
      if (next < 0 || next >= readyList.length || next === currentIndex) return
      setTurn(next > currentIndex ? 'forward' : 'back')
      setSlug(readyList[next].item.slug)
      if (scroll) bookRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    [currentIndex, readyList],
  )

  const pick = (target: string) => {
    const index = readyList.findIndex((s) => s.item.slug === target)
    if (index >= 0) go(index, true)
  }

  const currentVol = currentEntry?.vol
  useEffect(() => {
    // 翻开第二册或停留片刻，算看过案例集
    if (currentVol && currentVol !== 1) stamp('cases')
    const t = window.setTimeout(() => stamp('cases'), 8000)
    return () => window.clearTimeout(t)
  }, [currentVol])

  useEffect(() => {
    // 整册案例自己接 ← → 翻页；只有单页册才用 ← → 换册
    if (current?.chapters?.length) return
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select')) return
      if (event.key === 'ArrowRight') go(currentIndex + 1)
      if (event.key === 'ArrowLeft') go(currentIndex - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, currentIndex, current])

  return (
    <main className="mx-auto max-w-[1280px] px-5 pb-10 sm:px-[54px]">
      <div className="pt-8">
        <h1 className="title-swash brush inline-block text-[56px] leading-none sm:text-[80px]">案例集</h1>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        {sectors.length > 2 ? (
          <div role="group" aria-label="按门类筛选" className="flex flex-wrap items-center gap-2">
            <span className="kai mr-1 text-[16px] text-ink/60">门类</span>
            {sectors.map((s) => (
              <button
                key={s.name}
                type="button"
                aria-pressed={sector === s.name}
                onClick={() => setSector(s.name)}
                className={cn(
                  'kai border px-3.5 py-1 text-[15px] transition-colors duration-200',
                  sector === s.name
                    ? 'border-cinnabar bg-cinnabar text-[#f5ecd9]'
                    : 'border-ink/30 text-ink/70 hover:border-ink hover:text-ink',
                )}
              >
                {s.name}
                <span className={cn('ml-1.5 text-[12px]', sector === s.name ? 'text-[#f5ecd9]/75' : 'text-ink/40')}>
                  {s.count}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-5">
          <div role="group" aria-label="陈列方式" className="flex border border-ink/35 text-[15px]">
            {(
              [
                ['shelf', '架上'],
                ['index', '书目'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={view === key}
                onClick={() => setView(key)}
                className={cn(
                  'kai px-3 py-0.5 transition-colors',
                  view === key ? 'bg-ink text-[#f2e7cf]' : 'text-ink/65 hover:text-ink',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        {view === 'shelf' ? (
          <>
            <CaseShelf key={sector} items={visible} current={current?.slug} onPick={pick} onPeek={setPeek} />
            <ShelfLabel
              entry={visible.find((s) => s.item.slug === (peek ?? current?.slug))}
              open={(peek ?? current?.slug) === current?.slug}
              onOpen={() => peek && pick(peek)}
            />
          </>
        ) : (
          <CaseIndex items={visible} current={current?.slug} onPick={pick} />
        )}
      </div>

      {current && currentEntry ? (
        <div
          ref={bookRef}
          key={current.slug}
          className="shelf-rise mt-10 scroll-mt-6"
          onTouchStart={(event) => {
            touchX.current = event.touches[0].clientX
          }}
          onTouchEnd={(event) => {
            if (touchX.current === null) return
            const dx = event.changedTouches[0].clientX - touchX.current
            touchX.current = null
            if (Math.abs(dx) > 50) go(dx < 0 ? currentIndex + 1 : currentIndex - 1)
          }}
        >
          {current.chapters?.length ? (
            <CaseBook key={current.slug} item={current} vol={currentEntry.vol ?? 1} />
          ) : (
            <BookSpread
              key={current.slug}
              item={current}
              turn={turn}
              pageLabel={`卷${cnNum(currentEntry.vol ?? 1)} · 共 ${totalReady} 册`}
            />
          )}
        </div>
      ) : (
        <p className="kai mt-12 text-center text-[17px] text-ink/60">
          「{sector}」这一门的册子还在写。
          <button type="button" onClick={() => setSector(ALL)} className="ink-link ml-3">
            先看全部
          </button>
        </p>
      )}
    </main>
  )
}
