import { FormEvent, Fragment, useState } from 'react'
import {
  createProject,
  updateProject,
  MODE_LABEL,
  STAGES,
  type AdminAccountRow,
  type AdminProject,
  type ProjectInput,
} from '@/lib/account'
import { errorText } from '@/lib/api'
import { Chip, Empty, SectionHead, Sheet } from '@/components/ui'
import { stageTone } from '@/pages/MePage'
import { ProjectFlow } from '@/pages/ProjectFlow'
import type { Contract } from '@/lib/contracts'
import type { Quote } from '@/lib/pipeline'
import { cn } from '@/lib/cn'

const ROLE_HINTS = ['主理', '驻场负责人', '开发', '设计', '跟场学习']

type Member = { account_id: string; role: string }

function emptyInput(): ProjectInput {
  return {
    name: '',
    client_name: null,
    mode: null,
    industry: null,
    client_account_id: null,
    stage: '需求',
    progress: 0,
    progress_note: null,
    started_on: null,
    ended_on: null,
    members: [],
  }
}

function toInput(project: AdminProject): ProjectInput {
  return {
    name: project.name,
    client_name: project.client_name,
    mode: project.mode,
    industry: project.industry,
    client_account_id: project.client_account_id,
    stage: project.stage,
    progress: project.progress,
    progress_note: project.progress_note,
    started_on: project.started_on,
    ended_on: project.ended_on,
    parent_id: project.parent_id,
    members: project.members.map((m) => ({ account_id: m.account_id, role: m.role })),
  }
}

