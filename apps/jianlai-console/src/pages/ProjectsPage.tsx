import { useCallback, useEffect, useMemo, useState } from 'react'
import { DISPATCHABLE } from '@/data/store'
import { adminAccounts, adminProjects, MODE_LABEL, type AdminAccountRow, type AdminProject } from '@/lib/account'
import { errorText } from '@/lib/api'
import { cn } from '@/lib/cn'
import { fmtMD, todayIso } from '@/lib/date'
import { yuan } from '@/lib/money'
import {
  downloadContractDocx,
  fetchContracts,
  fetchStaffLoad,
  openContractFile,
  signContract,
  voidContract,
  type Contract,
  type LoadItem,
} from '@/lib/contracts'
import { Avatar, Chip, Empty, MetricStrip, PageHead, SectionHead, Sheet, Stamp, Tabs } from '@/components/ui'
import { ContractForm, contractToInput, emptyContract } from '@/pages/ContractForm'
import { ProjectsAdmin } from '@/pages/ProjectsAdmin'
import { LeadsTab } from '@/pages/SalesPage'

type Tab = 'projects' | 'contracts' | 'load' | 'leads'

const STATUS_LABEL: Record<Contract['status'], string> = { draft: '拟定中', signed: '已签', void: '作废' }
const LOAD_LABEL: Record<LoadItem['state'], string> = { active: '在跟', upcoming: '待进场', planned: '拟派' }

