import { FormEvent, useCallback, useEffect, useState } from 'react'
import {
  adminProjects,
  createProject,
  updateProject,
  STAGES,
  type AdminAccountRow,
  type AdminProject,
  type ProjectInput,
} from '@/lib/account'
import { errorText } from '@/lib/api'
import { Chip, Empty, SectionHead, Sheet } from '@/components/ui'
import { ProgressBar, stageTone } from '@/pages/MePage'
import { cn } from '@/lib/cn'

const ROLE_HINTS = ['主理', '驻场负责人', '开发', '设计', '跟场学习']

type Member = { account_id: string; role: string }

function emptyInput(): ProjectInput {
  return {
    name: '',
    industry: null,
    client_account_id: null,
    stage: '先看',
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
    industry: project.industry,
    client_account_id: project.client_account_id,
    stage: project.stage,
    progress: project.progress,
    progress_note: project.progress_note,
    started_on: project.started_on,
    ended_on: project.ended_on,
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
        <span className="label">驻场成员与角色</span>
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

export function ProjectsAdmin({ accounts }: { accounts: AdminAccountRow[] }) {
  const [items, setItems] = useState<AdminProject[]>([])
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<string | 'new' | null>(null)

  const load = useCallback(async () => {
    try {
      setItems((await adminProjects()).items)
      setError('')
    } catch (err) {
      setError(errorText(err))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const staff = accounts.filter((a) => a.kind === 'staff' && a.status === 'active')
  const clients = accounts.filter((a) => a.kind === 'client')
  const current = editing && editing !== 'new' ? items.find((p) => p.id === editing) : null

  return (
    <div className={cn('grid gap-4', editing && 'xl:grid-cols-[minmax(0,1fr)_480px]')}>
      <Sheet>
        <SectionHead
          title="项目"
          hint="进度、成员角色都算剑来认证，只有管理员改"
          aside={
            <button type="button" className="btn" onClick={() => setEditing('new')}>
              新建项目
            </button>
          }
        />
        {error ? <p className="px-4 py-2 text-[13px] text-cinnabar">{error}</p> : null}
        {items.length === 0 ? (
          <Empty title="还没有项目" hint="建一个项目，把驻场的人挂上去，他们的档案里就能看到。" />
        ) : (
          <ul>
            {items.map((p) => (
              <li key={p.id} className={cn('hair-b px-4 py-3 last:border-b-0', editing === p.id && 'bg-sel')}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button type="button" onClick={() => setEditing(p.id)} className="flex flex-wrap items-center gap-2 text-left">
                    <span className="font-semibold">{p.name}</span>
                    {p.industry ? <span className="text-[12px] text-ink3">{p.industry}</span> : null}
                    <Chip tone={stageTone(p.stage)}>{p.stage}</Chip>
                    {p.client_company ? <span className="text-[12px] text-ink3">· {p.client_company}</span> : null}
                  </button>
                  <ProgressBar value={p.progress} />
                </div>
                <div className="mt-1 text-[13px] text-ink2">
                  {p.members.length
                    ? p.members.map((m) => `${m.name}（${m.role}）`).join('、')
                    : '还没挂人'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Sheet>

      {editing ? (
        <Sheet className="self-start">
          <SectionHead title={current ? `编辑 · ${current.name}` : '新建项目'} />
          <ProjectForm
            key={editing}
            initial={current ? toInput(current) : emptyInput()}
            projectId={current ? current.id : null}
            staff={staff}
            clients={clients}
            onCancel={() => setEditing(null)}
            onDone={() => {
              setEditing(null)
              void load()
            }}
          />
        </Sheet>
      ) : null}
    </div>
  )
}
