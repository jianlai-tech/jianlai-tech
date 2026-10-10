import { useState } from 'react'
import { asset, cn } from '@/lib/cn'
import {
  DIMS,
  DISPATCH_BY_TIER,
  GATES,
  PEOPLE,
  RESUME_FIELDS,
  TIER_NAME,
  WEEKDAYS,
  personTitle,
  realmName,
  tierOfRealm,
  type Person,
  type Tier,
} from '@/data/studio'
import { useStore, type Eval } from '@/data/store'
import {
  Avatar,
  Chip,
  MetricStrip,
  PageHead,
  SectionHead,
  Segmented,
  Sheet,
  Tabs,
} from '@/components/ui'

const TIER_CHAR: Record<Tier, string> = { 1: '下', 2: '中', 3: '上' }

function isRated(eval_: Eval | undefined) {
  return DIMS.every((dim) => eval_?.[dim.key])
}

/** 剑从最薄处断：四维里最短的一维 */
function weakest(eval_: Eval | undefined) {
  if (!eval_ || !isRated(eval_)) return null
  let low = DIMS[0]
  let lowTier: Tier = eval_[low.key] ?? 3
  for (const dim of DIMS) {
    const tier: Tier = eval_[dim.key] ?? 3
    if (tier < lowTier) {
      low = dim
      lowTier = tier
    }
  }
  return { dim: low, tier: lowTier }
}

function MiniDims({ eval_ }: { eval_: Eval | undefined }) {
  return (
    <span className="inline-flex gap-1">
      {DIMS.map((dim) => {
        const tier = eval_?.[dim.key]
        return (
          <span
            key={dim.key}
            aria-label={`${dim.name}${tier ? TIER_NAME[tier] : '待评'}`}
            title={`${dim.name} ${tier ? TIER_NAME[tier] : '待评'}`}
            className={cn(
              'grid h-6 w-6 place-items-center rounded-sm border text-[12px] font-bold',
              tier ? 'border-ink/40 bg-sel text-ink' : 'border-dashed border-ink/25 text-ink3',
            )}
          >
            {tier ? TIER_CHAR[tier] : '·'}
          </span>
        )
      })}
    </span>
  )
}