function SignBox({ contract, onDone }: { contract: Contract; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [day, setDay] = useState(todayIso())
  const [state, setState] = useState({ busy: false, msg: '' })
  async function submit() {
    if (!file) return setState({ busy: false, msg: '先选签好的合同文件' })
    setState({ busy: true, msg: '' })
    try {
      await signContract(contract.id, file, day)
      onDone()
    } catch (err) {
      setState({ busy: false, msg: errorText(err) })
    }
  }
  return (
    <div className="space-y-2 rounded-sm border border-ink/20 bg-sheet2 px-3 py-3">
      <p className="text-[14px] font-semibold">{contract.status === 'signed' ? '重新上传留档' : '现场签完，上传留档'}</p>
      <p className="text-[12px] text-ink3">PDF、照片或 Word，15MB 以内。上传后合同转已签，剑修自动挂进项目。</p>
      <div className="flex flex-wrap items-end gap-2">
        <label>
          <span className="label">签约日</span>
          <input type="date" max={todayIso()} value={day} onChange={(e) => setDay(e.target.value)} className="field mt-1 w-40" />
        </label>
        <label className="min-w-0 flex-1">
          <span className="label">文件</span>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.docx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-[13px]"
          />
        </label>
        <button type="button" disabled={state.busy} onClick={() => void submit()} className="btn btn-primary">
          {state.busy ? '上传中' : '上传留档'}
        </button>
      </div>
      {state.msg ? <p className="text-[13px] text-cinnabar">{state.msg}</p> : null}
    </div>
  )
}

function ContractDetail({ contract, onEdit, onChanged }: { contract: Contract; onEdit: () => void; onChanged: () => void }) {
  const [state, setState] = useState({ busy: '', msg: '' })
  const [confirmVoid, setConfirmVoid] = useState(false)
  async function run(label: string, fn: () => Promise<unknown>, reload = false) {
    setState({ busy: label, msg: '' })
    try {
      await fn()
      setState({ busy: '', msg: '' })
      if (reload) onChanged()
    } catch (err) {
      setState({ busy: '', msg: errorText(err) })
    }
  }
  return (
    <div className="flex flex-col">
      <div className="hair-b flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h3 className="title-serif truncate text-[18px] leading-7">{contract.party_a}</h3>
          <p className="font-mono text-[12px] text-ink3">
            {contract.code} · {contract.project_name} · {MODE_LABEL[contract.mode]}
          </p>
        </div>
        {contract.status === 'signed' ? <Stamp>已签</Stamp> : <Chip tone={contract.status === 'void' ? 'plain' : 'ochre'}>{STATUS_LABEL[contract.status]}</Chip>}
      </div>
      <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 px-4 py-3 text-[14px]">
        <dt className="label pt-0.5">服务期</dt>
        <dd className="tabular-nums">
          {contract.start_on} 至 {contract.end_on}（{contract.months} 个月）
        </dd>
        <dt className="label pt-0.5">剑修</dt>
        <dd>{contract.staff.map((s) => `${s.alias ?? s.legal_name}（${s.role}）`).join('、')}</dd>
        <dt className="label pt-0.5">费用</dt>
        <dd className="tabular-nums">
          {yuan(contract.staff_fee)} × {contract.staff.length} 人 + 顾问费 {yuan(contract.consult_fee)}
          <div className="font-semibold">
            每月 {yuan(contract.monthly_total)}
            {contract.months > 1 ? ` · 合计 ${yuan(contract.total)}` : ''}
          </div>
        </dd>
        <dt className="label pt-0.5">支付</dt>
        <dd className="text-ink2">{contract.pay_terms ?? '默认：每月开始后 5 个工作日内付当月'}</dd>
        {contract.signed_on ? (
          <>
            <dt className="label pt-0.5">签约</dt>
            <dd>
              {contract.signed_on}
              {contract.has_file ? (
                <button type="button" className="ml-2 underline decoration-ink/30 underline-offset-2" onClick={() => void run('file', () => openContractFile(contract))}>
                  看留档 {contract.file_name}
                </button>
              ) : null}
            </dd>
          </>
        ) : null}
      </dl>
      <div className="hair-t space-y-3 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" disabled={state.busy === 'docx'} onClick={() => void run('docx', () => downloadContractDocx(contract))}>
            {state.busy === 'docx' ? '生成中' : '导出 Word'}
          </button>
          {contract.status === 'draft' ? (
            <button type="button" className="btn" onClick={onEdit}>
              改合同
            </button>
          ) : null}
          {contract.status !== 'void' ? (
            confirmVoid ? (
              <>
                <button type="button" className="btn btn-danger" onClick={() => void run('void', () => voidContract(contract.id), true)}>
                  确认作废
                </button>
                <button type="button" className="btn btn-quiet" onClick={() => setConfirmVoid(false)}>
                  再想想
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-quiet" onClick={() => setConfirmVoid(true)}>
                作废
              </button>
            )
          ) : null}
        </div>
        {contract.status !== 'void' ? <SignBox key={contract.id} contract={contract} onDone={onChanged} /> : null}
        {state.msg ? <p className="text-[13px] text-cinnabar">{state.msg}</p> : null}
      </div>
    </div>
  )
}

function ContractsTab({
  contracts,
  projects,
  load,
  reload,
}: {
  contracts: Contract[]
  projects: AdminProject[]
  load: Record<string, LoadItem[]>
  reload: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<'new' | string | null>(contracts.length === 0 ? 'new' : null)
  const selected = contracts.find((c) => c.id === selectedId) ?? contracts[0] ?? null
  const editingContract = editing && editing !== 'new' ? contracts.find((c) => c.id === editing) : null
  const defaultProject = projects.find((p) => p.mode === 'dispatch' && !contracts.some((c) => c.project_id === p.id)) ?? projects[0]
  const busyFor = (slug: string) => (load[slug] ?? []).map((item) => item.project)

  return (
    <div className="grid items-start gap-4 xl:[grid-template-columns:minmax(0,1fr)_480px]">
      <Sheet className="overflow-hidden">
        <SectionHead
          title="合同"
          hint="拟定 → 导出 Word → 现场签 → 上传留档"
          aside={
            <button type="button" className="btn" onClick={() => setEditing('new')}>
              拟新合同
            </button>
          }
        />
        {contracts.length === 0 ? (
          <Empty title="还没有合同" hint="右边先拟一份，导出 Word 带去现场签。" />
        ) : (
          <div className="overflow-auto">
            <table className="ops-table min-w-[680px]">
              <thead>
                <tr>
                  <th>甲方 / 项目</th>
                  <th>方式</th>
                  <th>服务期</th>
                  <th>剑修</th>
                  <th className="num">每月</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr
                    key={c.id}
                    data-row
                    tabIndex={0}
                    aria-selected={!editing && selected?.id === c.id}
                    onClick={() => {
                      setSelectedId(c.id)
                      setEditing(null)
                    }}
                  >
                    <td>
                      <div className="font-semibold">{c.party_a}</div>
                      <div className="font-mono text-[12px] text-ink3">{c.code}</div>
                    </td>
                    <td>{MODE_LABEL[c.mode]}</td>
                    <td className="tabular-nums text-ink2">
                      {fmtMD(c.start_on)} – {fmtMD(c.end_on)}
                    </td>
                    <td className="text-ink2">{c.staff.map((s) => s.alias ?? s.legal_name).join('、')}</td>
                    <td className="num font-semibold">{yuan(c.monthly_total)}</td>
                    <td>
                      <Chip tone={c.status === 'signed' ? 'jade' : c.status === 'draft' ? 'ochre' : 'plain'}>{STATUS_LABEL[c.status]}</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sheet>

      <Sheet className="xl:sticky xl:top-6">
        {editing ? (
          <>
            <SectionHead title={editingContract ? `改合同 · ${editingContract.code}` : '拟新合同 · 派遣制'} />
            <ContractForm
              key={editing}
              initial={editingContract ? contractToInput(editingContract) : emptyContract(defaultProject)}
              contractId={editingContract?.id ?? null}
              projects={projects}
              busyFor={busyFor}
              onCancel={() => setEditing(null)}
              onDone={(saved) => {
                setEditing(null)
                setSelectedId(saved.id)
                reload()
              }}
            />
          </>
        ) : selected ? (
          <ContractDetail key={selected.id} contract={selected} onEdit={() => setEditing(selected.id)} onChanged={reload} />
        ) : (
          <Empty title="点一份合同看详情" />
        )}
      </Sheet>
    </div>
  )
}

function LoadTab({ load, today }: { load: Record<string, LoadItem[]>; today: string }) {
  return (
    <Sheet className="overflow-hidden">
      <SectionHead title="剑修在跟哪些项目" hint="来自已签 / 拟定的合同和项目成员，签约留档后自动更新" />
      <div className="overflow-auto">
        <table className="ops-table min-w-[680px]">
          <thead>
            <tr>
              <th>剑修</th>
              <th>状态</th>
              <th>项目 · 岗位 · 到期</th>
            </tr>
          </thead>
          <tbody>
            {DISPATCHABLE.map((item) => {
              const rows = load[item.slug] ?? []
              const active = rows.filter((r) => r.state === 'active').length
              return (
                <tr key={item.slug}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar person={item} size={32} />
                      <div>
                        <div className="font-semibold">{item.alias}</div>
                        <div className="text-[12px] text-ink3">{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {rows.length === 0 ? (
                      <Chip>空闲</Chip>
                    ) : (
                      <Chip tone={active > 1 ? 'cinnabar' : active === 1 ? 'jade' : 'ochre'}>
                        {active > 1 ? `同时跟 ${active} 个` : active === 1 ? '在跟' : rows[0] ? LOAD_LABEL[rows[0].state] : ''}
                      </Chip>
                    )}
                  </td>
                  <td>
                    {rows.length === 0 ? (
                      <span className="text-ink3">—</span>
                    ) : (
                      <ul className="flex flex-col gap-1">
                        {rows.map((r) => (
                          <li key={`${r.project_id}-${r.state}`} className="flex flex-wrap items-center gap-2 text-[13px]">
                            <span className="font-semibold">{r.project}</span>
                            <span className="text-ink2">{r.role}</span>
                            <span className={cn('text-ink3', r.state !== 'active' && 'text-ochre')}>{LOAD_LABEL[r.state]}</span>
                            {r.end_on ? (
                              <span className="tabular-nums text-ink3">
                                {r.start_on && r.start_on > today ? `${fmtMD(r.start_on)} 进场 · ` : ''}到 {fmtMD(r.end_on)}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Sheet>
  )
}

export function ProjectsPage() {
  const [tab, setTab] = useState<Tab>('projects')
  const [accounts, setAccounts] = useState<AdminAccountRow[]>([])
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [load, setLoad] = useState<{ today: string; items: Record<string, LoadItem[]> }>({ today: todayIso(), items: {} })
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  const reload = useCallback(async () => {
    try {
      const [a, p, c, l] = await Promise.all([adminAccounts(), adminProjects(), fetchContracts(), fetchStaffLoad()])
      setAccounts(a.items)
      setProjects(p.items)
      setContracts(c.items)
      setLoad(l)
      setError('')
      setVersion((v) => v + 1)
    } catch (err) {
      setError(errorText(err))
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const metrics = useMemo(() => {
    const live = projects.filter((p) => p.stage !== '已完结').length
    const signed = contracts.filter((c) => c.status === 'signed' && c.end_on >= load.today)
    const monthly = signed.reduce((sum, c) => sum + c.monthly_total, 0)
    const drafts = contracts.filter((c) => c.status === 'draft').length
    const busy = DISPATCHABLE.filter((p) => (load.items[p.slug] ?? []).some((r) => r.state !== 'planned')).length
    return { live, monthly, drafts, busy, signed: signed.length }
  }, [projects, contracts, load])

  return (
    <>
      <PageHead
        title="项目管理"
        note="项目、合同、剑修分配"
        tabs={
          <Tabs<Tab>
            label="项目管理"
            value={tab}
            onChange={setTab}
            tabs={[
              { key: 'projects', label: '项目', count: projects.length },
              { key: 'contracts', label: '合同', count: contracts.length },
              { key: 'load', label: '剑修在跟' },
              { key: 'leads', label: '留资线索' },
            ]}
          />
        }
      />
      {error ? <p className="mb-3 text-[14px] text-cinnabar">{error}</p> : null}
      <div className="mb-4">
        <MetricStrip
          items={[
            { label: '进行中的项目', value: String(metrics.live) },
            { label: '在执行的合同', value: String(metrics.signed), sub: metrics.drafts ? `另有 ${metrics.drafts} 份在拟` : '没有在拟的' },
            { label: '已签合同 · 每月', value: yuan(metrics.monthly), sub: '剑修费 + 顾问费', tone: 'jade' },
            { label: '已派出的剑修', value: `${metrics.busy} / ${DISPATCHABLE.length}`, sub: `空闲 ${DISPATCHABLE.length - metrics.busy} 位` },
          ]}
        />
      </div>

      {tab === 'projects' ? <ProjectsAdmin key={version} accounts={accounts} onChanged={() => void reload()} /> : null}
      {tab === 'contracts' ? <ContractsTab contracts={contracts} projects={projects} load={load.items} reload={() => void reload()} /> : null}
      {tab === 'load' ? <LoadTab load={load.items} today={load.today} /> : null}
      {tab === 'leads' ? <LeadsTab /> : null}
    </>
  )
}
