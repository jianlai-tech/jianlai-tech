import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { useMemo } from 'react'
import { cn } from '@/lib/cn'
import { diffDays, dueText, fmtMDWeek, monthKey, todayIso } from '@/lib/date'
import { yuan } from '@/lib/money'
import { DIMS, PEOPLE, WEEKDAYS, person } from '@/data/studio'
import { useStore } from '@/data/store'
import {
  AvatarStack,
  Chip,
  Empty,
  MetricStrip,
  PageHead,
  SectionHead,
  Sheet,
} from '@/components/ui'

type Todo = {
  id: string
  module: '销售' | '人事' | '财务'
  text: string
  detail?: string
  due: string | null
  overdue: boolean
  to: '/sales' | '/hr' | '/finance'
}

export function OverviewPage() {
  const { leads, sites, evals, windows, ledger, receivables } = useStore()
  const today = todayIso()
  const month = monthKey(today)

  const todos = useMemo(() => {
    const rows: Todo[] = []

    for (const lead of leads) {
      if ((lead.stage === 'new' || lead.stage === 'talked') && lead.nextFollow !== null) {
        const delta = diffDays(lead.nextFollow, today)
        if (delta <= 0) {
          rows.push({
            id: `lead-${lead.id}`,
            module: '销售',
            text: `回访 ${lead.company}（${lead.contact}）`,
            detail: `要斩：${lead.scene}`,
            due: lead.nextFollow,
            overdue: delta < 0,
            to: '/sales',
          })
        }
      }
      if (lead.stage === 'judge') {
        rows.push({
          id: `judge-${lead.id}`,
          module: '销售',
          text: `判断能不能接：${lead.company}`,
          detail: '等道长拍板，再派人',
          due: null,
          overdue: false,
          to: '/sales',
        })
      }
    }

    for (const row of receivables) {
      if (row.paidOn) continue
      const delta = diffDays(row.due, today)
      if (delta <= 7) {
        rows.push({
          id: `rec-${row.id}`,
          module: '财务',
          text: `${row.counterparty} · ${row.reason}`,
          detail: `应收 ${yuan(row.amount)}`,
          due: row.due,
          overdue: delta < 0,
          to: '/finance',
        })
      }
    }

    const unrated = PEOPLE.filter((item) => DIMS.some((dim) => !evals[item.slug]?.[dim.key]))
    if (unrated.length > 0) {
      rows.push({
        id: 'eval',
        module: '人事',
        text: `${unrated.length} 位道友的四维还没评`,
        detail: '最短的一维，决定这把剑能派去多难的现场',
        due: null,
        overdue: false,
        to: '/hr',
      })
    }

    return rows.sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
      if (a.due && b.due) return a.due.localeCompare(b.due)
      if (a.due) return -1
      if (b.due) return 1
      return 0
    })
  }, [leads, receivables, evals, today])

  const toFollow = leads.filter(
    (lead) =>
      (lead.stage === 'new' || lead.stage === 'talked') &&
      lead.nextFollow !== null &&
      diffDays(lead.nextFollow, today) <= 0,
  ).length
  const live = sites.filter((site) => site.status !== '维保').length
  const monthIn = ledger
    .filter((e) => e.kind === 'in' && monthKey(e.date) === month)
    .reduce((sum, e) => sum + e.amount, 0)
  const monthOut = ledger
    .filter((e) => e.kind === 'out' && monthKey(e.date) === month)
    .reduce((sum, e) => sum + e.amount, 0)
  const open = receivables.filter((row) => !row.paidOn)
  const openSum = open.reduce((sum, row) => sum + row.amount, 0)
  const overdueSum = open
    .filter((row) => diffDays(row.due, today) < 0)
    .reduce((sum, row) => sum + row.amount, 0)

  const free = WEEKDAYS.map((_, day) => PEOPLE.filter((item) => windows[item.slug]?.[day]).length)

  return (
    <>
      <PageHead title="今日" note={fmtMDWeek(today)} />

      <MetricStrip
        items={[
          { label: '今日待回访', value: String(toFollow), sub: '含已逾期', tone: toFollow > 0 ? 'cinnabar' : 'ink' },
          { label: '在册', value: `${PEOPLE.length} 人`, sub: `道长 1 · 道友 ${PEOPLE.length - 1}` },
          { label: '进行中的现场', value: String(live), sub: `另有 ${sites.length - live} 处在维保` },
          { label: '本月收入', value: yuan(monthIn), sub: '示意', tone: 'jade' },
          { label: '本月支出', value: yuan(monthOut), sub: '示意' },
          {
            label: '应收未收',
            value: yuan(openSum),
            sub: overdueSum > 0 ? `逾期 ${yuan(overdueSum)}` : '无逾期',
            tone: overdueSum > 0 ? 'cinnabar' : 'ink',
          },
        ]}
      />

      <div className="mt-4 grid gap-4 lg:[grid-template-columns:minmax(0,1.5fr)_minmax(0,1fr)]">
        <Sheet>
          <SectionHead title="要办的事" hint="三个模块合在一处，先办逾期的" />
          {todos.length === 0 ? (
            <Empty title="手上没有挂着的事" hint="新的留资、到期的应收、该评的四维，会自己排到这里。" />
          ) : (
            <ul>
              {todos.map((todo) => (
                <li key={todo.id} className="hair-b last:border-b-0">
                  <Link
                    to={todo.to}
                    className="group flex min-h-14 items-center gap-3 px-4 py-2.5 no-underline transition-colors duration-150 hover:bg-sheet2"
                  >
                    <Chip className="w-11 shrink-0 justify-center">
                      {todo.module}
                    </Chip>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{todo.text}</span>
                      {todo.detail ? (
                        <span className="block truncate text-[13px] text-ink3">{todo.detail}</span>
                      ) : null}
                    </span>
                    {todo.due ? (
                      <span
                        className={cn(
                          'shrink-0 text-[13px] font-semibold tabular-nums',
                          todo.overdue ? 'text-cinnabar' : 'text-ink2',
                        )}
                      >
                        {dueText(todo.due)}
                      </span>
                    ) : null}
                    <ArrowUpRight
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-ink3 transition-colors group-hover:text-ink"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Sheet>

        <div className="flex flex-col gap-4">
          <Sheet>
            <SectionHead title="现场与人" demo />
            <ul>
              {sites.map((site) => (
                <li key={site.id} className="hair-b flex items-center gap-3 px-4 py-3 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-semibold">{site.industry}</span>
                      <Chip tone={site.status === '驻场中' ? 'jade' : site.status === '立项中' ? 'ochre' : 'plain'}>
                        {site.status}
                      </Chip>
                    </div>
                    <div className="mt-0.5 truncate text-[13px] text-ink3">下一步：{site.next}</div>
                  </div>
                  <AvatarStack
                    people={site.staff.flatMap((slug) => {
                      const found = person(slug)
                      return found ? [found] : []
                    })}
                  />
                </li>
              ))}
            </ul>
          </Sheet>

          <Sheet>
            <SectionHead title="本周谁有空" demo hint="周一到周五，按时间窗口" />
            <div className="grid grid-cols-5 gap-px bg-ink/10">
              {WEEKDAYS.map((day, index) => (
                <div key={day} className="bg-sheet px-3 py-3">
                  <div className="label">{day}</div>
                  <div className="mt-1 text-[20px] font-bold leading-6 tabular-nums">
                    {free[index]}
                    <span className="ml-0.5 text-[13px] font-normal text-ink3">/{PEOPLE.length}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-ink/10" role="presentation">
                    <div
                      className="h-full bg-railhi"
                      style={{ width: `${(free[index] / PEOPLE.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Sheet>
        </div>
      </div>
    </>
  )
}
