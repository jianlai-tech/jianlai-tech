import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { BookSpread } from '@/components/BookSpread'
import { CaseBook } from '@/components/CaseBook'
import { CaseIndex } from '@/components/CaseIndex'
import { CaseShelf, type ShelfItem } from '@/components/CaseShelf'
import { ShelfLabel } from '@/components/ShelfLabel'
import { CASES } from '@/content/cases'
import { cn } from '@/lib/cn'
import { cnNum } from '@/lib/numerals'

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
    <main className="mx-auto max-w-[1280px] px-5 pb-12 sm:px-[54px]">
      <div className="mx-auto max-w-[1000px] border-b border-ink/20 pb-5 pt-8">
        <span className="kai text-[13px] tracking-[0.25em] text-cinnabar">〔 藏书阁 · 驻场实录 〕</span>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <h1 className="title-swash brush inline-block text-[54px] leading-none sm:text-[74px]">案例集</h1>
          <p className="kai max-w-[28em] text-[15px] leading-[1.85] text-ink/65">
            不写客户真名、不编业绩数字。一案一函，如实记下进场前的淤堵、驻场时的拆解，以及做出来的系统原貌。
          </p>
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-[1000px] flex-wrap items-center justify-between gap-x-8 gap-y-4">
        {sectors.length > 2 ? (
          <div role="group" aria-label="按门类筛选" className="flex flex-wrap items-center gap-2">
            <span className="kai mr-1 text-[15px] tracking-[0.15em] text-ink/55">门类</span>
            {sectors.map((s) => (
              <button
                key={s.name}
                type="button"
                aria-pressed={sector === s.name}
                onClick={() => setSector(s.name)}
                className={cn(
                  'kai rounded-[2px] border px-3.5 py-1 text-[14.5px] transition-colors duration-200',
                  sector === s.name
                    ? 'border-cinnabar bg-cinnabar text-[#f5ecd9] shadow-[inset_0_0_0_1px_rgba(245,236,217,0.25)]'
                    : 'border-ink/25 bg-[#f2e7cf]/50 text-ink/75 hover:border-cinnabar/60 hover:text-cinnabar',
                )}
              >
                {s.name}
                <span className={cn('ml-1.5 text-[12px]', sector === s.name ? 'text-[#f5ecd9]/80' : 'text-ink/45')}>
                  {s.count}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-4">
          <span className="kai hidden text-[13.5px] text-ink/50 sm:inline">陈列</span>
          <div role="group" aria-label="陈列方式" className="flex overflow-hidden rounded-[2px] border border-ink/30 bg-[#f2e7cf]/40 text-[14.5px]">
            {(
              [
                ['shelf', '博古架'],
                ['index', '总书目'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={view === key}
                onClick={() => setView(key)}
                className={cn(
                  'kai px-3.5 py-1 transition-colors',
                  view === key ? 'bg-ink text-[#f2e7cf]' : 'text-ink/65 hover:text-ink',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        {view === 'shelf' ? (
          <>
            <CaseShelf key={sector} items={visible} current={current?.slug} onPick={pick} onPeek={setPeek} />
            <ShelfLabel
              entry={visible.find((s) => s.item.slug === (peek ?? current?.slug))}
              open={(peek ?? current?.slug) === current?.slug}
              onOpen={() => peek && pick(peek)}
              onJumpBook={() => bookRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
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
          className="shelf-rise mx-auto mt-10 max-w-[1000px] scroll-mt-6"
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

      {/* 卷尾呼应：看完案例后的行动收口 */}
      <div className="mx-auto mt-14 flex max-w-[1000px] flex-wrap items-center justify-between gap-4 border-y border-ink/25 bg-[#f2e7cf]/45 px-6 py-5">
        <div>
          <p className="kai text-[13px] tracking-[0.2em] text-cinnabar">〔 阅卷毕 · 问诊 〕</p>
          <p className="mt-1 text-[17px] font-medium text-ink">
            你公司也有散在各处的表格、对不上的账、或想落地的智能体？
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <Link to="/start" className="ink-btn ink-btn-framed px-5 py-2.5 text-[16px] no-underline">
            企业喊一声，剑来
          </Link>
          <Link to="/people" className="ink-link kai text-[15.5px]">
            看看驻场剑修 →
          </Link>
        </div>
      </div>
    </main>
  )
}