function PersonDetail({ item }: { item: Person }) {
  const { evals, setEval } = useStore()
  const eval_ = evals[item.slug]
  const low = weakest(eval_)

  return (
    <div className="flex flex-col">
      <div className="hair-b flex items-center gap-4 px-4 py-4">
        <div className="shrink-0 border border-ink/30 bg-sheet2 p-1">
          <img
            src={asset(item.portrait)}
            alt={`${item.alias}的画像`}
            width={80}
            height={80}
            className="ink-portrait h-20 w-20 object-cover"
          />
        </div>
        <div className="min-w-0">
          <h3 className="title-serif text-[20px] leading-7">{item.alias}</h3>
          <p className="text-[14px] text-ink2">{item.name}</p>
          <p className="mt-1 font-mono text-[12px] text-ink3">{item.id}</p>
          <p className="mt-1">
            <Chip tone={item.chief ? 'cinnabar' : 'plain'}>{personTitle(item)}</Chip>
          </p>
        </div>
      </div>

      <section className="hair-b px-4 py-3">
        <div className="mb-2 flex items-baseline justify-between">
          <h4 className="title-serif text-[15px]">剑的四维</h4>
          <span className="text-[12px] text-ink3">点已选的再点一次，清掉</span>
        </div>
        <ul className="flex flex-col gap-3">
          {DIMS.map((dim) => {
            const tier = eval_?.[dim.key] ?? null
            return (
              <li key={dim.key}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[14px] font-semibold">
                    {dim.name}
                    <span className="ml-1.5 text-[13px] font-normal text-ink3">{dim.asks}</span>
                  </span>
                  <Segmented<Tier>
                    label={`${dim.name}评到哪一境`}
                    value={tier}
                    onChange={(next) => setEval(item.slug, dim.key, next === tier ? null : next)}
                    options={([1, 2, 3] as Tier[]).map((key) => ({
                      key,
                      label: TIER_NAME[key],
                      title: dim.levels[key],
                    }))}
                  />
                </div>
                <p className="kai mt-1 min-h-5 text-[13px] text-ink3">
                  {tier ? dim.levels[tier] : '还没评'}
                  {dim.note ? ` · ${dim.note}` : ''}
                </p>
              </li>
            )
          })}
        </ul>
        <div
          className={cn(
            'mt-3 rounded-sm border px-3 py-2 text-[14px]',
            low ? 'border-ochre/40 bg-ochrewash text-ochre' : 'border-dashed border-ink/25 text-ink3',
          )}
        >
          {low ? (
            <>
              最薄处是<strong className="mx-1">{low.dim.name}</strong>（{TIER_NAME[low.tier]}）：
              {DISPATCH_BY_TIER[low.tier]}。
            </>
          ) : (
            '四维评满，才能看出这把剑的最薄处。'
          )}
        </div>
      </section>

      <section className="px-4 py-3">
        <h4 className="title-serif mb-1 text-[15px]">名册档案</h4>
        <dl>
          {RESUME_FIELDS.map((field) => (
            <div
              key={field}
              className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-3 border-b border-ink/10 py-2 last:border-b-0"
            >
              <dt className="label">{field}</dt>
              <dd className="kai text-[14px] text-ink3">还在整理</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}

function RosterTab() {
  const { evals } = useStore()
  const [selectedSlug, setSelectedSlug] = useState(PEOPLE[1].slug)
  const selected = PEOPLE.find((item) => item.slug === selectedSlug) ?? PEOPLE[0]

  return (
    <div className="grid items-start gap-4 xl:[grid-template-columns:minmax(0,1fr)_420px]">
      <Sheet className="overflow-hidden">
        <div className="overflow-auto">
          <table className="ops-table min-w-[640px]">
            <thead>
              <tr>
                <th>人</th>
                <th>门派</th>
                <th>境界</th>
                <th>四维 锋鞘心气</th>
                <th>最薄处</th>
              </tr>
            </thead>
            <tbody>
              {PEOPLE.map((item) => {
                const low = weakest(evals[item.slug])
                return (
                  <tr
                    key={item.slug}
                    data-row
                    tabIndex={0}
                    aria-selected={selected.slug === item.slug}
                    onClick={() => setSelectedSlug(item.slug)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelectedSlug(item.slug)
                      }
                    }}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar person={item} size={36} />
                        <div className="min-w-0">
                          <div className="font-semibold">{item.alias}</div>
                          <div className="text-[13px] text-ink3">{item.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-ink2">{item.gate ?? '道长'}</td>
                    <td>
                      <span className="font-semibold">{realmName(item)}</span>
                      <span className="ml-1.5 text-[12px] text-ink3">{TIER_NAME[tierOfRealm(item.realmNo)]}</span>
                    </td>
                    <td>
                      <MiniDims eval_={evals[item.slug]} />
                    </td>
                    <td>
                      {low ? (
                        <span className="text-[13px] font-semibold">
                          {low.dim.name} · {TIER_NAME[low.tier]}
                        </span>
                      ) : (
                        <span className="text-[13px] text-ink3">待评</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Sheet>

      <Sheet className="xl:sticky xl:top-6">
        <PersonDetail key={selected.slug} item={selected} />
      </Sheet>
    </div>
  )
}

function WindowTab() {
  const { windows, toggleWindow } = useStore()
  const perDay = WEEKDAYS.map((_, day) => PEOPLE.filter((item) => windows[item.slug]?.[day]).length)

  return (
    <Sheet className="overflow-hidden">
      <SectionHead title="时间窗口" demo hint="点格子改有空 / 没空，派人时先看这里" />
      <div className="overflow-auto">
        <table className="ops-table min-w-[620px]">
          <thead>
            <tr>
              <th>人</th>
              {WEEKDAYS.map((day) => (
                <th key={day} className="text-center">
                  {day}
                </th>
              ))}
              <th className="num">每周</th>
            </tr>
          </thead>
          <tbody>
            {PEOPLE.map((item) => {
              const row = windows[item.slug] ?? []
              return (
                <tr key={item.slug}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar person={item} size={32} />
                      <span className="font-semibold">{item.alias}</span>
                    </div>
                  </td>
                  {WEEKDAYS.map((day, index) => {
                    const on = Boolean(row[index])
                    return (
                      <td key={day} className="p-1.5 text-center">
                        <button
                          type="button"
                          aria-pressed={on}
                          aria-label={`${item.alias}${day}${on ? '有空' : '没空'}`}
                          onClick={() => toggleWindow(item.slug, index)}
                          className={cn(
                            'h-9 w-full min-w-14 rounded-sm border text-[13px] font-semibold transition-colors duration-150',
                            on
                              ? 'border-jade/40 bg-jadewash text-jade hover:bg-[#cfdbc0]'
                              : 'border-ink/15 text-ink3 hover:bg-sel',
                          )}
                        >
                          {on ? '有空' : '—'}
                        </button>
                      </td>
                    )
                  })}
                  <td className="num font-semibold">{row.filter(Boolean).length} 天</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="label border-t border-ink/55 px-3 py-2.5">当天有空</td>
              {perDay.map((count, index) => (
                <td
                  key={WEEKDAYS[index]}
                  className="border-t border-ink/55 px-3 py-2.5 text-center font-bold tabular-nums"
                >
                  {count}
                </td>
              ))}
              <td className="border-t border-ink/55" />
            </tr>
          </tfoot>
        </table>
      </div>
    </Sheet>
  )
}

export function HrPage() {
  const { evals } = useStore()
  const [tab, setTab] = useState<'roster' | 'window'>('roster')

  const byGate = (name: string) => PEOPLE.filter((item) => item.gate === name).length
  const tierCount = (tier: Tier) => PEOPLE.filter((item) => tierOfRealm(item.realmNo) === tier).length
  const unrated = PEOPLE.filter((item) => !isRated(evals[item.slug])).length

  return (
    <>
      <PageHead
        title="人事"
        note="名册、境界、四维"
        tabs={
          <Tabs
            label="人事"
            value={tab}
            onChange={setTab}
            tabs={[
              { key: 'roster', label: '名册', count: PEOPLE.length },
              { key: 'window', label: '时间窗口' },
            ]}
          />
        }
      />

      <div className="mb-4">
        <MetricStrip
          items={[
            { label: '在册', value: `${PEOPLE.length} 人`, sub: '含道长' },
            ...GATES.map((gate) => ({
              label: gate.name,
              value: String(byGate(gate.name)),
              sub: byGate(gate.name) === 0 ? `${gate.craft} · 还没有道友` : gate.craft,
              tone: byGate(gate.name) === 0 ? ('cinnabar' as const) : ('ink' as const),
            })),
            {
              label: '下 / 中 / 上三境',
              value: `${tierCount(1)} / ${tierCount(2)} / ${tierCount(3)}`,
              sub: '识剑到剑仙九境',
            },
            { label: '四维待评', value: `${unrated} 人`, sub: '评满才看得出最薄处' },
          ]}
        />
      </div>

      {tab === 'roster' ? <RosterTab /> : <WindowTab />}
    </>
  )
}
