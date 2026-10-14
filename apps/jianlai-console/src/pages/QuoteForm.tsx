import { FormEvent, useState } from 'react'
import type { AdminProject } from '@/lib/account'
import { errorText } from '@/lib/api'
import { yuan } from '@/lib/money'
import {
  createQuote,
  DEFAULT_PAY_PLAN,
  updateQuote,
  type PayStep,
  type Quote,
  type QuoteInput,
  type QuoteItem,
  type ScheduleStep,
} from '@/lib/pipeline'

export function emptyQuote(project: AdminProject | undefined): QuoteInput {
  return {
    project_id: project?.id ?? '',
    title: project ? `${project.name}（一期）` : '',
    party_a: project?.client_name || project?.name || '',
    weeks: 6,
    items: [{ name: '', content: '', days: 0, amount: 0 }],
    ai_fee: 0,
    pay_plan: DEFAULT_PAY_PLAN,
    schedule: [],
    onsite_per_week: 2,
    maintain_low: 1500,
    maintain_high: 3000,
    out_of_scope: null,
    assumptions: null,
    valid_days: 30,
  }
}

export function quoteToInput(q: Quote): QuoteInput {
  const { project_id, title, party_a, weeks, items, ai_fee, pay_plan, schedule, onsite_per_week } = q
  return {
    project_id,
    title,
    party_a,
    weeks,
    items,
    ai_fee,
    pay_plan,
    schedule,
    onsite_per_week,
    maintain_low: q.maintain_low,
    maintain_high: q.maintain_high,
    out_of_scope: q.out_of_scope,
    assumptions: q.assumptions,
    valid_days: q.valid_days,
  }
}

