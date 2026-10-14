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
import { ContractForm, contractFromQuote, contractToInput, emptyContract } from '@/pages/ContractForm'
import { ProjectsAdmin } from '@/pages/ProjectsAdmin'
import { emptyQuote, QuoteForm, quoteToInput } from '@/pages/QuoteForm'
import { downloadQuoteDocx, fetchQuotes, QUOTE_STATUS_LABEL, setQuoteStatus, type Quote, type QuoteStatus } from '@/lib/pipeline'
import type { ContractInput } from '@/lib/contracts'
import type { QuoteInput } from '@/lib/pipeline'
import { LeadsTab } from '@/pages/SalesPage'

type Tab = 'projects' | 'quotes' | 'contracts' | 'load' | 'leads'

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
          {contract.start_on} 至 {contract.end_on}
          {contract.mode === 'dispatch' ? `（${contract.months} 个月）` : ''}
        </dd>
        <dt className="label pt-0.5">剑修</dt>
        <dd>{contract.staff.length ? contract.staff.map((s) => `${s.alias ?? s.legal_name}（${s.role}）`).join('、') : '—'}</dd>
        <dt className="label pt-0.5">费用</dt>
        {contract.mode === 'project' ? (
          <dd className="tabular-nums font-semibold">固定总价 {yuan(contract.total)}</dd>
        ) : (
          <dd className="tabular-nums">
            {yuan(contract.staff_fee)} × {contract.staff.length} 人 + 顾问费 {yuan(contract.consult_fee)}
            <div className="font-semibold">
              每月 {yuan(contract.monthly_total)}
              {contract.months > 1 ? ` · 合计 ${yuan(contract.total)}` : ''}
            </div>
          </dd>
        )}
        <dt className="label pt-0.5">支付</dt>
        <dd className="text-ink2">
          {contract.mode === 'project' && contract.quote_id ? '按报价的付款节点' : (contract.pay_terms ?? '默认：每月开始后 5 个工作日内付当月')}
        </dd>
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
  quotes,
  load,
  reload,
  selectedId,
  setSelectedId,
  draft,
  setDraft,
}: {
  contracts: Contract[]
  projects: AdminProject[]
  quotes: Quote[]
  load: Record<string, LoadItem[]>
  reload: () => void
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  /** 新拟：带好的初始值；改：合同 id */
  draft: ContractInput | string | null
  setDraft: (d: ContractInput | string | null) => void
}) {
  const editing = draft
  const setEditing = (v: 'new' | string | null) => {
    if (v === 'new') {
      const p = projects.find((x) => x.mode === 'dispatch' && !contracts.some((c) => c.project_id === x.id)) ?? projects[0]
      setDraft(emptyContract(p))
    } else setDraft(v)
  }
  const selected = contracts.find((c) => c.id === selectedId) ?? contracts[0] ?? null
  const editingContract = typeof editing === 'string' ? contracts.find((c) => c.id === editing) : null
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
                  <th className="num">金额</th>
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
                    <td className="num font-semibold">{c.mode === 'project' ? yuan(c.total) : `${yuan(c.monthly_total)} / 月`}</td>
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
            <SectionHead title={editingContract ? `改合同 · ${editingContract.code}` : '拟新合同'} />
            <ContractForm
              key={typeof editing === 'string' ? editing : `new-${editing.quote_id ?? editing.project_id}`}
              initial={editingContract ? contractToInput(editingContract) : (editing as ContractInput)}
              contractId={editingContract?.id ?? null}
              projects={projects}
              quotes={quotes}
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

function QuoteDetail({ quote, onEdit, onContract, onChanged }: { quote: Quote; onEdit: () => void; onContract: () => void; onChanged: () => void }) {
  const [state, setState] = useState({ busy: '', msg: '' })
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
  const status = (s: QuoteStatus) => run(s, () => setQuoteStatus(quote.id, s), true)
  return (
    <div className="flex flex-col">
      <div className="hair-b flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h3 className="title-serif truncate text-[18px] leading-7">{quote.title}</h3>
          <p className="font-mono text-[12px] text-ink3">
            {quote.code} · {quote.party_a}
          </p>
        </div>
        <Chip tone={quote.status === 'accepted' ? 'jade' : quote.status === 'rejected' ? 'plain' : 'ochre'}>{QUOTE_STATUS_LABEL[quote.status]}</Chip>
      </div>
      <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 px-4 py-3 text-[14px]">
        <dt className="label pt-0.5">总价</dt>
        <dd className="tabular-nums">
          <span className="font-semibold">{yuan(quote.total)}</span>
          <span className="ml-2 text-[12px] text-ink3">
            开发 {yuan(quote.dev_total)}
            {quote.ai_fee ? ` + AI 包干 ${yuan(quote.ai_fee)}` : ''}
          </span>
        </dd>
        <dt className="label pt-0.5">工期</dt>
        <dd>
          {quote.weeks} 周 · {quote.days_total} 人天{quote.onsite_per_week ? ` · 每周驻场 ${quote.onsite_per_week} 次` : ''}
        </dd>
        <dt className="label pt-0.5">模块</dt>
        <dd className="text-ink2">{quote.items.map((i) => i.name).join('、')}</dd>
        <dt className="label pt-0.5">付款</dt>
        <dd className="text-ink2">{quote.pay_plan.map((p) => `${p.name} ${p.pct}%`).join(' / ') || '—'}</dd>
      </dl>
      <div className="hair-t space-y-3 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" disabled={state.busy === 'docx'} onClick={() => void run('docx', () => downloadQuoteDocx(quote))}>
            {state.busy === 'docx' ? '生成中' : '下载估算书 Word'}
          </button>
          {quote.status !== 'accepted' ? (
            <button type="button" className="btn" onClick={onEdit}>
              改报价
            </button>
          ) : null}
          <button type="button" className="btn" onClick={onContract}>
            拟合同
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="label">客户反馈</span>
          {quote.status === 'draft' ? (
            <button type="button" className="btn btn-quiet h-7 px-2" onClick={() => void status('sent')}>
              标记已发客户
            </button>
          ) : null}
          {quote.status !== 'accepted' ? (
            <button type="button" className="btn btn-quiet h-7 px-2" onClick={() => void status('accepted')}>
              客户认了
            </button>
          ) : null}
          {quote.status !== 'rejected' && quote.status !== 'accepted' ? (
            <button type="button" className="btn btn-quiet h-7 px-2" onClick={() => void status('rejected')}>
              没谈成
            </button>
          ) : null}
        </div>
        {state.msg ? <p className="text-[13px] text-cinnabar">{state.msg}</p> : null}
      </div>
    </div>
  )
}

function QuotesTab({
  quotes,
  projects,
  selectedId,
  setSelectedId,
  draft,
  setDraft,
  onContract,
  reload,
}: {
  quotes: Quote[]
  projects: AdminProject[]
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  draft: QuoteInput | string | null
  setDraft: (d: QuoteInput | string | null) => void
  onContract: (q: Quote) => void
  reload: () => void
}) {
  const selected = quotes.find((q) => q.id === selectedId) ?? quotes[0] ?? null
  const editingQuote = typeof draft === 'string' ? quotes.find((q) => q.id === draft) : null
  return (
    <div className="grid items-start gap-4 xl:[grid-template-columns:minmax(0,1fr)_560px]">
      <Sheet className="overflow-hidden">
        <SectionHead
          title="报价"
          hint="项目制：按模块列人天和价格 → 下载估算书发客户 → 客户认了拟合同"
          aside={
            <button type="button" className="btn" onClick={() => setDraft(emptyQuote(projects.find((p) => p.mode !== 'dispatch') ?? projects[0]))}>
              出报价
            </button>
          }
        />
        {quotes.length === 0 ? (
          <Empty title="还没有报价" hint="右边出一份，或者在项目流程里点「出报价」。" />
        ) : (
          <div className="overflow-auto">
            <table className="ops-table min-w-[620px]">
              <thead>
                <tr>
                  <th>报价 / 客户</th>
                  <th>项目</th>
                  <th>工期</th>
                  <th className="num">总价</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.id}
                    data-row
                    tabIndex={0}
                    aria-selected={!draft && selected?.id === q.id}
                    onClick={() => {
                      setSelectedId(q.id)
                      setDraft(null)
                    }}
                  >
                    <td>
                      <div className="font-semibold">{q.title}</div>
                      <div className="font-mono text-[12px] text-ink3">
                        {q.code} · {q.party_a}
                      </div>
                    </td>
                    <td className="text-ink2">{q.project_name}</td>
                    <td className="tabular-nums text-ink2">{q.weeks} 周</td>
                    <td className="num font-semibold">{yuan(q.total)}</td>
                    <td>
                      <Chip tone={q.status === 'accepted' ? 'jade' : q.status === 'rejected' ? 'plain' : 'ochre'}>{QUOTE_STATUS_LABEL[q.status]}</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sheet>
      <Sheet className="xl:sticky xl:top-6">
        {draft ? (
          <>
            <SectionHead title={editingQuote ? `改报价 · ${editingQuote.code}` : '出报价 · 项目制'} />
            <QuoteForm
              key={typeof draft === 'string' ? draft : `new-${draft.project_id}`}
              initial={editingQuote ? quoteToInput(editingQuote) : (draft as QuoteInput)}
              quoteId={editingQuote?.id ?? null}
              projects={projects}
              onCancel={() => setDraft(null)}
              onDone={(saved) => {
                setDraft(null)
                setSelectedId(saved.id)
                reload()
              }}
            />
          </>
        ) : selected ? (
          <QuoteDetail key={selected.id} quote={selected} onEdit={() => setDraft(selected.id)} onContract={() => onContract(selected)} onChanged={reload} />
        ) : (
          <Empty title="点一份报价看详情" />
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
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  const [quoteId, setQuoteId] = useState<string | null>(null)
  const [quoteDraft, setQuoteDraft] = useState<QuoteInput | string | null>(null)
  const [contractId, setContractId] = useState<string | null>(null)
  const [contractDraft, setContractDraft] = useState<ContractInput | string | null>(null)
  const [load, setLoad] = useState<{ today: string; items: Record<string, LoadItem[]> }>({ today: todayIso(), items: {} })
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      const [a, p, c, l, q] = await Promise.all([adminAccounts(), adminProjects(), fetchContracts(), fetchStaffLoad(), fetchQuotes()])
      setAccounts(a.items)
      setProjects(p.items)
      setContracts(c.items)
      setQuotes(q.items)
      setLoad(l)
      setError('')
    } catch (err) {
      setError(errorText(err))
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const metrics = useMemo(() => {
    const live = projects.filter((p) => p.stage !== '已完结' && p.stage !== '需求' && p.stage !== '报价').length
    const pending = quotes.filter((q) => q.status === 'draft' || q.status === 'sent').length
    const signed = contracts.filter((c) => c.status === 'signed' && c.end_on >= load.today)
    const monthly = signed.reduce((sum, c) => sum + c.monthly_total, 0)
    const drafts = contracts.filter((c) => c.status === 'draft').length
    const busy = DISPATCHABLE.filter((p) => (load.items[p.slug] ?? []).some((r) => r.state !== 'planned')).length
    return { live, monthly, drafts, busy, signed: signed.length, pending }
  }, [projects, contracts, load, quotes])

  return (
    <>
      <PageHead
        title="项目管理"
        note="需求 → 报价 → 合同 → 分期执行 → 维护"
        tabs={
          <Tabs<Tab>
            label="项目管理"
            value={tab}
            onChange={setTab}
            tabs={[
              { key: 'projects', label: '项目', count: projects.length },
              { key: 'quotes', label: '报价', count: quotes.length },
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
            { label: '已签在做的项目', value: String(metrics.live), sub: metrics.pending ? `${metrics.pending} 份报价在谈` : '没有在谈的报价' },
            { label: '在执行的合同', value: String(metrics.signed), sub: metrics.drafts ? `另有 ${metrics.drafts} 份在拟` : '没有在拟的' },
            { label: '已签合同 · 每月', value: yuan(metrics.monthly), sub: '剑修费 + 顾问费', tone: 'jade' },
            { label: '已派出的剑修', value: `${metrics.busy} / ${DISPATCHABLE.length}`, sub: `空闲 ${DISPATCHABLE.length - metrics.busy} 位` },
          ]}
        />
      </div>

      {tab === 'projects' ? (
        <ProjectsAdmin
          accounts={accounts}
          items={projects}
          quotes={quotes}
          contracts={contracts}
          selectedId={projectId}
          onSelect={setProjectId}
          onChanged={() => void reload()}
          onNewQuote={(p) => {
            setQuoteDraft(emptyQuote(p))
            setTab('quotes')
          }}
          onEditQuote={(q) => {
            setQuoteId(q.id)
            setQuoteDraft(null)
            setTab('quotes')
          }}
          onNewContract={(p, q) => {
            setContractDraft(q ? contractFromQuote(q, p) : emptyContract(p))
            setTab('contracts')
          }}
          onOpenContract={(c) => {
            setContractId(c.id)
            setContractDraft(null)
            setTab('contracts')
          }}
        />
      ) : null}
      {tab === 'quotes' ? (
        <QuotesTab
          quotes={quotes}
          projects={projects}
          selectedId={quoteId}
          setSelectedId={setQuoteId}
          draft={quoteDraft}
          setDraft={setQuoteDraft}
          onContract={(q) => {
            setContractDraft(contractFromQuote(q, projects.find((p) => p.id === q.project_id)))
            setTab('contracts')
          }}
          reload={() => void reload()}
        />
      ) : null}
      {tab === 'contracts' ? (
        <ContractsTab
          contracts={contracts}
          projects={projects}
          quotes={quotes}
          load={load.items}
          reload={() => void reload()}
          selectedId={contractId}
          setSelectedId={setContractId}
          draft={contractDraft}
          setDraft={setContractDraft}
        />
      ) : null}
      {tab === 'load' ? <LoadTab load={load.items} today={load.today} /> : null}
      {tab === 'leads' ? <LeadsTab /> : null}
    </>
  )
}