function ProjectForm({
  initial,
  projectId,
  staff,
  clients,
  onDone,
  onCancel,
}: {
  initial: ProjectInput
  projectId: string | null
  staff: AdminAccountRow[]
  clients: AdminAccountRow[]
  onDone: () => void
  onCancel: () => void
}) {
  const [input, setInput] = useState<ProjectInput>(initial)
  const [state, setState] = useState({ busy: false, msg: '' })
  const set = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => setInput({ ...input, [key]: value })

  function toggleMember(accountId: string) {
    const exists = input.members.some((m) => m.account_id === accountId)
    set(
      'members',
      exists ? input.members.filter((m) => m.account_id !== accountId) : [...input.members, { account_id: accountId, role: '开发' }],
    )
  }

  function setRole(accountId: string, role: string) {
    set(
      'members',
      input.members.map((m: Member) => (m.account_id === accountId ? { ...m, role } : m)),
    )
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (input.members.some((m) => !m.role.trim())) {
      setState({ busy: false, msg: '每个成员都要写角色' })
      return
    }
    setState({ busy: true, msg: '' })
    try {
      if (projectId) await updateProject(projectId, input)
      else await createProject(input)
      onDone()
    } catch (err) {
      setState({ busy: false, msg: errorText(err) })
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">项目名</span>
          <input required maxLength={60} value={input.name} onChange={(e) => set('name', e.target.value)} className="field mt-1 w-full" />
        </label>
        <label className="block">
          <span className="label">客户全称（写进合同甲方）</span>
          <input maxLength={80} value={input.client_name ?? ''} onChange={(e) => set('client_name', e.target.value || null)} className="field mt-1 w-full" />
        </label>
        <label className="block">
          <span className="label">合作方式</span>
          <select value={input.mode ?? ''} onChange={(e) => set('mode', (e.target.value || null) as ProjectInput['mode'])} className="field mt-1 w-full">
            <option value="">还没定</option>
            <option value="dispatch">派遣制（按人月）</option>
            <option value="project">项目制</option>
          </select>
        </label>
        <label className="block">
          <span className="label">行业（对外只写行业）</span>
          <input maxLength={30} value={input.industry ?? ''} onChange={(e) => set('industry', e.target.value || null)} className="field mt-1 w-full" />
        </label>
        <label className="block">
          <span className="label">合作企业账号</span>
          <select
            value={input.client_account_id ?? ''}
            onChange={(e) => set('client_account_id', e.target.value || null)}
            className="field mt-1 w-full"
          >
            <option value="">不挂企业账号</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company}
                {c.status !== 'active' ? '（未开通）' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">阶段</span>
          <select value={input.stage} onChange={(e) => set('stage', e.target.value as ProjectInput['stage'])} className="field mt-1 w-full">
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">进度 {input.progress}%</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={input.progress}
            onChange={(e) => set('progress', Number(e.target.value))}
            className="mt-2 w-full accent-[#2B372C]"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">开始</span>
            <input type="date" value={input.started_on ?? ''} onChange={(e) => set('started_on', e.target.value || null)} className="field mt-1 w-full" />
          </label>
          <label className="block">
            <span className="label">结束</span>
            <input type="date" value={input.ended_on ?? ''} onChange={(e) => set('ended_on', e.target.value || null)} className="field mt-1 w-full" />
          </label>
        </div>
      </div>
      <label className="block">
        <span className="label">进度说明（企业账号能看到）</span>
        <textarea
          rows={2}
          maxLength={300}
          value={input.progress_note ?? ''}
          onChange={(e) => set('progress_note', e.target.value || null)}
          className="field mt-1 w-full resize-none"
        />
      </label>

      <div>
        <span className="label">驻场成员与角色（签约留档后会自动挂上）</span>
        <ul className="mt-1 divide-y divide-ink/10 rounded-sm border border-ink/15">
          {staff.map((person) => {
            const member = input.members.find((m) => m.account_id === person.id)
            return (
              <li key={person.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
                <label className="flex min-w-[8rem] items-center gap-2">
                  <input type="checkbox" checked={Boolean(member)} onChange={() => toggleMember(person.id)} />
                  <span className={cn(!member && 'text-ink3')}>{person.alias || person.name}</span>
                </label>
                {member ? (
                  <input
                    list="role-hints"
                    maxLength={20}
                    value={member.role}
                    onChange={(e) => setRole(person.id, e.target.value)}
                    className="field w-36"
                    aria-label={`${person.name}的角色`}
                  />
                ) : null}
              </li>
            )
          })}
        </ul>
        <datalist id="role-hints">
          {ROLE_HINTS.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
      </div>

      {state.msg ? <p className="text-[13px] text-cinnabar">{state.msg}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={state.busy} className="btn btn-primary">
          {state.busy ? '保存中' : projectId ? '保存' : '建项目'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-quiet">
          取消
        </button>
      </div>
    </form>
  )
}

export function ProjectsAdmin({
  accounts,
  items,
  quotes,
  contracts,
  selectedId,
  onSelect,
  onChanged,
  onNewQuote,
  onEditQuote,
  onNewContract,
  onOpenContract,
}: {
  accounts: AdminAccountRow[]
  items: AdminProject[]
  quotes: Quote[]
  contracts: Contract[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChanged: () => void
  onNewQuote: (project: AdminProject) => void
  onEditQuote: (q: Quote) => void
  onNewContract: (project: AdminProject, q: Quote | null) => void
  onOpenContract: (c: Contract) => void
}) {
  const [editing, setEditing] = useState<string | 'new' | null>(null)

  const staff = accounts.filter((a) => a.kind === 'staff' && a.status === 'active')
  const clients = accounts.filter((a) => a.kind === 'client')
  const roots = items.filter((p) => !p.parent_id)
  const childrenOf = (id: string) => items.filter((p) => p.parent_id === id)
  const selected = items.find((p) => p.id === selectedId) ?? null
  const current = editing && editing !== 'new' ? items.find((p) => p.id === editing) : null

  function Row({ p, child }: { p: AdminProject; child?: boolean }) {
    return (
      <li className={cn('hair-b last:border-b-0', selected?.id === p.id && !editing && 'bg-sel')}>
        <button
          type="button"
          onClick={() => {
            onSelect(p.id)
            setEditing(null)
          }}
          className={cn('block w-full px-4 py-2.5 text-left', child && 'pl-9')}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex flex-wrap items-center gap-2">
              {child ? <span className="text-ink3">└</span> : null}
              <span className="font-semibold">{p.name}</span>
              <Chip tone={stageTone(p.stage)}>{p.stage}</Chip>
              {p.mode ? <Chip>{MODE_LABEL[p.mode]}</Chip> : null}
              {!child && p.client_name && p.client_name !== p.name ? <span className="text-[12px] text-ink3">{p.client_name}</span> : null}
            </span>
            <span className="flex items-center gap-3 text-[12px] tabular-nums text-ink3">
              <span title="需求文档">需求 {p.doc_count}</span>
              <span title="报价">报价 {p.quote_count}</span>
              <span title="合同">合同 {p.contract_count}</span>
            </span>
          </div>
          <div className="mt-0.5 text-[13px] text-ink2">
            {p.members.length ? p.members.map((m) => `${m.name}（${m.role}）`).join('、') : <span className="text-ink3">还没挂人</span>}
          </div>
        </button>
      </li>
    )
  }

  return (
    <div className="grid items-start gap-4 xl:[grid-template-columns:minmax(0,1fr)_480px]">
      <Sheet className="overflow-hidden">
        <SectionHead
          title="项目"
          hint="需求 → 报价 → 签约 → 前中后期 → 维护；维护期新功能开成子模块"
          aside={
            <button type="button" className="btn" onClick={() => setEditing('new')}>
              新建项目
            </button>
          }
        />
        {roots.length === 0 ? (
          <Empty title="还没有项目" hint="客户来了先建项目，上传需求文档，再出报价。" />
        ) : (
          <ul>
            {roots.map((p) => (
              <Fragment key={p.id}>
                <Row p={p} />
                {childrenOf(p.id).map((c) => (
                  <Row key={c.id} p={c} child />
                ))}
              </Fragment>
            ))}
          </ul>
        )}
      </Sheet>

      <Sheet className="xl:sticky xl:top-6">
        {editing ? (
          <>
            <SectionHead title={current ? `改资料 · ${current.name}` : '新建项目'} />
            <ProjectForm
              key={editing}
              initial={current ? toInput(current) : emptyInput()}
              projectId={current ? current.id : null}
              staff={staff}
              clients={clients}
              onCancel={() => setEditing(null)}
              onDone={() => {
                setEditing(null)
                onChanged()
              }}
            />
          </>
        ) : selected ? (
          <ProjectFlow
            key={selected.id}
            project={selected}
            parent={selected.parent_id ? (items.find((p) => p.id === selected.parent_id) ?? null) : null}
            modules={childrenOf(selected.id)}
            quotes={quotes}
            contracts={contracts}
            onEditInfo={() => setEditing(selected.id)}
            onNewQuote={() => onNewQuote(selected)}
            onEditQuote={onEditQuote}
            onNewContract={(q) => onNewContract(selected, q)}
            onOpenContract={onOpenContract}
            onOpenProject={(id) => onSelect(id)}
            onChanged={onChanged}
          />
        ) : (
          <Empty title="点一个项目看流程" hint="需求文档、报价、合同、分期都在这里。" />
        )}
      </Sheet>
    </div>
  )
}
