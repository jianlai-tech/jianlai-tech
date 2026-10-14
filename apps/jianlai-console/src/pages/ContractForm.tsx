import { FormEvent, useState } from 'react'
import { DISPATCHABLE } from '@/data/store'
import { person } from '@/data/studio'
import type { AdminProject } from '@/lib/account'
import { errorText } from '@/lib/api'
import { cn } from '@/lib/cn'
import { todayIso } from '@/lib/date'
import { yuan } from '@/lib/money'
import {
  DEFAULT_PAY_TERMS,
  createContract,
  updateContract,
  type Contract,
  type ContractInput,
} from '@/lib/contracts'
import { Avatar } from '@/components/ui'

const ROLES = ['驻场负责人', '驻场开发', '驻场设计', '跟场学习']

export function emptyContract(project: AdminProject | undefined): ContractInput {
  return {
    project_id: project?.id ?? '',
    mode: 'dispatch',
    party_a: project?.client_name || project?.name || '',
    party_a_rep: null,
    party_a_contact: null,
    party_a_address: null,
    start_on: todayIso(),
    months: 1,
    staff_fee: 3000,
    consult_fee: 7000,
    work_place: '甲方办公场所',
    pay_terms: DEFAULT_PAY_TERMS,
    extra_terms: null,
    staff: [],
  }
}

export function contractToInput(c: Contract): ContractInput {
  return {
    project_id: c.project_id,
    mode: c.mode,
    party_a: c.party_a,
    party_a_rep: c.party_a_rep,
    party_a_contact: c.party_a_contact,
    party_a_address: c.party_a_address,
    start_on: c.start_on,
    months: c.months,
    staff_fee: c.staff_fee,
    consult_fee: c.consult_fee,
    work_place: c.work_place,
    pay_terms: c.pay_terms,
    extra_terms: c.extra_terms,
    staff: c.staff.map((s) => ({ slug: s.slug, alias: s.alias, role: s.role })),
  }
}

