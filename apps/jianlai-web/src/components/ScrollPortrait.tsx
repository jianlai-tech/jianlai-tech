import { useState } from 'react'
import { Seal } from '@/components/Seal'
import type { StaffRecord } from '@/content/studio'
import { cn } from '@/lib/cn'

/** 名章只刻昵称；四字以上只取前四字 */
function sealChars(alias: string) {
  return Array.from(alias).slice(0, 4).join('')
}

/** 题跋里只放擅长和性格；没写的给一句留白 */
function Colophon({ person, large }: { person: StaffRecord; large?: boolean }) {
  const lines: { k: string; v?: string }[] = [
    { k: '擅长', v: person.resume.skills },
    { k: '性格', v: person.resume.character },
  ]
  const filled = lines.filter((l) => l.v)
  return (
    <div className={cn('kai text-ink/85', large ? 'text-[16px] leading-[1.9]' : 'text-[14px] leading-[1.8]')}>
      {filled.length > 0 ? (
        filled.map((l) => (
          <p key={l.k}>
            <span className="text-cinnabar/85">{l.k}</span>　{l.v}
          </p>
        ))
      ) : (
        <p className="text-ink/50">题跋还在写，待这位剑修自己落款。</p>
      )}
    </div>
  )
}

/**
 * 一轴立轴画像：天杆、锦边、画心、地杆。
 * 鼠标停在画上（或键盘聚焦、手机轻点），画心下方的题跋像墨迹一样洇开。
 */
export function ScrollPortrait({
  person,
  title,
  role,
  large,
}: {
  person: StaffRecord
  /** 裱边下沿的签条；不传就不写，免得和轴下的名牌重复 */
  title?: string
  role: string
  large?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <figure
      tabIndex={0}
      aria-label={`${person.alias}的立轴画像，${role}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
      className={cn('group relative mx-auto flex w-full cursor-default flex-col items-center outline-none', large ? 'max-w-[380px]' : 'max-w-[260px]', open && 'ink-reveal-on')}
    >
      {/* 挂绳 */}
      <span aria-hidden className="h-5 w-px bg-ink/50" />
      <span aria-hidden className="-mt-px h-2 w-10 rounded-t-full border-x border-t border-ink/50" />

      {/* 天杆 */}
      <span aria-hidden className="relative h-3 w-[92%] rounded-full bg-gradient-to-b from-[#6b4a2b] to-[#3c2617] shadow-[0_2px_3px_rgba(0,0,0,0.35)]" />

      {/* 裱褙：外锦边 + 内画心 */}
      <div
        className="relative w-[86%] px-[8%] pb-[10%] pt-[12%] shadow-[0_18px_28px_-18px_rgba(28,26,23,0.7)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1"
        style={{
          backgroundColor: '#8e9a98',
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 6px), linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.12))',
        }}
      >
        {/* 惊燕：天头两条垂带 */}
        <span aria-hidden className="absolute left-[34%] top-0 h-[10%] w-[5%] bg-[#d7ccb1]/80" />
        <span aria-hidden className="absolute right-[34%] top-0 h-[10%] w-[5%] bg-[#d7ccb1]/80" />

        <div className="relative bg-[#f3ead6] p-[6%] shadow-[inset_0_0_0_1px_rgba(28,26,23,0.15),inset_0_0_24px_rgba(150,112,64,0.18)]">
          <img
            src={person.portrait}
            alt={`${person.alias}的画像`}
            width={640}
            height={640}
            loading={large ? 'eager' : 'lazy'}
            className="ink-portrait aspect-[4/5] w-full object-cover object-top"
          />

          {/* 名章：不题字，只在画心右上钤一方 */}
          <Seal
            chars={sealChars(person.alias)}
            size={Array.from(sealChars(person.alias)).length === 4 ? (large ? 58 : 42) : large ? 34 : 26}
            title={person.alias}
            className="absolute right-[7%] top-[6%] -rotate-3 mix-blend-multiply"
          />

          {/* 题跋：默认看不见，停留时墨迹洇出；没洇出前留几道淡墨界栏，像等人落款的空纸 */}
          <div className="relative mt-3 border-t border-ink/15 pt-2.5">
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-x-0 bottom-0 top-2.5 flex items-start transition-opacity duration-700',
                open ? 'opacity-0' : 'opacity-100',
              )}
            >
              <span
                className={cn('kai shrink-0 text-cinnabar/45', large ? 'text-[13px]' : 'text-[12px]')}
                style={{ lineHeight: large ? '30px' : '25px' }}
              >
                题跋
              </span>
              <span
                className="ml-2 h-full flex-1"
                style={{
                  backgroundImage: `repeating-linear-gradient(180deg, transparent 0 ${large ? 29 : 24}px, rgba(28,26,23,0.1) ${large ? 29 : 24}px ${large ? 30 : 25}px)`,
                }}
              />
            </span>
            <div className="ink-reveal">
              <Colophon person={person} large={large} />
            </div>
          </div>
        </div>

        {title ? <p className="kai mt-3 text-center text-[13px] tracking-[0.25em] text-[#f1e8d3]/90">{title}</p> : null}
      </div>

      {/* 地杆 + 轴头 */}
      <span aria-hidden className="relative -mt-px flex h-4 w-[96%] items-center justify-between">
        <span className="h-5 w-3 rounded-[3px] bg-[#2a1a10]" />
        <span className="h-3 flex-1 bg-gradient-to-b from-[#6b4a2b] to-[#3c2617] shadow-[0_3px_4px_rgba(0,0,0,0.35)]" />
        <span className="h-5 w-3 rounded-[3px] bg-[#2a1a10]" />
      </span>

      <figcaption className="mt-4 text-center">
        <span className="kai text-[15px] text-cinnabar">{role}</span>
        {person.name && person.name !== person.alias ? (
          <span className="ml-2 text-[14px] text-ink/55">{person.name}</span>
        ) : null}
        <span className="kai mt-1 block text-[12px] text-ink/40 sm:hidden">轻点看题跋</span>
      </figcaption>
    </figure>
  )
}
