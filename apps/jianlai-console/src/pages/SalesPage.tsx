import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { diffDays, dueText, fmtMD, todayIso } from '@/lib/date'
import { FORM_LINE, person } from '@/data/studio'
import {
  DISPATCHABLE,
  STAGES,
  useStore,
  type Lead,
  type Stage,
} from '@/data/store'
import {
  Avatar,
  AvatarStack,
  Chip,
  Empty,
  MetricStrip,
  PageHead,
  SectionHead,
  Segmented,
  Sheet,
  Stamp,
  Tabs,
  type Tone,
} from '@/components/ui'

const STAGE_TONE: Record<Stage, Tone> = {
  new: 'cinnabar',
  talked: 'ochre',
  judge: 'ochre',
  sent: 'jade',
  drop: 'plain',
}

const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.key, s.label])) as Record<Stage, string>

const DROP_REASONS = ['现阶段没有可接的系统', '预算对不上', '不是我们的活', '联系不上'] as const

type Filter = Stage | 'all'

function followCell(lead: Lead) {
  if (lead.nextFollow === null) return <span className="text-ink3">—</span>
  const late = diffDays(lead.nextFollow, todayIso()) < 0
  return (
    <span className={cn('font-semibold', late && 'text-cinnabar')}>{dueText(lead.nextFollow)}</span>
  )
}

const STEPS: { key: string; label: string }[] = [
  { key: 'created', label: '留资' },
  { key: 'talked', label: '回访' },
  { key: 'judge', label: '道长判断' },
  { key: 'sent', label: '派人' },
]

function stepIndex(stage: Stage) {
  if (stage === 'new') return 0
  if (stage === 'talked') return 1
  if (stage === 'judge') return 2
  if (stage === 'sent') return 3
  return -1
}

function Steps({ lead }: { lead: Lead }) {
  const at = stepIndex(lead.stage)
  return (
    <ol className="flex items-center gap-1.5" aria-label="进度">
      {STEPS.map((step, index) => {
        const done = at > index || lead.stage === 'sent'
        const current = at === index && lead.stage !== 'sent'
        return (
          <li key={step.key} className="flex items-center gap-1.5">
            <span
              className={cn(
                'flex h-6 items-center gap-1.5 rounded-sm border px-2 text-[12px] font-semibold',
                done && 'border-jade/40 bg-jadewash text-jade',
                current && 'border-cinnabar bg-cinnabarwash text-cinnabar',
                !done && !current && 'border-ink/20 text-ink3',
              )}
              aria-current={current ? 'step' : undefined}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 ? <span aria-hidden className="h-px w-3 bg-ink/30" /> : null}
          </li>
        )
      })}
    </ol>
  )
}

