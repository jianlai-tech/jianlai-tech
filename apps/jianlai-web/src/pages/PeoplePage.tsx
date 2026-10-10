import { useMemo, useState } from 'react'
import { PineBranch } from '@/components/Accents'
import { ScrollPortrait } from '@/components/ScrollPortrait'
import {
  RESUME_FIELDS,
  displayName,
  principal,
  residents,
  type StaffRecord,
} from '@/content/studio'
import { cn } from '@/lib/cn'

type CraftFilter = '全部' | StaffRecord['craft']

function Resume({ person }: { person: StaffRecord }) {
  return (
    <dl className="mt-5 border-t border-ink/40">
      {RESUME_FIELDS.map((field) => {
        const value = person.resume[field.key]
        return (
          <div
            key={field.key}
            className="grid grid-cols-[5.5rem_1fr] items-baseline gap-3 border-b border-ink/15 py-2.5"
          >
            <dt className="kai text-[15px] text-ink/60">{field.label}</dt>
            <dd className={value ? 'text-[16px] leading-relaxed' : 'kai text-[15px] text-ink/40'}>
              {value ?? '还在整理'}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

/** 昵称命中处用朱砂描一下 */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent text-cinnabar">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  )
}

export function PeoplePage() {
  const lead = principal()
  const team = residents()
  const total = team.length + (lead ? 1 : 0)
  const [query, setQuery] = useState('')
  const [craft, setCraft] = useState<CraftFilter>('全部')

  const crafts = useMemo<CraftFilter[]>(
    () => ['全部', ...Array.from(new Set(team.map((p) => p.craft)))],
    [team],
  )

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return team.filter(
      (p) => (craft === '全部' || p.craft === craft) && (!q || p.alias.toLowerCase().includes(q)),
    )
  }, [team, query, craft])

  const filtering = query.trim() !== '' || craft !== '全部'
  const leadMatches = lead && (!query.trim() || lead.alias.toLowerCase().includes(query.trim().toLowerCase())) && craft === '全部'

  return (
    <main className="relative mx-auto max-w-[1280px] px-5 pb-10 sm:px-[54px]">
      <PineBranch className="absolute right-[54px] top-0 hidden w-[300px] opacity-70 mix-blend-multiply xl:block" />
      <div className="relative flex items-center gap-5 pt-8">
        <h1 className="title-swash brush text-[56px] leading-none sm:text-[80px]">剑修名册</h1>
      </div>
      <p className="mt-5 max-w-2xl text-[18px] leading-[1.8] text-ink/80">
        现在一共 {total} 位：1 位道长，{team.length} 位剑修。剑修大多还在上大学，跟着真实项目边做边学，用 AI 干活。道长负责接活，看你公司的情况，再派合适的剑修下山。
      </p>

      <div className="sticky top-0 z-10 -mx-5 mt-10 border-y border-ink/25 bg-[#eddec4]/95 px-5 py-4 backdrop-blur-[2px] sm:-mx-[54px] sm:px-[54px]">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <label className="flex min-w-[240px] flex-1 items-center gap-3 border-b border-ink/40 pb-1.5 sm:max-w-[360px]">
            <span className="kai shrink-0 text-[16px] text-ink/60">寻人</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入昵称，如：木木"
              aria-label="按昵称搜索剑修"
              className="w-full bg-transparent text-[17px] outline-none placeholder:text-ink/35"
            />
          </label>
          <div role="group" aria-label="按手艺筛选" className="flex flex-wrap gap-2">
            {crafts.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={craft === item}
                onClick={() => setCraft(item)}
                className={cn(
                  'kai border px-3.5 py-1 text-[15px] transition-colors duration-200',
                  craft === item
                    ? 'border-ink bg-ink text-[#f2e7cf]'
                    : 'border-ink/30 text-ink/70 hover:border-ink hover:text-ink',
                )}
              >
                {item}
              </button>
            ))}
          </div>
          {filtering ? (
            <p className="kai text-[15px] text-ink/60" role="status">
              找到 {shown.length + (leadMatches ? 1 : 0)} 位
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setCraft('全部')
                }}
                className="ink-link ml-3"
              >
                清空
              </button>
            </p>
          ) : null}
        </div>
      </div>

      {lead && leadMatches ? (
        <section
          id={lead.slug}
          className="book mt-10 grid scroll-mt-28 items-start gap-10 p-6 sm:p-10 md:grid-cols-[minmax(0,380px)_1fr]"
        >
          <ScrollPortrait
            person={lead}
            title="剑来 · 道长像"
            role="道长"
            large
          />
          <div>
            <p className="kai text-[16px] text-cinnabar">道长</p>
            <h2 className="brush mt-1 text-[52px] leading-none">
              <Highlight text={displayName(lead)} query={query} />
            </h2>
            <Resume person={lead} />
          </div>
        </section>
      ) : null}

      <section className="mt-14" aria-labelledby="roster-title">
        <div className="flex items-end justify-between gap-4 border-b-2 border-ink pb-3">
          <h2 id="roster-title" className="brush text-[48px] leading-none">
            剑修画像册
          </h2>
          <p className="kai text-[16px] text-ink/60">
            {filtering ? `${shown.length} / ${team.length}` : team.length} 轴 · 停在画上看题跋
          </p>
        </div>
        {shown.length === 0 ? (
          <div className="py-16 text-center">
            <p className="brush text-[34px]">名册上没找到这位</p>
            <p className="kai mt-3 text-[16px] text-ink/60">换个昵称试试，或者清空条件看全部剑修。</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-x-8 gap-y-14 pt-10 min-[480px]:grid-cols-2 lg:grid-cols-3">
            {shown.map((person) => (
              <li key={person.slug} id={person.slug} className="scroll-mt-28">
                <ScrollPortrait
                  person={person}
                  role={`剑修 · ${person.craft}`}
                      />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
