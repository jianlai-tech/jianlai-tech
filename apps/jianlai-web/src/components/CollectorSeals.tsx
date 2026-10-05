import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { SEAL_LIST, useSeals } from '@/lib/seals'
import { cn } from '@/lib/cn'

/** 一方小朱文印：已钤是朱砂实底，未钤是淡淡的印框 */
function MiniSeal({ char, on, fresh }: { char: string; on: boolean; fresh: boolean }) {
  return (
    <span
      className={cn(
        'kai grid h-7 w-7 place-items-center text-[15px] leading-none transition-all duration-500',
        on ? 'bg-cinnabar text-[#f5ecd9] shadow-[inset_0_0_0_2px_rgba(245,236,217,0.35)]' : 'border border-dashed border-ink/30 text-ink/25',
        fresh && 'seal-press',
      )}
    >
      {char}
    </span>
  )
}

/** 页脚藏书印：看过剑谱、案例集、名册各钤一方，三方集齐提示喊剑 */
export function CollectorSeals() {
  const seals = useSeals()
  const prev = useRef(seals)
  const [fresh, setFresh] = useState<string | null>(null)

  useEffect(() => {
    const added = seals.find((k) => !prev.current.includes(k))
    prev.current = seals
    if (!added) return
    setFresh(added)
    const t = window.setTimeout(() => setFresh(null), 900)
    return () => window.clearTimeout(t)
  }, [seals])

  const done = seals.length === SEAL_LIST.length

  return (
    <div className="flex items-center gap-3" aria-label={`藏书印 ${seals.length}/${SEAL_LIST.length}`}>
      <span className="flex gap-1.5">
        {SEAL_LIST.map((s) => (
          <span key={s.key} title={seals.includes(s.key) ? `已阅${s.label}` : `还没看${s.label}`}>
            <MiniSeal char={s.char} on={seals.includes(s.key)} fresh={fresh === s.key} />
          </span>
        ))}
      </span>
      {done ? (
        <Link to="/start" className="kai text-[14px] text-cinnabar no-underline hover:underline">
          三印已齐，可以喊一声剑来了 →
        </Link>
      ) : (
        <span className="kai text-[13px] text-ink/45">
          藏书印 {seals.length}/3 · 看完剑谱、案例集、名册各钤一方
        </span>
      )}
    </div>
  )
}