function Detail({ lead }: { lead: Lead }) {
  const { advanceLead, sendLead, dropLead, reopenLead } = useStore()
  const [picked, setPicked] = useState<string[]>([])
  const [dropping, setDropping] = useState(false)
  const [reason, setReason] = useState<string | null>(null)

  const sentPeople = lead.sentTo.flatMap((slug) => {
    const found = person(slug)
    return found ? [found] : []
  })

  return (
    <div className="flex flex-col">
      <div className="hair-b px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="title-serif truncate text-[18px] leading-7">{lead.company}</h3>
            <p className="text-[14px] text-ink2">
              {lead.contact} · <span className="tabular-nums">{lead.phone}</span>
            </p>
          </div>
          {lead.stage === 'sent' ? (
            <Stamp>已派人</Stamp>
          ) : (
            <Chip tone={STAGE_TONE[lead.stage]}>{STAGE_LABEL[lead.stage]}</Chip>
          )}
        </div>
        {lead.stage !== 'drop' ? (
          <div className="mt-3 overflow-x-auto">
            <Steps lead={lead} />
          </div>
        ) : null}
      </div>

      <dl className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-3 gap-y-2.5 px-4 py-3 text-[14px]">
        <dt className="label pt-0.5">要斩的</dt>
        <dd>
          <span className="font-semibold">{lead.scene}</span>
          <span className="ml-2 text-ink3">{FORM_LINE[lead.scene]}</span>
        </dd>
        <dt className="label pt-0.5">他们说</dt>
        <dd className="kai text-[15px] leading-6">{lead.note}</dd>
        <dt className="label pt-0.5">来源</dt>
        <dd>
          {lead.source} · 留资 {fmtMD(lead.createdAt)}
        </dd>
        <dt className="label pt-0.5">下次回访</dt>
        <dd>{followCell(lead)}</dd>
        {lead.stage === 'sent' ? (
          <>
            <dt className="label pt-1.5">驻场</dt>
            <dd className="flex items-center gap-2">
              <AvatarStack people={sentPeople} size={32} />
              <span className="text-ink2">{sentPeople.map((p) => p.alias).join('、')}</span>
            </dd>
          </>
        ) : null}
        {lead.stage === 'drop' ? (
          <>
            <dt className="label pt-0.5">没接的原因</dt>
            <dd>{lead.dropReason}</dd>
          </>
        ) : null}
      </dl>

      <div className="hair-t flex flex-col gap-3 px-4 py-3">
        {dropping ? (
          <>
            <p className="text-[14px] font-semibold">为什么不接？</p>
            <div className="flex flex-wrap gap-1.5">
              {DROP_REASONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={reason === item}
                  onClick={() => setReason(item)}
                  className={cn(
                    'h-8 rounded-sm border px-2.5 text-[13px] font-semibold transition-colors duration-150',
                    reason === item
                      ? 'border-ink bg-ink text-paper'
                      : 'border-ink/30 hover:bg-sel',
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-danger"
                disabled={!reason}
                onClick={() => reason && dropLead(lead.id, reason)}
              >
                确认不接
              </button>
              <button type="button" className="btn btn-quiet" onClick={() => setDropping(false)}>
                再想想
              </button>
            </div>
          </>
        ) : (
          <>
            {lead.stage === 'new' ? (
              <p className="text-[13px] text-ink3">回访完点一下，系统自动约三天后再跟一次。</p>
            ) : null}

            {lead.stage === 'judge' ? (
              <>
                <p className="text-[14px] font-semibold">派谁去？</p>
                <div className="flex flex-wrap gap-1.5">
                  {DISPATCHABLE.map((item) => {
                    const on = picked.includes(item.slug)
                    return (
                      <button
                        key={item.slug}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setPicked((all) =>
                            on ? all.filter((slug) => slug !== item.slug) : [...all, item.slug],
                          )
                        }
                        className={cn(
                          'flex h-9 items-center gap-2 rounded-sm border py-0 pl-1 pr-2.5 text-[13px] font-semibold transition-colors duration-150',
                          on ? 'border-ink bg-ink text-paper' : 'border-ink/30 hover:bg-sel',
                        )}
                      >
                        <Avatar person={item} size={28} />
                        {item.alias}
                        <span className={cn('font-normal', on ? 'text-paper/70' : 'text-ink3')}>
                          {item.gate?.[0]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              {lead.stage === 'new' ? (
                <button type="button" className="btn btn-primary" onClick={() => advanceLead(lead.id)}>
                  已回访
                </button>
              ) : null}
              {lead.stage === 'talked' ? (
                <button type="button" className="btn btn-primary" onClick={() => advanceLead(lead.id)}>
                  交给道长判断
                </button>
              ) : null}
              {lead.stage === 'judge' ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={picked.length === 0}
                  onClick={() => sendLead(lead.id, picked)}
                >
                  确认派人{picked.length > 0 ? `（${picked.length}）` : ''}
                </button>
              ) : null}
              {lead.stage === 'drop' ? (
                <button type="button" className="btn" onClick={() => reopenLead(lead.id)}>
                  重新打开
                </button>
              ) : null}
              {lead.stage !== 'sent' && lead.stage !== 'drop' ? (
                <button type="button" className="btn btn-quiet" onClick={() => setDropping(true)}>
                  不接
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function LeadsTab() {
  const { leads } = useStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const counts = useMemo(() => {
    const base: Record<Filter, number> = { all: leads.length, new: 0, talked: 0, judge: 0, sent: 0, drop: 0 }
    for (const lead of leads) base[lead.stage] += 1
    return base
  }, [leads])

  const rows = useMemo(() => {
    const live = (stage: Stage) => stage === 'new' || stage === 'talked' || stage === 'judge'
    return leads
      .filter((lead) => filter === 'all' || lead.stage === filter)
      .sort((a, b) => {
        if (live(a.stage) !== live(b.stage)) return live(a.stage) ? -1 : 1
        if (live(a.stage)) return (a.nextFollow ?? '9999').localeCompare(b.nextFollow ?? '9999')
        return b.createdAt.localeCompare(a.createdAt)
      })
  }, [leads, filter])

  const selected = rows.find((lead) => lead.id === selectedId) ?? rows[0] ?? null

  return (
    <>
      <div className="mb-3 overflow-x-auto">
        <Segmented<Filter>
          label="按阶段筛"
          value={filter}
          onChange={setFilter}
          options={[
            { key: 'all', label: `全部 ${counts.all}` },
            ...STAGES.map((stage) => ({ key: stage.key as Filter, label: `${stage.label} ${counts[stage.key]}` })),
          ]}
        />
      </div>

      <div className="grid items-start gap-4 xl:[grid-template-columns:minmax(0,1fr)_400px]">
        <Sheet className="overflow-hidden">
          {rows.length === 0 ? (
            <Empty title="这一栏现在是空的" hint="官网「企业喊一声，剑来」留下的资料，会自己落到这里。" />
          ) : (
            <div className="max-h-[560px] overflow-auto">
              <table className="ops-table min-w-[720px]">
                <thead>
                  <tr>
                    <th>公司</th>
                    <th>要斩的</th>
                    <th>来源</th>
                    <th>留资</th>
                    <th>下次回访</th>
                    <th>阶段</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((lead) => (
                    <tr
                      key={lead.id}
                      data-row
                      tabIndex={0}
                      aria-selected={selected?.id === lead.id}
                      onClick={() => setSelectedId(lead.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedId(lead.id)
                        }
                      }}
                    >
                      <td>
                        <div className="font-semibold">{lead.company}</div>
                        <div className="text-[13px] text-ink3">{lead.contact}</div>
                      </td>
                      <td>{lead.scene}</td>
                      <td className="text-ink2">{lead.source}</td>
                      <td className="text-ink2 tabular-nums">{fmtMD(lead.createdAt)}</td>
                      <td className="tabular-nums">{followCell(lead)}</td>
                      <td>
                        <Chip tone={STAGE_TONE[lead.stage]}>{STAGE_LABEL[lead.stage]}</Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Sheet>

        <Sheet className="xl:sticky xl:top-6">
          {selected ? (
            <Detail key={selected.id} lead={selected} />
          ) : (
            <Empty title="点一行看详情" hint="回访、判断、派人，都在这一栏里办。" />
          )}
        </Sheet>
      </div>
    </>
  )
}

function SitesTab() {
  const { sites } = useStore()
  return (
    <Sheet className="overflow-hidden">
      <SectionHead title="现场" demo hint="只写行业，不写客户名" />
      <div className="overflow-auto">
        <table className="ops-table min-w-[680px]">
          <thead>
            <tr>
              <th>现场</th>
              <th>状态</th>
              <th>驻场</th>
              <th>开始</th>
              <th>下一步</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => (
              <tr key={site.id}>
                <td className="font-semibold">{site.industry}</td>
                <td>
                  <Chip tone={site.status === '驻场中' ? 'jade' : site.status === '立项中' ? 'ochre' : 'plain'}>
                    {site.status}
                  </Chip>
                </td>
                <td>
                  <AvatarStack
                    people={site.staff.flatMap((slug) => {
                      const found = person(slug)
                      return found ? [found] : []
                    })}
                  />
                </td>
                <td className="text-ink2 tabular-nums">{fmtMD(site.since)}</td>
                <td className="text-ink2">{site.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Sheet>
  )
}

export function SalesPage() {
  const { leads, sites } = useStore()
  const [tab, setTab] = useState<'leads' | 'sites'>('leads')
  const today = todayIso()

  const toFollow = leads.filter(
    (lead) =>
      (lead.stage === 'new' || lead.stage === 'talked') &&
      lead.nextFollow !== null &&
      diffDays(lead.nextFollow, today) <= 0,
  ).length
  const judging = leads.filter((lead) => lead.stage === 'judge').length
  const sent = leads.filter((lead) => lead.stage === 'sent').length
  const decided = leads.filter((lead) => lead.stage === 'sent' || lead.stage === 'drop').length

  return (
    <>
      <PageHead
        title="销售"
        note="从留资到派人"
        demo
        tabs={
          <Tabs
            label="销售"
            value={tab}
            onChange={setTab}
            tabs={[
              { key: 'leads', label: '留资线索', count: leads.length },
              { key: 'sites', label: '现场', count: sites.length },
            ]}
          />
        }
      />

      <div className="mb-4">
        <MetricStrip
          items={[
            { label: '今日待回访', value: String(toFollow), sub: '含已逾期', tone: toFollow > 0 ? 'cinnabar' : 'ink' },
            { label: '等道长判断', value: String(judging) },
            { label: '已派人', value: String(sent) },
            {
              label: '已判断的留资',
              value: String(decided),
              sub: decided > 0 ? `其中 ${sent} 个接了` : '还没有',
            },
          ]}
        />
      </div>

      {tab === 'leads' ? <LeadsTab /> : <SitesTab />}
    </>
  )
}
