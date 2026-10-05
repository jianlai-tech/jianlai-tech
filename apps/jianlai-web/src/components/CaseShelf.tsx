import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { CaseRecord } from '@/content/cases'
import { SwordTassel } from '@/components/Accents'
import { cnNum } from '@/lib/numerals'

/** vol：已成的册按公开顺序编卷次，筛门类时卷次不变 */
export type ShelfItem = { item: CaseRecord; ready: boolean; vol?: number }

/** 红木：横料纹理横走，立柱纹理竖走，CSS 画，免得素材拉伸变形 */
const WOOD_H: CSSProperties = {
  background:
    'repeating-linear-gradient(0deg, rgba(255,226,180,0.035) 0 1px, transparent 1px 5px), repeating-linear-gradient(0deg, rgba(0,0,0,0.13) 0 1px, transparent 1px 9px), linear-gradient(180deg, #6a4330 0%, #4f3120 55%, #3c2418 100%)',
}
const WOOD_V: CSSProperties = {
  background:
    'repeating-linear-gradient(90deg, rgba(255,226,180,0.035) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgba(0,0,0,0.14) 0 2px, transparent 2px 11px), linear-gradient(90deg, #4a2e1e 0%, #62402c 45%, #3b2418 100%)',
}

/** 格里的背板：竖拼木板，上沿和两侧压一层暗影，显得格子有进深 */
const BACK: CSSProperties = {
  background:
    'radial-gradient(ellipse 70% 80% at 50% 0%, rgba(255,198,128,0.12), transparent 70%), repeating-linear-gradient(90deg, #2d1d13 0 52px, #22160e 52px 53px), #2a1b12',
  boxShadow:
    'inset 0 14px 18px -8px rgba(0,0,0,0.85), inset 10px 0 14px -10px rgba(0,0,0,0.8), inset -10px 0 14px -10px rgba(0,0,0,0.8)',
}

/** 一格：背板 + 两只角牙 + 底下的隔板 */
function Cell({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className={cn('relative flex-1', className)} style={BACK}>
        <span aria-hidden className="absolute left-0 top-0 h-4 w-4 [clip-path:polygon(0_0,100%_0,0_100%)]" style={WOOD_H} />
        <span aria-hidden className="absolute right-0 top-0 h-4 w-4 [clip-path:polygon(0_0,100%_0,100%_100%)]" style={WOOD_H} />
        {children}
      </div>
      <Board />
    </div>
  )
}

function Board() {
  return (
    <div
      aria-hidden
      className="relative z-[1] h-3 shadow-[inset_0_1px_0_rgba(255,220,170,0.2),0_3px_5px_-2px_rgba(0,0,0,0.6)]"
      style={WOOD_H}
    />
  )
}

function Post({ className }: { className?: string }) {
  return <div aria-hidden className={cn('w-3 shrink-0', className)} style={WOOD_V} />
}

/** 平放的一摞书：书根朝外，纸边一道道 */
function LyingBooks() {
  const books = [
    { w: 118, h: 15, cover: '#3d5468' },
    { w: 108, h: 12, cover: '#5b3b2a' },
    { w: 124, h: 17, cover: '#3d5468' },
  ]
  return (
    <div className="flex flex-col items-center">
      {books.map((b) => (
        <span
          key={`${b.w}-${b.h}`}
          className="block shadow-[0_2px_3px_rgba(0,0,0,0.45)]"
          style={{
            width: b.w,
            height: b.h,
            background: `linear-gradient(180deg, ${b.cover} 0 2px, transparent 2px calc(100% - 2px), ${b.cover} calc(100% - 2px)), repeating-linear-gradient(0deg, #eadcbf 0 1px, #d6c4a0 1px 2px)`,
          }}
        />
      ))}
    </div>
  )
}

/** 印石和印泥盒 */
function SealStone() {
  return (
    <div className="flex items-end gap-3">
      <span className="flex flex-col items-center">
        <span className="h-3 w-4 rounded-t-full bg-gradient-to-b from-[#d7a874] to-[#a8764a]" />
        <span className="h-12 w-7 rounded-[2px] bg-gradient-to-r from-[#8f5d37] via-[#c79563] to-[#7a4c2c] shadow-[0_3px_4px_rgba(0,0,0,0.5)]" />
      </span>
      <span className="relative flex flex-col items-center">
        <span className="h-2.5 w-14 rounded-[50%] bg-gradient-to-b from-[#f2ece0] to-[#d9d1c0]" />
        <span className="-mt-1 h-6 w-14 rounded-b-md bg-gradient-to-r from-[#cfc6b3] via-[#efe9dc] to-[#c4bba7] shadow-[0_3px_4px_rgba(0,0,0,0.5)]" />
        <span className="absolute top-[3px] h-1 w-9 rounded-[50%] bg-cinnabar/80" />
      </span>
    </div>
  )
}

function Ornament({ src, h, w }: { src: string; h: number; w: number }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      width={w}
      height={h}
      loading="lazy"
      decoding="async"
      draggable={false}
      style={{ height: h }}
      className="pointer-events-none w-auto select-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.55)]"
    />
  )
}

