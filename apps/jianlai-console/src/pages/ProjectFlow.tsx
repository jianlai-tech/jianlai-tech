import { useCallback, useEffect, useState } from 'react'
import { MODE_LABEL, type AdminProject, type CoopMode } from '@/lib/account'
import { errorText } from '@/lib/api'
import { cn } from '@/lib/cn'
import { todayIso } from '@/lib/date'
import { yuan } from '@/lib/money'
import type { Contract } from '@/lib/contracts'
import {
  createModule,
  deleteDoc,
  downloadDoc,
  downloadQuoteDocx,
  fetchDocs,
  fetchPhases,
  PHASE_HINT,
  PHASE_STATUS_LABEL,
  QUOTE_STATUS_LABEL,
  savePhase,
  uploadDoc,
  type Phase,
  type PhaseStatus,
  type ProjectDoc,
  type Quote,
} from '@/lib/pipeline'
import { Chip, Segmented } from '@/components/ui'

/** 一个项目从需求到维护的五步。每步只放「现在该干什么」和入口，细节在合同 / 报价页签里 */
const FLOW = ['需求', '报价', '签约', '执行', '维护'] as const

function flowIndex(stage: AdminProject['stage']) {
  if (stage === '需求') return 0
  if (stage === '报价') return 1
  if (stage === '签约') return 2
  if (stage === '前期' || stage === '中期' || stage === '后期') return 3
  return 4
}

