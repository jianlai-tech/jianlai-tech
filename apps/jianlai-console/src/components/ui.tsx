import type { CSSProperties, ReactNode } from 'react'
import { asset, cn } from '@/lib/cn'
import type { Person } from '@/data/studio'

export type Tone = 'plain' | 'cinnabar' | 'jade' | 'ochre'

const CHIP_TONE: Record<Tone, string> = {
  plain: '',
  cinnabar: 'chip-cinnabar',
  jade: 'chip-jade',
  ochre: 'chip-ochre',
}

export function Chip({
  tone = 'plain',
  children,
  className,
  title,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
  title?: string
}) {
  return (
    <span className={cn('chip', CHIP_TONE[tone], className)} title={title}>
      {children}
    </span>
  )
}

export function DemoTag() {
  return (
    <Chip title="示意数据：还没接库，改动刷新即回到初始" className="font-normal">
      示意
    </Chip>
  )
}

/** 朱印。只盖在已经落定的事上 */
export function Stamp({ children }: { children: ReactNode }) {
  return <span className="stamp stamp-in">{children}</span>
}

export function Sheet({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('sheet', className)}>{children}</section>
}

export function SectionHead({
  title,
  demo,
  aside,
  hint,
}: {
  title: string
  demo?: boolean
  aside?: ReactNode
  hint?: string
}) {
  return (
    <header className="hair-b flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
      <div className="flex items-center gap-2.5">
        <h2 className="title-serif text-[16px] leading-6">{title}</h2>
        {demo ? <DemoTag /> : null}
        {hint ? <span className="kai text-[13px] text-ink3">{hint}</span> : null}
      </div>
      {aside ? <div className="flex items-center gap-2">{aside}</div> : null}
    </header>
  )
}

export type MetricItem = {
  label: string
  value: string
  sub?: string
  tone?: 'ink' | 'jade' | 'cinnabar'
}

/** 汇总灰条：一行数字，竖线分隔。不做同级彩色卡片墙 */
export function MetricStrip({ items }: { items: MetricItem[] }) {
  return (
    <div
      className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-ink/20 bg-ink/15 sm:grid-cols-3 lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
      style={{ '--cols': items.length } as CSSProperties}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0 bg-sheet px-4 py-3">
          <div className="label truncate">{item.label}</div>
          <div
            className={cn(
              'mt-1 text-[22px] font-bold leading-7 tabular-nums',
              item.tone === 'jade' && 'text-jade',
              item.tone === 'cinnabar' && 'text-cinnabar',
            )}
          >
            {item.value}
          </div>
          {item.sub ? <div className="mt-0.5 truncate text-[12px] text-ink3">{item.sub}</div> : null}
        </div>
      ))}
    </div>
  )
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { key: T; label: string; count?: number }[]
  value: T
  onChange: (key: T) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto">
      {tabs.map((tab) => {
        const active = tab.key === value
        return (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={cn(
              'relative -mb-px flex h-10 items-center gap-1.5 whitespace-nowrap px-3 text-[15px] font-semibold transition-colors duration-150',
              active
                ? 'border-b-2 border-cinnabar text-ink'
                : 'border-b-2 border-transparent text-ink3 hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span className={cn('text-[12px] tabular-nums', active ? 'text-cinnabar' : 'text-ink3')}>
                {tab.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { key: T; label: string; title?: string }[]
  value: T | null
  onChange: (key: T) => void
  label: string
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={String(option.key)}
          type="button"
          title={option.title}
          aria-pressed={value === option.key}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Avatar({ person, size = 32 }: { person: Person; size?: number }) {
  return (
    <img
      src={asset(person.portrait)}
      alt={`${person.alias}的画像`}
      width={size}
      height={size}
      loading="lazy"
      className="ink-portrait shrink-0 rounded-sm border border-ink/25 bg-sheet2 object-cover"
      style={{ width: size, height: size }}
    />
  )
}

export function AvatarStack({ people, size = 28 }: { people: Person[]; size?: number }) {
  if (people.length === 0) return <span className="text-ink3">—</span>
  return (
    <span className="flex items-center">
      {people.map((item, index) => (
        <span key={item.slug} className={cn(index > 0 && '-ml-1.5')} title={item.alias}>
          <Avatar person={item} size={size} />
        </span>
      ))}
    </span>
  )
}

export function PageHead({
  title,
  note,
  demo,
  tabs,
  actions,
}: {
  title: string
  note?: string
  demo?: boolean
  tabs?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-3">
          <h1 className="title-serif text-[26px] leading-9">{title}</h1>
          {note ? <span className="kai text-[15px] text-ink3">{note}</span> : null}
          {demo ? <DemoTag /> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 pb-1">{actions}</div> : null}
      </div>
      {tabs ? <div className="hair-b mt-2">{tabs}</div> : <div className="hair-b mt-2" />}
    </div>
  )
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="dotgrid flex min-h-32 flex-col items-center justify-center gap-1 px-6 py-8 text-center">
      <p className="title-serif text-[15px]">{title}</p>
      {hint ? <p className="kai max-w-sm text-[14px] text-ink3">{hint}</p> : null}
    </div>
  )
}