function Rows<T>({
  label,
  rows,
  blank,
  onChange,
  render,
  head,
}: {
  label: string
  rows: T[]
  blank: T
  onChange: (rows: T[]) => void
  render: (row: T, set: (patch: Partial<T>) => void) => React.ReactNode
  head: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <button type="button" className="btn btn-quiet h-7 px-2 text-[13px]" onClick={() => onChange([...rows, blank])}>
          + 加一行
        </button>
      </div>
      <div className="mt-1 overflow-hidden rounded-sm border border-ink/15">
        <div className="hair-b grid items-center gap-2 bg-sheet2 px-2 py-1.5">{head}</div>
        {rows.map((row, i) => (
          <div key={i} className="hair-b flex items-start gap-2 px-2 py-1.5 last:border-b-0">
            <div className="min-w-0 flex-1">
              {render(row, (patch) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r))))}
            </div>
            <button
              type="button"
              aria-label="删掉这一行"
              className="btn btn-quiet h-8 w-8 shrink-0 px-0 text-ink3"
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function QuoteForm({
  initial,
  quoteId,
  projects,
  onDone,
  onCancel,
}: {
  initial: QuoteInput
  quoteId: string | null
  projects: AdminProject[]
  onDone: (saved: Quote) => void
  onCancel: () => void
}) {
  const [input, setInput] = useState(initial)
  const [state, setState] = useState({ busy: false, msg: '' })
  const set = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => setInput((v) => ({ ...v, [key]: value }))

  const dev = input.items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const days = input.items.reduce((s, i) => s + (Number(i.days) || 0), 0)
  const total = dev + (Number(input.ai_fee) || 0)
  const pctSum = input.pay_plan.reduce((s, p) => s + (Number(p.pct) || 0), 0)

  function onProject(id: string) {
    const project = projects.find((p) => p.id === id)
    setInput((v) => ({
      ...v,
      project_id: id,
      party_a: project?.client_name || project?.name || v.party_a,
      title: v.title || (project ? `${project.name}（一期）` : ''),
    }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!input.project_id) return setState({ busy: false, msg: '先选项目' })
    if (input.items.some((i) => !i.name.trim())) return setState({ busy: false, msg: '每个模块都要写名字' })
    if (input.pay_plan.length && Math.abs(pctSum - 100) > 0.01) return setState({ busy: false, msg: `付款比例加起来是 ${pctSum}%，要等于 100%` })
    setState({ busy: true, msg: '' })
    try {
      onDone(quoteId ? await updateQuote(quoteId, input) : await createQuote(input))
    } catch (err) {
      setState({ busy: false, msg: errorText(err) })
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">项目</span>
          <select required value={input.project_id} onChange={(e) => onProject(e.target.value)} className="field mt-1 w-full">
            <option value="">选项目</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.parent_id ? '　└ ' : ''}
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">报价标题</span>
          <input required maxLength={80} value={input.title} onChange={(e) => set('title', e.target.value)} className="field mt-1 w-full" />
        </label>
        <label className="block sm:col-span-2">
          <span className="label">致（客户全称）</span>
          <input required maxLength={80} value={input.party_a} onChange={(e) => set('party_a', e.target.value)} className="field mt-1 w-full" />
        </label>
        <label className="block">
          <span className="label">工期（周）</span>
          <input type="number" min={1} max={104} value={input.weeks} onChange={(e) => set('weeks', Math.max(1, Number(e.target.value) || 1))} className="field mt-1 w-full" />
        </label>
        <label className="block">
          <span className="label">每周驻场沟通（次）</span>
          <input type="number" min={0} max={7} value={input.onsite_per_week} onChange={(e) => set('onsite_per_week', Math.max(0, Number(e.target.value) || 0))} className="field mt-1 w-full" />
        </label>
      </div>

      <Rows<QuoteItem>
        label={`模块报价（${input.items.length} 项 · ${days} 人天）`}
        rows={input.items}
        blank={{ name: '', content: '', days: 0, amount: 0 }}
        onChange={(rows) => set('items', rows)}
        head={
          <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_6rem] gap-2 pr-10 text-[12px] font-semibold text-ink3">
            <span>模块 / 内容</span>
            <span>人天</span>
            <span>报价（元）</span>
          </div>
        }
        render={(row, patch) => (
          <div className="space-y-1">
            <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_6rem] gap-2">
              <input maxLength={40} placeholder="模块名" value={row.name} onChange={(e) => patch({ name: e.target.value })} className="field w-full" />
              <input type="number" min={0} step={0.5} value={row.days} onChange={(e) => patch({ days: Number(e.target.value) || 0 })} className="field w-full" aria-label="人天" />
              <input type="number" min={0} step={500} value={row.amount} onChange={(e) => patch({ amount: Number(e.target.value) || 0 })} className="field w-full" aria-label="报价" />
            </div>
            <input maxLength={400} placeholder="内容（写进估算书和合同附件的功能清单）" value={row.content} onChange={(e) => patch({ content: e.target.value })} className="field w-full text-[13px]" />
          </div>
        )}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="label">开发期 AI 费用（包干）</span>
          <input type="number" min={0} step={500} value={input.ai_fee} onChange={(e) => set('ai_fee', Number(e.target.value) || 0)} className="field mt-1 w-full" />
        </label>
        <label className="block">
          <span className="label">运维下限 / 月</span>
          <input type="number" min={0} step={100} value={input.maintain_low} onChange={(e) => set('maintain_low', Number(e.target.value) || 0)} className="field mt-1 w-full" />
        </label>
        <label className="block">
          <span className="label">运维上限 / 月</span>
          <input type="number" min={0} step={100} value={input.maintain_high} onChange={(e) => set('maintain_high', Number(e.target.value) || 0)} className="field mt-1 w-full" />
        </label>
      </div>

      <div className="rounded-sm border border-ink/20 bg-sheet2 px-3 py-2.5 text-[14px] leading-6">
        开发 {yuan(dev)} + AI 包干 {yuan(Number(input.ai_fee) || 0)} = <strong className="tabular-nums">总价 {yuan(total)}</strong>
        <span className="ml-2 text-[12px] text-ink3">含税、固定总价</span>
      </div>

      <Rows<PayStep>
        label={`付款节点（合计 ${pctSum}%）`}
        rows={input.pay_plan}
        blank={{ name: '', pct: 0, condition: '' }}
        onChange={(rows) => set('pay_plan', rows)}
        head={
          <div className="grid grid-cols-[5.5rem_4rem_minmax(0,1fr)] gap-2 pr-10 text-[12px] font-semibold text-ink3">
            <span>期次</span>
            <span>比例 %</span>
            <span>支付条件</span>
          </div>
        }
        render={(row, patch) => (
          <div className="grid grid-cols-[5.5rem_4rem_minmax(0,1fr)] gap-2">
            <input maxLength={20} value={row.name} onChange={(e) => patch({ name: e.target.value })} className="field w-full" aria-label="期次" />
            <input type="number" min={0} max={100} value={row.pct} onChange={(e) => patch({ pct: Number(e.target.value) || 0 })} className="field w-full" aria-label="比例" />
            <input maxLength={200} value={row.condition} onChange={(e) => patch({ condition: e.target.value })} className="field w-full" aria-label="支付条件" />
          </div>
        )}
      />

      <Rows<ScheduleStep>
        label="工期里程碑"
        rows={input.schedule}
        blank={{ when: '', what: '', client: '' }}
        onChange={(rows) => set('schedule', rows)}
        head={
          <div className="grid grid-cols-[5.5rem_minmax(0,1.4fr)_minmax(0,1fr)] gap-2 pr-10 text-[12px] font-semibold text-ink3">
            <span>时间</span>
            <span>里程碑</span>
            <span>甲方配合</span>
          </div>
        }
        render={(row, patch) => (
          <div className="grid grid-cols-[5.5rem_minmax(0,1.4fr)_minmax(0,1fr)] gap-2">
            <input maxLength={20} placeholder="第 1 周" value={row.when} onChange={(e) => patch({ when: e.target.value })} className="field w-full" />
            <input maxLength={200} value={row.what} onChange={(e) => patch({ what: e.target.value })} className="field w-full" aria-label="里程碑" />
            <input maxLength={120} value={row.client} onChange={(e) => patch({ client: e.target.value })} className="field w-full" aria-label="甲方配合" />
          </div>
        )}
      />

      <label className="block">
        <span className="label">明确不在本期</span>
        <textarea rows={2} maxLength={1000} value={input.out_of_scope ?? ''} onChange={(e) => set('out_of_scope', e.target.value || null)} className="field mt-1 h-auto w-full resize-none py-1.5" />
      </label>
      <label className="block">
        <span className="label">本项目的报价前提（一行一条，接在通用前提后面）</span>
        <textarea rows={3} maxLength={2000} value={input.assumptions ?? ''} onChange={(e) => set('assumptions', e.target.value || null)} className="field mt-1 h-auto w-full resize-none py-1.5" />
      </label>

      {state.msg ? <p className="text-[13px] text-cinnabar">{state.msg}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={state.busy} className="btn btn-primary">
          {state.busy ? '保存中' : quoteId ? '保存' : '出报价'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-quiet">
          取消
        </button>
      </div>
    </form>
  )
}