function kb(size: number) {
  return size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`
}

function Step({ n, title, done, current, children }: { n: number; title: string; done: boolean; current: boolean; children: React.ReactNode }) {
  return (
    <section className={cn('hair-b px-4 py-3 last:border-b-0', current && 'bg-sel')}>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-sm text-[12px] font-bold tabular-nums',
            done ? 'bg-rail text-paper' : current ? 'border border-ink text-ink' : 'border border-ink/30 text-ink3',
          )}
        >
          {done ? '✓' : n}
        </span>
        <h3 className={cn('text-[14px] font-semibold', !done && !current && 'text-ink3')}>{title}</h3>
      </div>
      <div className="pl-7">{children}</div>
    </section>
  )
}

function DocsStep({ projectId }: { projectId: string }) {
  const [docs, setDocs] = useState<ProjectDoc[]>([])
  const [state, setState] = useState({ busy: false, msg: '' })
  const load = useCallback(async () => {
    try {
      setDocs((await fetchDocs(projectId)).items)
    } catch (err) {
      setState({ busy: false, msg: errorText(err) })
    }
  }, [projectId])
  useEffect(() => {
    void load()
  }, [load])

  async function onFile(file: File | undefined) {
    if (!file) return
    setState({ busy: true, msg: '' })
    try {
      await uploadDoc(projectId, file, null)
      setState({ busy: false, msg: '' })
      void load()
    } catch (err) {
      setState({ busy: false, msg: errorText(err) })
    }
  }

  return (
    <div className="space-y-2">
      {docs.length ? (
        <ul className="space-y-1 text-[13px]">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-2">
              <button type="button" className="min-w-0 truncate text-left underline decoration-ink/30 underline-offset-2" onClick={() => void downloadDoc(d)}>
                {d.file_name}
              </button>
              <span className="shrink-0 text-[12px] text-ink3">
                {kb(d.file_size)} · {d.uploaded_at.slice(5, 10)}
              </span>
              <button
                type="button"
                className="ml-auto shrink-0 text-[12px] text-ink3 hover:text-cinnabar"
                onClick={() => void deleteDoc(d.id).then(load)}
              >
                删
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-ink3">客户发来的需求文档、纪要、原型截图都传这里。</p>
      )}
      <label className={cn('btn h-7 cursor-pointer px-2.5 text-[13px]', state.busy && 'opacity-50')}>
        {state.busy ? '上传中' : '上传需求文档'}
        <input
          type="file"
          className="hidden"
          disabled={state.busy}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.pptx,.png,.jpg,.jpeg,.webp,.heic,.txt,.md"
          onChange={(e) => {
            void onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </label>
      {state.msg ? <p className="text-[12px] text-cinnabar">{state.msg}</p> : null}
    </div>
  )
}

function PhaseRow({ projectId, phase, onSaved }: { projectId: string; phase: Phase; onSaved: () => void }) {
  const [p, setP] = useState(phase)
  const [open, setOpen] = useState(false)
  const [state, setState] = useState({ busy: false, msg: '' })
  const set = <K extends keyof Phase>(key: K, value: Phase[K]) => setP((v) => ({ ...v, [key]: value }))

  async function save(next: Phase) {
    setState({ busy: true, msg: '' })
    try {
      await savePhase(projectId, next)
      setState({ busy: false, msg: '' })
      setOpen(false)
      onSaved()
    } catch (err) {
      setState({ busy: false, msg: errorText(err) })
    }
  }

  return (
    <li className="rounded-sm border border-ink/15">
      <div className="flex flex-wrap items-center gap-2 px-2.5 py-2">
        <span className="w-9 font-semibold">{p.phase}</span>
        <Segmented<PhaseStatus>
          label={`${p.phase}状态`}
          value={p.status}
          options={(['todo', 'doing', 'done'] as PhaseStatus[]).map((k) => ({ key: k, label: PHASE_STATUS_LABEL[k] }))}
          onChange={(status) => {
            const next = { ...p, status, start_on: p.start_on ?? (status !== 'todo' ? todayIso() : null) }
            setP(next)
            void save(next)
          }}
        />
        <span className="text-[12px] tabular-nums text-ink3">
          {p.start_on || p.end_on ? `${p.start_on?.slice(5) ?? '—'} ~ ${p.end_on?.slice(5) ?? '—'}` : ''}
          {p.pay_amount ? ` · 收款 ${yuan(p.pay_amount)}${p.paid_on ? ' 已到' : ''}` : ''}
        </span>
        <button type="button" className="ml-auto text-[12px] text-ink3 underline decoration-ink/30 underline-offset-2" onClick={() => setOpen((v) => !v)}>
          {open ? '收起' : '排期'}
        </button>
      </div>
      {p.goal && !open ? <p className="px-2.5 pb-2 text-[13px] text-ink2">{p.goal}</p> : null}
      {open ? (
        <div className="hair-t space-y-2 px-2.5 py-2">
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="label">开始</span>
              <input type="date" value={p.start_on ?? ''} onChange={(e) => set('start_on', e.target.value || null)} className="field mt-1 w-full" />
            </label>
            <label>
              <span className="label">结束</span>
              <input type="date" value={p.end_on ?? ''} onChange={(e) => set('end_on', e.target.value || null)} className="field mt-1 w-full" />
            </label>
            <label>
              <span className="label">这期收款（元）</span>
              <input type="number" min={0} value={p.pay_amount ?? ''} onChange={(e) => set('pay_amount', e.target.value === '' ? null : Number(e.target.value))} className="field mt-1 w-full" />
            </label>
            <label>
              <span className="label">到账日</span>
              <input type="date" value={p.paid_on ?? ''} onChange={(e) => set('paid_on', e.target.value || null)} className="field mt-1 w-full" />
            </label>
          </div>
          <label className="block">
            <span className="label">目标 / 交付</span>
            <input maxLength={300} placeholder={PHASE_HINT[p.phase]} value={p.goal ?? ''} onChange={(e) => set('goal', e.target.value || null)} className="field mt-1 w-full" />
          </label>
          <button type="button" disabled={state.busy} className="btn btn-primary h-7 px-2.5 text-[13px]" onClick={() => void save(p)}>
            {state.busy ? '保存中' : '保存'}
          </button>
        </div>
      ) : null}
      {state.msg ? <p className="px-2.5 pb-2 text-[12px] text-cinnabar">{state.msg}</p> : null}
    </li>
  )
}

function PhasesStep({ projectId, onChanged }: { projectId: string; onChanged: () => void }) {
  const [phases, setPhases] = useState<Phase[]>([])
  const [version, setVersion] = useState(0)
  const load = useCallback(async () => {
    setPhases((await fetchPhases(projectId)).items)
    setVersion((v) => v + 1)
  }, [projectId])
  useEffect(() => {
    void load()
  }, [load])
  return (
    <ul className="space-y-1.5">
      {phases
        .filter((p) => p.phase !== '维护')
        .map((p) => (
          <PhaseRow
            key={`${p.phase}-${version}`}
            projectId={projectId}
            phase={p}
            onSaved={() => {
              void load()
              onChanged()
            }}
          />
        ))}
    </ul>
  )
}

function MaintainStep({
  project,
  modules,
  onChanged,
  onOpen,
}: {
  project: AdminProject
  modules: AdminProject[]
  onChanged: () => void
  onOpen: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [mode, setMode] = useState<CoopMode>('project')
  const [state, setState] = useState({ busy: false, msg: '' })
  const [phases, setPhases] = useState<Phase[]>([])
  const load = useCallback(async () => setPhases((await fetchPhases(project.id)).items), [project.id])
  useEffect(() => {
    void load()
  }, [load])
  const maintain = phases.find((p) => p.phase === '维护')

  async function add() {
    if (!name.trim()) return setState({ busy: false, msg: '写个模块名，比如「小程序」' })
    setState({ busy: true, msg: '' })
    try {
      const { id } = await createModule(project.id, name.trim(), mode)
      setName('')
      setState({ busy: false, msg: '' })
      onChanged()
      onOpen(id)
    } catch (err) {
      setState({ busy: false, msg: errorText(err) })
    }
  }

  return (
    <div className="space-y-3">
      {maintain ? <PhaseRow key={`${maintain.status}-${maintain.goal}`} projectId={project.id} phase={maintain} onSaved={() => { void load(); onChanged() }} /> : null}
      <p className="text-[13px] text-ink3">维护只修 bug 和小需求。小程序、App、新业务模块另开一个模块，单独走需求 → 报价 → 签约，归在同一家公司下面。</p>
      {modules.length ? (
        <ul className="space-y-1 text-[13px]">
          {modules.map((m) => (
            <li key={m.id}>
              <button type="button" className="flex items-center gap-2 underline decoration-ink/30 underline-offset-2" onClick={() => onOpen(m.id)}>
                {m.name}
              </button>
              <span className="ml-2 text-[12px] text-ink3">
                {m.mode ? MODE_LABEL[m.mode] : ''} · {m.stage}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <input maxLength={60} placeholder="新模块名，如：小程序" value={name} onChange={(e) => setName(e.target.value)} className="field min-w-0 flex-1" />
        <select value={mode} onChange={(e) => setMode(e.target.value as CoopMode)} className="field w-28" aria-label="合作方式">
          <option value="project">项目制</option>
          <option value="dispatch">派遣制</option>
        </select>
        <button type="button" disabled={state.busy} className="btn h-8" onClick={() => void add()}>
          {state.busy ? '新建中' : '新增模块'}
        </button>
      </div>
      {state.msg ? <p className="text-[12px] text-cinnabar">{state.msg}</p> : null}
    </div>
  )
}

export function ProjectFlow({
  project,
  parent,
  modules,
  quotes,
  contracts,
  onEditInfo,
  onNewQuote,
  onEditQuote,
  onNewContract,
  onOpenContract,
  onOpenProject,
  onChanged,
}: {
  project: AdminProject
  parent: AdminProject | null
  modules: AdminProject[]
  quotes: Quote[]
  contracts: Contract[]
  onEditInfo: () => void
  onNewQuote: () => void
  onEditQuote: (q: Quote) => void
  onNewContract: (q: Quote | null) => void
  onOpenContract: (c: Contract) => void
  onOpenProject: (id: string) => void
  onChanged: () => void
}) {
  const at = flowIndex(project.stage)
  const myQuotes = quotes.filter((q) => q.project_id === project.id)
  const myContracts = contracts.filter((c) => c.project_id === project.id && c.status !== 'void')
  const accepted = myQuotes.find((q) => q.status === 'accepted') ?? myQuotes.find((q) => q.status === 'sent') ?? myQuotes[0] ?? null
  const signed = myContracts.find((c) => c.status === 'signed')

  return (
    <div className="flex flex-col">
      <div className="hair-b px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {parent ? (
              <button type="button" className="text-[12px] text-ink3 underline decoration-ink/30 underline-offset-2" onClick={() => onOpenProject(parent.id)}>
                {parent.name} ·
              </button>
            ) : null}
            <h3 className="title-serif truncate text-[18px] leading-7">{project.name}</h3>
            <p className="text-[12px] text-ink3">
              {project.client_name ?? '客户全称未填'}
              {project.mode ? ` · ${MODE_LABEL[project.mode]}` : ''}
            </p>
          </div>
          <button type="button" className="btn h-7 shrink-0 px-2.5 text-[13px]" onClick={onEditInfo}>
            改资料
          </button>
        </div>
        <ol className="mt-3 grid grid-cols-5 gap-px overflow-hidden rounded-sm border border-ink/15 bg-ink/10 text-center text-[12px]">
          {FLOW.map((name, i) => (
            <li
              key={name}
              className={cn(
                'px-1 py-1.5',
                i < at && 'bg-sheet2 text-ink2',
                i === at && project.stage !== '已完结' && 'bg-rail font-semibold text-paper',
                (i > at || project.stage === '已完结') && i >= at && 'bg-sheet text-ink3',
              )}
            >
              {name === '执行' && at === 3 ? project.stage : name}
            </li>
          ))}
        </ol>
      </div>

      <Step n={1} title="需求" done={at > 0} current={at === 0}>
        <DocsStep projectId={project.id} />
      </Step>

      <Step n={2} title="报价" done={at > 1} current={at === 1}>
        <div className="space-y-2">
          {myQuotes.length ? (
            <ul className="space-y-1.5 text-[13px]">
              {myQuotes.map((q) => (
                <li key={q.id} className="flex flex-wrap items-center gap-2">
                  <button type="button" className="font-mono text-[12px] underline decoration-ink/30 underline-offset-2" onClick={() => onEditQuote(q)}>
                    {q.code}
                  </button>
                  <span className="font-semibold tabular-nums">{yuan(q.total)}</span>
                  <span className="text-ink3">{q.weeks} 周</span>
                  <Chip tone={q.status === 'accepted' ? 'jade' : q.status === 'rejected' ? 'plain' : 'ochre'}>{QUOTE_STATUS_LABEL[q.status]}</Chip>
                  <button type="button" className="ml-auto text-[12px] underline decoration-ink/30 underline-offset-2" onClick={() => void downloadQuoteDocx(q)}>
                    下载估算书
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-ink3">{project.mode === 'dispatch' ? '派遣制按人月，可以跳过报价直接拟合同。' : '按模块列人天和价格，导出 Word 发给客户。'}</p>
          )}
          <button type="button" className="btn h-7 px-2.5 text-[13px]" onClick={onNewQuote}>
            出报价
          </button>
        </div>
      </Step>

      <Step n={3} title="签约" done={Boolean(signed)} current={at === 2}>
        <div className="space-y-2">
          {myContracts.length ? (
            <ul className="space-y-1 text-[13px]">
              {myContracts.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-2">
                  <button type="button" className="font-mono text-[12px] underline decoration-ink/30 underline-offset-2" onClick={() => onOpenContract(c)}>
                    {c.code}
                  </button>
                  <span className="tabular-nums">{c.mode === 'project' ? yuan(c.total) : `${yuan(c.monthly_total)} / 月`}</span>
                  <Chip tone={c.status === 'signed' ? 'jade' : 'ochre'}>{c.status === 'signed' ? '已签' : '拟定中'}</Chip>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-ink3">拟合同 → 导出 Word → 现场签 → 上传留档，项目自动进入前期。</p>
          )}
          <button type="button" className="btn h-7 px-2.5 text-[13px]" onClick={() => onNewContract(project.mode === 'dispatch' ? null : accepted)}>
            {project.mode === 'dispatch' || !accepted ? '拟合同' : `从 ${accepted.code} 拟合同`}
          </button>
        </div>
      </Step>

      <Step n={4} title="执行 · 前期 / 中期 / 后期" done={at > 3} current={at === 3}>
        <PhasesStep projectId={project.id} onChanged={onChanged} />
      </Step>

      {!parent ? (
        <Step n={5} title="维护 · 新增模块" done={project.stage === '已完结'} current={at === 4 && project.stage !== '已完结'}>
          <MaintainStep project={project} modules={modules} onChanged={onChanged} onOpen={onOpenProject} />
        </Step>
      ) : null}
    </div>
  )
}