function Drawer() {
  return (
    <div
      className="flex flex-1 items-center justify-center shadow-[inset_0_0_0_1px_rgba(0,0,0,0.5),inset_0_0_0_4px_rgba(255,220,170,0.07)]"
      style={WOOD_H}
    >
      <span className="relative flex h-5 w-8 items-start justify-center rounded-[3px] bg-gradient-to-b from-[#b48a45] to-[#7d5a25]">
        <span className="absolute top-1.5 h-4 w-4 rounded-full border-2 border-[#d4ae66] shadow-[0_2px_2px_rgba(0,0,0,0.5)]" />
      </span>
    </div>
  )
}

/** 格边的铜钮：书多到一格插不下时，推着架上的书左右走 */
function PushButton({ side, show, onClick }: { side: 'left' | 'right'; show: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden={!show}
      onClick={onClick}
      className={cn(
        'absolute top-1/2 z-[3] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#c99d55] to-[#7d5a25] text-[18px] leading-none text-[#2a1b12] shadow-[0_3px_6px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,236,190,0.6)] transition-all duration-300 hover:brightness-110',
        side === 'left' ? 'left-2' : 'right-2',
        show ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <span aria-hidden className={side === 'left' ? '-ml-0.5' : 'ml-0.5'}>
        {side === 'left' ? '‹' : '›'}
      </span>
    </button>
  )
}

/**
 * 博古架：中间大格竖插案例函套，两侧小格摆梅瓶、笔筒、平放的书和印石。
 * 函套有题签、骨签扣；抽出来的那一函往外探、亮起来、扣上垂一缕红穗。
 * 还在写的那函是素纸函，标「待续」。
 * 书多了插不下，中格变成能左右推的一排：两边压暗、露出铜钮，抽出的那函自动推到正中。
 */
export function CaseShelf({
  items,
  current,
  onPick,
  onPeek,
}: {
  items: ShelfItem[]
  current?: string
  onPick: (slug: string) => void
  /** 指到哪一函：给展签预览用，离开传 null */
  onPeek?: (slug: string | null) => void
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState({ left: false, right: false })

  const measure = useCallback(() => {
    const row = rowRef.current
    if (!row) return
    setEdge({
      left: row.scrollLeft > 4,
      right: row.scrollLeft + row.clientWidth < row.scrollWidth - 4,
    })
  }, [])

  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    return () => observer.disconnect()
  }, [measure, items.length])

  useEffect(() => {
    const row = rowRef.current
    const book = row?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!row || !book) return
    const target = book.offsetLeft - (row.clientWidth - book.offsetWidth) / 2
    row.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [current])

  const push = (dir: 1 | -1) => {
    const row = rowRef.current
    if (row) row.scrollBy({ left: dir * row.clientWidth * 0.7, behavior: 'smooth' })
  }

  return (
    <div className="relative mx-auto max-w-[1000px] drop-shadow-[0_24px_28px_rgba(28,26,23,0.35)]">
      {/* 架顶楣板，雕一道回纹 */}
      <div aria-hidden className="relative h-8 rounded-t-[4px] shadow-[inset_0_1px_0_rgba(255,220,170,0.25)]" style={WOOD_H}>
        <div className="absolute inset-x-8 top-1/2 h-[8px] -translate-y-1/2 border-y border-[#e7c99a]/25 [background:repeating-linear-gradient(90deg,transparent_0_9px,rgba(231,201,154,0.28)_9px_11px,transparent_11px_13px,rgba(231,201,154,0.16)_13px_14px)]" />
      </div>

      <div className="flex">
        <Post className="w-4 sm:w-5" />

        {/* 左列：梅瓶、笔筒 */}
        <div className="hidden w-[170px] shrink-0 flex-col md:flex">
          <Cell className="flex items-end justify-center pb-1">
            <Ornament src="/art/meiping.webp" w={119} h={128} />
          </Cell>
          <Cell className="flex items-end justify-center pb-1">
            <Ornament src="/art/bitong.webp" w={62} h={104} />
          </Cell>
        </div>
        <Post className="hidden md:block" />

        {/* 中格：案例函套 */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Cell>
            <div
              ref={rowRef}
              role="tablist"
              aria-label="案例书架"
              onScroll={measure}
              className="no-scrollbar h-[306px] snap-x snap-proximity overflow-x-auto overflow-y-hidden scroll-px-12"
            >
              <div className="mx-auto flex h-full w-max items-end gap-3 px-5 pt-10 sm:gap-5 sm:px-12">
              {items.map(({ item, ready, vol }, index) => {
                const active = item.slug === current
                const height = 236 - (index % 3) * 14
                return (
                  <button
                    key={item.slug}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-disabled={!ready}
                    onClick={() => ready && onPick(item.slug)}
                    onMouseEnter={() => onPeek?.(item.slug)}
                    onMouseLeave={() => onPeek?.(null)}
                    onFocus={() => onPeek?.(item.slug)}
                    onBlur={() => onPeek?.(null)}
                    title={ready && vol ? `${item.industry} · 卷${cnNum(vol)}` : `${item.industry} · 还在写`}
                    className={cn(
                      'spine-pull shelf-rise group relative flex w-[78px] shrink-0 snap-center flex-col items-center rounded-t-[2px] pb-3 pt-4 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:w-[92px]',
                      active ? '-translate-y-5 brightness-110' : ready ? 'hover:-translate-y-2 hover:brightness-105' : 'cursor-not-allowed opacity-80',
                    )}
                    style={{
                      animationDelay: `${Math.min(index, 10) * 45}ms`,
                      height,
                      backgroundColor: ready ? '#3d5468' : '#e3d5b6',
                      backgroundImage: ready
                        ? "url('/art/case-cloth.webp'), linear-gradient(90deg, rgba(0,0,0,0.28), rgba(255,255,255,0.06) 18%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.25))"
                        : 'repeating-linear-gradient(0deg,#e6d8bb 0 6px,#dccba8 6px 7px)',
                      backgroundBlendMode: ready ? 'multiply' : undefined,
                      backgroundSize: ready ? '160px, 100%' : undefined,
                      boxShadow: active
                        ? '0 22px 30px -16px rgba(0,0,0,0.9), 0 0 0 1px rgba(231,201,154,0.4), 0 0 26px -6px rgba(255,200,130,0.35)'
                        : '0 10px 18px -12px rgba(0,0,0,0.85)',
                    }}
                  >
                    {/* 函套上下包角 */}
                    <span aria-hidden className="absolute inset-x-0 top-0 h-2 bg-black/20" />
                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-2 bg-black/25" />

                    {/* 题签：只写短名，长了会顶到签外 */}
                    <span
                      className={cn(
                        'relative flex flex-1 items-start justify-center overflow-hidden px-2 py-3',
                        ready ? 'bg-[#efe3c6] text-ink shadow-[0_1px_0_rgba(0,0,0,0.25)]' : 'border border-ink/20 text-ink/45',
                      )}
                    >
                      <span className="kai vertical text-[16px] leading-[1.15] tracking-[0.22em] sm:text-[18px]">
                        {Array.from(item.short ?? item.industry).slice(0, 5).join('')}
                      </span>
                    </span>

                    <span className={cn('kai mt-2.5 text-[12px] tracking-[0.25em]', ready ? 'text-[#efe3c6]/85' : 'text-ink/45')}>
                      {ready && vol ? `卷${cnNum(vol)}` : '待续'}
                    </span>

                    {/* 骨签扣：函套侧边的两枚别子 */}
                    {ready ? (
                      <span aria-hidden className="absolute -right-[5px] top-[28%] flex flex-col gap-[38px]">
                        <span className="block h-[14px] w-[7px] rounded-[2px] bg-[#e9dcc0] shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                        <span className="block h-[14px] w-[7px] rounded-[2px] bg-[#e9dcc0] shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                      </span>
                    ) : null}

                    {/* 抽出来的那一函，骨签扣上垂一缕红穗 */}
                    <span
                      aria-hidden
                      className={cn(
                        'pointer-events-none absolute -right-[9px] top-[calc(28%+56px)] z-[2] origin-top transition-all duration-500',
                        active ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
                      )}
                    >
                      <SwordTassel className="h-[72px] drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]" />
                    </span>
                  </button>
                )
              })}
              </div>
            </div>

            {/* 插不下时两边压暗，像书往格子深处退进去 */}
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-y-0 left-0 z-[2] w-16 bg-gradient-to-r from-[#1c120b] to-transparent transition-opacity duration-300',
                edge.left ? 'opacity-100' : 'opacity-0',
              )}
            />
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-y-0 right-0 z-[2] w-16 bg-gradient-to-l from-[#1c120b] to-transparent transition-opacity duration-300',
                edge.right ? 'opacity-100' : 'opacity-0',
              )}
            />
            <PushButton side="left" show={edge.left} onClick={() => push(-1)} />
            <PushButton side="right" show={edge.right} onClick={() => push(1)} />
          </Cell>
        </div>

        <Post className="hidden md:block" />
        {/* 右列：平放的书、印石印泥 */}
        <div className="hidden w-[170px] shrink-0 flex-col md:flex">
          <Cell className="flex items-end justify-center pb-0">
            <LyingBooks />
          </Cell>
          <Cell className="flex items-end justify-center">
            <SealStone />
          </Cell>
        </div>

        <Post className="w-4 sm:w-5" />
      </div>

      {/* 抽屉 */}
      <div className="flex">
        <Post className="w-4 sm:w-5" />
        <div aria-hidden className="flex h-11 flex-1 gap-[3px] bg-[#2a1b12] p-[3px]">
          <Drawer />
          <Drawer />
          <span className="hidden flex-1 md:flex">
            <Drawer />
          </span>
        </div>
        <Post className="w-4 sm:w-5" />
      </div>

      {/* 牙板：中间挖一道壸门弧，两端落成架脚 */}
      <div
        aria-hidden
        className="shelf-apron h-7"
        style={WOOD_H}
      />
    </div>
  )
}
