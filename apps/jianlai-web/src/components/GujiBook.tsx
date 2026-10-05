import { Link } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { SwordTassel } from '@/components/Accents'
import { cn } from '@/lib/cn'

export type GujiPage = {
  /** 翻页条上显示的页名 */
  name: string
  render: () => ReactNode
  /** 封面：不加古籍边框 */
  cover?: boolean
  /** 书口签上的一个字；不传就不出签 */
  tab?: string
}

const TURN_MS = 760

/**
 * 一本能翻的线装书：右缘掀起绕左缘翻过去，书口签跳页，← → 和手指拨都能翻。
 * 剑谱和案例册共用这一套翻页；页面内容由调用方给。
 */
export function GujiBook({
  pages,
  label,
  onPage,
  endLink,
  page: controlled,
  onPageChange,
}: {
  pages: GujiPage[]
  label: string
  onPage?: (page: number) => void
  /** 最后一页右下角的去处 */
  endLink?: { to: string; text: string }
  page?: number
  onPageChange?: (page: number) => void
}) {
  const [inner, setInner] = useState(0)
  const page = controlled ?? inner
  const setPage = onPageChange ?? setInner
  const [turn, setTurn] = useState<{ from: number; dir: 'next' | 'prev' } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const prevPage = useRef(page)
  const total = pages.length

  // 不管是翻页钮、书口签，还是页里的目录跳过来，页一变就翻一下
  useEffect(() => {
    const from = prevPage.current
    prevPage.current = page
    if (from === page) return
    window.clearTimeout(timer.current)
    setTurn({ from, dir: page > from ? 'next' : 'prev' })
    timer.current = window.setTimeout(() => setTurn(null), TURN_MS)
  }, [page])

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= total || next === page) return
      setPage(next)
    },
    [page, setPage, total],
  )

  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => {
    onPage?.(page)
  }, [onPage, page])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const root = rootRef.current
      if (!root) return
      const rect = root.getBoundingClientRect()
      const inView = rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.4
      const target = event.target as HTMLElement | null
      if (!inView || target?.closest('input, textarea, select')) return
      if (event.key === 'ArrowRight') go(page + 1)
      if (event.key === 'ArrowLeft') go(page - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, page])

  const leaf = (index: number) => (pages[index]?.cover ? '' : 'guji-leaf guji-frame')
  const current = pages[page]

  return (
    <div ref={rootRef} className="relative" aria-label={label}>
      {/* 红穗书签：夹在当前有签的那一页 */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -top-3 right-16 z-20 flex flex-col items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:right-24',
          current?.tab ? 'translate-y-0 opacity-100' : '-translate-y-6 opacity-0',
        )}
      >
        <span className="flex h-16 w-7 items-end justify-center bg-cinnabar pb-2 text-[13px] text-[#f5ecd9] [clip-path:polygon(0_0,100%_0,100%_100%,50%_86%,0_100%)]">
          <span className="kai">{current?.tab ?? ''}</span>
        </span>
        <SwordTassel className="-mt-1 h-16" />
      </div>

      <div className="flex flex-row-reverse items-stretch gap-1.5">
        {/* 书口签：书的右缘，一页一枚 */}
        <nav aria-label={`${label}索引`} className="hidden flex-col justify-center gap-1 sm:flex">
          {pages.map((p, index) =>
            p.tab ? (
              <button
                key={p.name}
                type="button"
                onClick={() => go(index)}
                aria-current={page === index ? 'page' : undefined}
                title={p.name}
                className={cn(
                  'kai mr-auto w-7 border border-l-0 py-1.5 text-[13px] leading-none transition-all duration-300',
                  page === index
                    ? 'w-9 border-cinnabar bg-cinnabar text-[#f5ecd9]'
                    : 'border-ink/25 bg-[#efe3c6] text-ink/65 hover:w-8 hover:text-ink',
                )}
              >
                {p.tab}
              </button>
            ) : null,
          )}
        </nav>

        <div
          className="leaf-stage relative min-w-0 flex-1"
          onTouchStart={(event) => {
            touchX.current = event.touches[0].clientX
          }}
          onTouchEnd={(event) => {
            if (touchX.current === null) return
            const dx = event.changedTouches[0].clientX - touchX.current
            touchX.current = null
            if (Math.abs(dx) < 50) return
            go(dx < 0 ? page + 1 : page - 1)
          }}
        >
          <article
            key={`base-${page}`}
            aria-live="polite"
            aria-label={current?.name}
            className={cn(
              'relative overflow-hidden',
              current?.cover ? 'shadow-[0_34px_60px_-34px_rgba(28,26,23,0.7)]' : leaf(page),
              turn?.dir === 'next' && 'leaf-under',
              turn?.dir === 'prev' && 'leaf-turn-in',
            )}
          >
            {current?.render()}
            {page < total - 1 ? (
              <button type="button" onClick={() => go(page + 1)} aria-label="翻到下一页" className="leaf-corner z-10" />
            ) : null}
          </article>

          {turn?.dir === 'next' ? (
            <div
              key={`turn-${turn.from}-${page}`}
              aria-hidden
              className={cn('leaf-turn-out pointer-events-none absolute inset-0 overflow-hidden', leaf(turn.from))}
            >
              {pages[turn.from].render()}
            </div>
          ) : null}
          {turn?.dir === 'prev' ? (
            <div
              key={`stay-${turn.from}-${page}`}
              aria-hidden
              className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', leaf(turn.from))}
            >
              {pages[turn.from].render()}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 sm:pr-10">
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page === 0}
          className="ink-link text-[17px] disabled:cursor-default disabled:no-underline disabled:opacity-35"
        >
          ← 上一页
        </button>
        <p className="kai text-center text-[15px] text-ink/65">
          {current?.name}
          <span className="ml-2 text-ink/40">
            {page + 1} / {total}
          </span>
        </p>
        {page === total - 1 && endLink ? (
          <Link to={endLink.to} className="ink-link text-[17px] text-cinnabar">
            {endLink.text} →
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => go(page + 1)}
            disabled={page === total - 1}
            className="ink-link text-[17px] disabled:cursor-default disabled:no-underline disabled:opacity-35"
          >
            {page === 0 ? '翻开' : '下一页'} →
          </button>
        )}
      </div>
    </div>
  )
}