export function ContractForm({
  initial,
  contractId,
  projects,
  busyFor,
  onDone,
  onCancel,
}: {
  initial: ContractInput
  contractId: string | null
  projects: AdminProject[]
  /** 每位剑修手上已挂的项目名，派人时提醒 */
  busyFor: (slug: string) => string[]
  onDone: (saved: Contract) => void
  onCancel: () => void
}) {
  const [input, setInput] = useState(initial)
  const [state, setState] = useState({ busy: false, msg: '' })
  const set = <K extends keyof ContractInput>(key: K, value: ContractInput[K]) => setInput((v) => ({ ...v, [key]: value }))

  const headcount = input.staff.length
  const monthly = input.staff_fee * headcount + input.consult_fee
  const total = monthly * input.months

  function toggle(slug: string) {
    const on = input.staff.some((s) => s.slug === slug)
    set(
      'staff',
      on
        ? input.staff.filter((s) => s.slug !== slug)
        : [...input.staff, { slug, alias: person(slug)?.alias ?? null, role: '驻场开发' }],
    )
  }

  function onProject(id: string) {
    const project = projects.find((p) => p.id === id)
    setInput((v) => ({
      ...v,
      project_id: id,
      party_a: v.party_a && v.party_a !== projects.find((p) => p.id === v.project_id)?.name ? v.party_a : project?.client_name || project?.name || '',
    }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!input.project_id) return setState({ busy: false, msg: '先选项目' })
    if (headcount === 0) return setState({ busy: false, msg: '至少派一位剑修' })
    setState({ busy: true, msg: '' })
    try {
      onDone(contractId ? await updateContract(contractId, input) : await createContract(input))
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
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="label">合作方式</span>
          <div className="mt-1 flex gap-1.5">
            <button type="button" aria-pressed className="btn btn-primary flex-1">
              派遣制 · 按人月
            </button>
            <button type="button" disabled title="项目制合同条款还没定，下一步补" className="btn flex-1">
              项目制（待补）
            </button>
          </div>
        </div>
        <label className="block sm:col-span-2">
          <span className="label">甲方全称（营业执照上的名字）</span>
          <input required maxLength={80} value={input.party_a} onChange={(e) => set('party_a', e.target.value)} className="field mt-1 w-full" />
        </label>
        <label className="block">
          <span className="label">甲方代表人</span>
          <input maxLength={20} value={input.party_a_rep ?? ''} onChange={(e) => set('party_a_rep', e.target.value || null)} className="field mt-1 w-full" placeholder="不填，Word 里留空线" />
        </label>
        <label className="block">
          <span className="label">甲方联系人及电话</span>
          <input maxLength={60} value={input.party_a_contact ?? ''} onChange={(e) => set('party_a_contact', e.target.value || null)} className="field mt-1 w-full" />
        </label>
        <label className="block sm:col-span-2">
          <span className="label">甲方地址</span>
          <input maxLength={120} value={input.party_a_address ?? ''} onChange={(e) => set('party_a_address', e.target.value || null)} className="field mt-1 w-full" />
        </label>
        <label className="block">
          <span className="label">开始日</span>
          <input required type="date" value={input.start_on} onChange={(e) => set('start_on', e.target.value)} className="field mt-1 w-full" />
        </label>
        <label className="block">
          <span className="label">服务月数</span>
          <input required type="number" min={1} max={36} value={input.months} onChange={(e) => set('months', Math.max(1, Number(e.target.value) || 1))} className="field mt-1 w-full" />
        </label>
        <label className="block">
          <span className="label">每位剑修 / 月（元）</span>
          <input required type="number" min={0} step={100} value={input.staff_fee} onChange={(e) => set('staff_fee', Number(e.target.value) || 0)} className="field mt-1 w-full" />
        </label>
        <label className="block">
          <span className="label">道长顾问费 / 月（元）</span>
          <input required type="number" min={0} step={100} value={input.consult_fee} onChange={(e) => set('consult_fee', Number(e.target.value) || 0)} className="field mt-1 w-full" />
        </label>
        <label className="block sm:col-span-2">
          <span className="label">服务地点</span>
          <input maxLength={120} value={input.work_place ?? ''} onChange={(e) => set('work_place', e.target.value || null)} className="field mt-1 w-full" />
        </label>
      </div>

      <div>
        <span className="label">派哪几位剑修（{headcount} 位）</span>
        <ul className="mt-1 divide-y divide-ink/10 rounded-sm border border-ink/15">
          {DISPATCHABLE.map((item) => {
            const pick = input.staff.find((s) => s.slug === item.slug)
            const busy = busyFor(item.slug).filter((name) => name !== projects.find((p) => p.id === input.project_id)?.name)
            return (
              <li key={item.slug} className="flex flex-wrap items-center gap-3 px-3 py-2">
                <label className="flex min-w-[9rem] cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={Boolean(pick)} onChange={() => toggle(item.slug)} />
                  <Avatar person={item} size={26} />
                  <span className={cn('font-semibold', !pick && 'text-ink3')}>{item.alias}</span>
                  <span className="text-[12px] text-ink3">{item.name}</span>
                </label>
                {busy.length ? <span className="text-[12px] text-ochre">在跟 {busy.join('、')}</span> : <span className="text-[12px] text-ink3">空闲</span>}
                {pick ? (
                  <select
                    value={pick.role}
                    onChange={(e) => set('staff', input.staff.map((s) => (s.slug === item.slug ? { ...s, role: e.target.value } : s)))}
                    className="field ml-auto w-32"
                    aria-label={`${item.alias}的岗位`}
                  >
                    {ROLES.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="rounded-sm border border-ink/20 bg-sheet2 px-3 py-2.5 text-[14px] leading-6">
        剑修 {yuan(input.staff_fee)} × {headcount} 人 + 顾问费 {yuan(input.consult_fee)} ={' '}
        <strong className="tabular-nums">每月 {yuan(monthly)}</strong>
        {input.months > 1 ? (
          <>
            ，{input.months} 个月合计 <strong className="tabular-nums">{yuan(total)}</strong>
          </>
        ) : null}
      </div>

      <label className="block">
        <span className="label">支付方式</span>
        <textarea rows={2} maxLength={300} value={input.pay_terms ?? ''} onChange={(e) => set('pay_terms', e.target.value || null)} className="field mt-1 h-auto w-full resize-none py-1.5" />
      </label>
      <label className="block">
        <span className="label">补充约定（写进第十三条）</span>
        <textarea rows={2} maxLength={1000} value={input.extra_terms ?? ''} onChange={(e) => set('extra_terms', e.target.value || null)} className="field mt-1 h-auto w-full resize-none py-1.5" />
      </label>

      {state.msg ? <p className="text-[13px] text-cinnabar">{state.msg}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={state.busy} className="btn btn-primary">
          {state.busy ? '保存中' : contractId ? '保存' : '拟定合同'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-quiet">
          取消
        </button>
      </div>
    </form>
  )
}
