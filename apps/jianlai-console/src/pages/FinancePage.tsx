import { useMemo, useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { diffDays, dueText, fmtMD, monthKey, monthLabel, shiftIso, todayIso } from '@/lib/date'
import { signedYuan, yuan } from '@/lib/money'
import { COMPANY } from '@/data/studio'
import { IN_CATS, OUT_CATS, useStore, type EntryKind } from '@/data/store'
import {
  Chip,
  Empty,
  MetricStrip,
  PageHead,
  SectionHead,
  Segmented,
  Sheet,
  Stamp,
  Tabs,
} from '@/components/ui'

type Range = 'this' | 'last' | 'all'

function useRange(range: Range) {
  const today = todayIso()
  const thisKey = monthKey(today)
  const lastKey = monthKey(shiftIso(`${thisKey}-01`, -1))
  const match = (date: string) =>
    range === 'all' ? true : monthKey(date) === (range === 'this' ? thisKey : lastKey)
  const label = range === 'all' ? '全部' : monthLabel(range === 'this' ? thisKey : lastKey)
  return { match, label }
}

function EntryForm({ onClose }: { onClose: () => void }) {
  const { addEntry } = useStore()
  const [kind, setKind] = useState<EntryKind>('out')
  const [date, setDate] = useState(todayIso())
  const [category, setCategory] = useState<string>(OUT_CATS[0])
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [counterparty, setCounterparty] = useState('')
  const [error, setError] = useState<string | null>(null)

  const cats: readonly string[] = kind === 'in' ? IN_CATS : OUT_CATS

  const changeKind = (next: EntryKind) => {
    setKind(next)
    setCategory((next === 'in' ? IN_CATS : OUT_CATS)[0])
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError('金额要填一个大于 0 的数。')
      return
    }
    if (!memo.trim()) {
      setError('摘要写一句，日后对账要靠它。')
      return
    }
    addEntry({
      date,
      kind,
      category,
      memo: memo.trim(),
      counterparty: counterparty.trim() || '—',
      amount: Math.round(value),
    })
    onClose()
  }

  return (
    <form onSubmit={submit} className="hair-b grid gap-3 bg-sheet2 px-4 py-3" noValidate>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented<EntryKind>
          label="收入还是支出"
          value={kind}
          onChange={changeKind}
          options={[
            { key: 'out', label: '支出' },
            { key: 'in', label: '收入' },
          ]}
        />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="类别">
          {cats.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className={cn(
                'h-8 rounded-sm border px-2.5 text-[13px] font-semibold transition-colors duration-150',
                category === item ? 'border-ink bg-ink text-paper' : 'border-ink/30 hover:bg-sel',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[9rem_9rem_minmax(0,1fr)_minmax(0,1fr)]">
        <label className="grid gap-1">
          <span className="label">日期</span>
          <input
            type="date"
            className="field"
            value={date}
            max={todayIso()}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <label className="grid gap-1">
          <span className="label">金额（元）</span>
          <input
            inputMode="numeric"
            className="field tabular-nums"
            placeholder="0"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value.replace(/[^\d.]/g, ''))
              setError(null)
            }}
          />
        </label>
        <label className="grid gap-1">
          <span className="label">摘要</span>
          <input
            className="field"
            placeholder="这笔是什么"
            value={memo}
            onChange={(event) => {
              setMemo(event.target.value)
              setError(null)
            }}
          />
        </label>
        <label className="grid gap-1">
          <span className="label">{kind === 'in' ? '付款方（只写行业）' : '收款方'}</span>
          <input
            className="field"
            placeholder="可以不填"
            value={counterparty}
            onChange={(event) => setCounterparty(event.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary">
          入账
        </button>
        <button type="button" className="btn btn-quiet" onClick={onClose}>
          取消
        </button>
        {error ? (
          <p role="alert" className="text-[13px] font-semibold text-cinnabar">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  )
}

function LedgerTab({ range }: { range: Range }) {
  const { ledger } = useStore()
  const { match, label } = useRange(range)
  const [adding, setAdding] = useState(false)

  const rows = useMemo(
    () => ledger.filter((entry) => match(entry.date)).sort((a, b) => b.date.localeCompare(a.date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ledger, range],
  )

  const spend = useMemo(() => {
    const map = new Map<string, number>()
    for (const entry of rows) {
      if (entry.kind === 'out') map.set(entry.category, (map.get(entry.category) ?? 0) + entry.amount)
    }
    const total = [...map.values()].reduce((sum, n) => sum + n, 0)
    return {
      total,
      items: [...map.entries()].sort((a, b) => b[1] - a[1]),
    }
  }, [rows])

  return (
    <div className="grid items-start gap-4 lg:[grid-template-columns:minmax(0,1fr)_340px]">
      <Sheet className="overflow-hidden">
        <SectionHead
          title="流水"
          demo
          hint={label}
          aside={
            <button
              type="button"
              className={cn('btn', adding ? '' : 'btn-primary')}
              aria-expanded={adding}
              onClick={() => setAdding((on) => !on)}
            >
              {adding ? <X aria-hidden className="h-4 w-4" /> : <Plus aria-hidden className="h-4 w-4" />}
              {adding ? '收起' : '记一笔'}
            </button>
          }
        />
        {adding ? <EntryForm onClose={() => setAdding(false)} /> : null}
        {rows.length === 0 ? (
          <Empty title="这个时段还没有流水" hint="记一笔，或者在「应收」里点已收，会自动记一笔收入。" />
        ) : (
          <div className="max-h-[520px] overflow-auto">
            <table className="ops-table min-w-[560px]">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>类别</th>
                  <th>摘要</th>
                  <th className="num">金额</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => (
                  <tr key={entry.id}>
                    <td className="text-ink2 tabular-nums">{fmtMD(entry.date)}</td>
                    <td>
                      <Chip>{entry.category}</Chip>
                    </td>
                    <td>
                      <div className="font-semibold">{entry.memo}</div>
                      <div className="text-[13px] text-ink3">{entry.counterparty}</div>
                    </td>
                    <td
                      className={cn(
                        'num whitespace-nowrap font-bold',
                        entry.kind === 'in' ? 'text-jade' : 'text-ink',
                      )}
                    >
                      {signedYuan(entry.kind === 'in' ? entry.amount : -entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sheet>

      <Sheet>
        <SectionHead title="钱花在哪" demo hint={label} />
        {spend.items.length === 0 ? (
          <Empty title="这个时段没有支出" />
        ) : (
          <ul className="flex flex-col gap-3 px-4 py-3">
            {spend.items.map(([category, amount]) => {
              const share = Math.round((amount / spend.total) * 100)
              return (
                <li key={category}>
                  <div className="flex items-baseline justify-between text-[14px]">
                    <span className="font-semibold">{category}</span>
                    <span className="tabular-nums">
                      {yuan(amount)}
                      <span className="ml-2 text-[12px] text-ink3">{share}%</span>
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-ink/10">
                    <div className="h-full bg-railhi" style={{ width: `${(amount / spend.items[0][1]) * 100}%` }} />
                  </div>
                </li>
              )
            })}
            <li className="hair-t flex justify-between pt-3 text-[14px] font-bold">
              <span>合计支出</span>
              <span className="tabular-nums">{yuan(spend.total)}</span>
            </li>
          </ul>
        )}
      </Sheet>
    </div>
  )
}

function ReceivableTab() {
  const { receivables, receive } = useStore()
  const today = todayIso()

  const rows = [...receivables].sort((a, b) => {
    if (Boolean(a.paidOn) !== Boolean(b.paidOn)) return a.paidOn ? 1 : -1
    return a.due.localeCompare(b.due)
  })
  const openSum = receivables.filter((r) => !r.paidOn).reduce((sum, r) => sum + r.amount, 0)

  return (
    <Sheet className="overflow-hidden">
      <SectionHead title="应收" demo hint="点“已收”会同时记一笔收入" />
      <div className="overflow-auto">
        <table className="ops-table min-w-[640px]">
          <thead>
            <tr>
              <th>对象</th>
              <th>事由</th>
              <th>应收日</th>
              <th className="num">金额</th>
              <th>状态</th>
              <th aria-label="操作" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const delta = diffDays(row.due, today)
              return (
                <tr key={row.id}>
                  <td className="font-semibold">{row.counterparty}</td>
                  <td className="text-ink2">{row.reason}</td>
                  <td className="text-ink2 tabular-nums">{fmtMD(row.due)}</td>
                  <td className="num font-bold">{yuan(row.amount)}</td>
                  <td>
                    {row.paidOn ? (
                      <span className="text-[13px] text-ink3">{fmtMD(row.paidOn)} 到账</span>
                    ) : (
                      <Chip tone={delta < 0 ? 'cinnabar' : delta === 0 ? 'ochre' : 'plain'}>
                        {dueText(row.due)}
                      </Chip>
                    )}
                  </td>
                  <td className="w-24 text-right">
                    {row.paidOn ? (
                      <Stamp>已收</Stamp>
                    ) : (
                      <button type="button" className="btn" onClick={() => receive(row.id)}>
                        已收
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="label border-t border-ink/55 px-3 py-2.5">
                未收合计
              </td>
              <td className="num border-t border-ink/55 px-3 py-2.5 font-bold">{yuan(openSum)}</td>
              <td colSpan={2} className="border-t border-ink/55" />
            </tr>
          </tfoot>
        </table>
      </div>
    </Sheet>
  )
}

function CompanyTab() {
  const rows: [string, string][] = [
    ['企业名称', COMPANY.name],
    ['统一社会信用代码', COMPANY.creditCode],
    ['类型', COMPANY.kind],
    ['法定代表人', COMPANY.legalPerson],
    ['注册资本', `${COMPANY.capital} · ${COMPANY.capitalNote}`],
    ['成立日期', COMPANY.founded],
    ['营业期限', COMPANY.term],
    ['公司治理', COMPANY.board],
    ['登记机关', COMPANY.authority],
    ['住所', COMPANY.address],
  ]
  return (
    <div className="grid items-start gap-4 lg:[grid-template-columns:minmax(0,1fr)_340px]">
      <Sheet>
        <SectionHead title="公司主体" hint="来自国家企业信用信息公示系统，2026-09-25" />
        <dl>
          {rows.map(([key, value]) => (
            <div
              key={key}
              className="grid grid-cols-1 gap-0.5 border-b border-ink/10 px-4 py-2.5 last:border-b-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-3"
            >
              <dt className="label pt-0.5">{key}</dt>
              <dd className="text-[14px]">{value}</dd>
            </div>
          ))}
        </dl>
      </Sheet>
      <Sheet>
        <SectionHead title="到点要办" />
        <ul className="flex flex-col gap-3 px-4 py-3 text-[14px]">
          <li>
            <Chip tone="ochre">每年</Chip>
            <p className="mt-1.5 font-semibold">企业年度报告</p>
            <p className="text-ink3">每年 1 月 1 日至 6 月 30 日，在公示系统报送上一年度年报。</p>
          </li>
          <li>
            <Chip tone="ochre">2031-09-01</Chip>
            <p className="mt-1.5 font-semibold">认缴出资期限</p>
            <p className="text-ink3">章程写明 10 万元认缴，公示页实缴一栏目前是空的。</p>
          </li>
        </ul>
      </Sheet>
    </div>
  )
}

export function FinancePage() {
  const { ledger, receivables } = useStore()
  const [tab, setTab] = useState<'ledger' | 'receivable' | 'company'>('ledger')
  const [range, setRange] = useState<Range>('all')
  const { match } = useRange(range)
  const today = todayIso()

  const inRows = ledger.filter((e) => e.kind === 'in' && match(e.date))
  const outRows = ledger.filter((e) => e.kind === 'out' && match(e.date))
  const income = inRows.reduce((sum, e) => sum + e.amount, 0)
  const spend = outRows.reduce((sum, e) => sum + e.amount, 0)
  const net = income - spend

  const open = receivables.filter((r) => !r.paidOn)
  const overdue = open.filter((r) => diffDays(r.due, today) < 0)

  return (
    <>
      <PageHead
        title="财务"
        note="流水、应收、公司主体"
        demo
        actions={
          tab === 'ledger' ? (
            <Segmented<Range>
              label="看哪个时段"
              value={range}
              onChange={setRange}
              options={[
                { key: 'all', label: '全部' },
                { key: 'this', label: '本月' },
                { key: 'last', label: '上月' },
              ]}
            />
          ) : null
        }
        tabs={
          <Tabs
            label="财务"
            value={tab}
            onChange={setTab}
            tabs={[
              { key: 'ledger', label: '流水', count: ledger.length },
              { key: 'receivable', label: '应收', count: open.length },
              { key: 'company', label: '公司' },
            ]}
          />
        }
      />

      <div className="mb-4">
        <MetricStrip
          items={[
            { label: '收入', value: yuan(income), tone: income > 0 ? 'jade' : 'ink', sub: `${inRows.length} 笔` },
            { label: '支出', value: yuan(spend), sub: `${outRows.length} 笔` },
            {
              label: '净额',
              value: signedYuan(net),
              tone: net > 0 ? 'jade' : net < 0 ? 'cinnabar' : 'ink',
              sub: net < 0 ? '这个时段亏着' : net > 0 ? '这个时段盈着' : '持平',
            },
            { label: '应收未收', value: yuan(open.reduce((s, r) => s + r.amount, 0)), sub: `${open.length} 笔` },
            {
              label: '已逾期',
              value: yuan(overdue.reduce((s, r) => s + r.amount, 0)),
              tone: overdue.length > 0 ? 'cinnabar' : 'ink',
              sub: overdue.length > 0 ? `${overdue.length} 笔，该催了` : '没有',
            },
            { label: '注册资本', value: '10 万', sub: '认缴，实缴未填' },
          ]}
        />
      </div>

      {tab === 'ledger' ? <LedgerTab range={range} /> : null}
      {tab === 'receivable' ? <ReceivableTab /> : null}
      {tab === 'company' ? <CompanyTab /> : null}
    </>
  )
}
