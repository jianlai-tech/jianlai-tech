import { FormEvent, useCallback, useEffect, useState } from 'react'
import { DIMS, GATES, REALMS, TIER_NAME, type DimKey, type Tier } from '@/data/studio'
import {
  adminAccounts,
  createClient,
  createStaff,
  resetPassword,
  saveCert,
  setAccountStatus,
  type AdminAccountRow,
  type Cert,
  type DimLevels,
} from '@/lib/account'
import { errorText } from '@/lib/api'
import { Chip, Empty, PageHead, SectionHead, Sheet, Tabs } from '@/components/ui'
import { ProjectsAdmin } from '@/pages/ProjectsAdmin'
import { realmLabel } from '@/pages/MePage'
import { cn } from '@/lib/cn'

type Tab = 'staff' | 'client' | 'projects'

const maskPhone = (phone: string) => phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')

function StatusChip({ row }: { row: AdminAccountRow }) {
  if (row.status === 'pending') return <Chip tone="ochre">待付款开通</Chip>
  if (row.status === 'disabled') return <Chip tone="cinnabar">已停用</Chip>
  if (row.must_change_password && row.kind !== 'staff') return <Chip>未改初始密码</Chip>
  return <Chip tone="jade">正常</Chip>
}

function CertEditor({ row, onDone }: { row: AdminAccountRow; onDone: () => void }) {
  const [gate, setGate] = useState<Cert['gate']>(row.gate)
  const [realm, setRealm] = useState(row.realm_no ?? 0)
  const [dims, setDims] = useState<Partial<DimLevels>>(row.dims ?? {})
  const [note, setNote] = useState('')
  const [state, setState] = useState({ busy: false, msg: '' })
  const complete = DIMS.every((d) => dims[d.key as DimKey])

  async function onSave(event: FormEvent) {
    event.preventDefault()
    setState({ busy: true, msg: '' })
    try {
      await saveCert(row.id, { gate, realm_no: realm, dims: complete ? (dims as DimLevels) : null, note: note || null })
      onDone()
    } catch (err) {
      setState({ busy: false, msg: errorText(err) })
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-4 px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">门派</span>
          <select
            value={gate ?? ''}
            onChange={(e) => setGate((e.target.value || null) as Cert['gate'])}
            className="field mt-1 w-full"
          >
            <option value="">不入门（道长）</option>
            {GATES.map((g) => (
              <option key={g.name} value={g.name}>
                {g.name} · {g.craft}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">境界</span>
          <select value={realm} onChange={(e) => setRealm(Number(e.target.value))} className="field mt-1 w-full">
            <option value={0}>剑胚（试用未入境）</option>
            {REALMS.map((name, index) => (
              <option key={name} value={index + 1}>
                {['一', '二', '三', '四', '五', '六', '七', '八', '九'][index]} · {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <span className="label">剑的四维</span>
        {DIMS.map((dim) => (
          <div key={dim.key} className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[14px]">
              <span className="font-semibold">{dim.name}</span>
              <span className="ml-1.5 text-[12px] text-ink3">{dim.asks}</span>
            </span>
            <div className="seg" role="group" aria-label={dim.name}>
              {([1, 2, 3] as Tier[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  title={dim.levels[level]}
                  aria-pressed={dims[dim.key as DimKey] === level}
                  onClick={() => setDims({ ...dims, [dim.key]: level })}
                >
                  {TIER_NAME[level]}
                </button>
              ))}
            </div>
          </div>
        ))}
        {!complete ? <p className="kai text-[12px] text-ink3">四维要评全才会存进去；只改门派境界可以先不评。</p> : null}
      </div>

      <label className="block">
        <span className="label">评语（本人能看到）</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300} className="field mt-1 w-full resize-none" />
      </label>

      <p className="text-[12px] text-ink3">升境规则：剑锋先到下一境，其余三维不低于本境才升。</p>
      {state.msg ? <p className="text-[13px] text-cinnabar">{state.msg}</p> : null}
      <button type="submit" disabled={state.busy} className="btn btn-primary">
        {state.busy ? '保存中' : '盖章认证'}
      </button>
    </form>
  )
}

function NewStaff({ onDone }: { onDone: () => void }) {
  const [msg, setMsg] = useState('')
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setMsg('')
    try {
      await createStaff({
        phone: String(form.get('phone')),
        name: String(form.get('name')),
        id_tail: String(form.get('id_tail')).toUpperCase(),
        staff_slug: String(form.get('slug') || '') || undefined,
      })
      onDone()
    } catch (err) {
      setMsg(errorText(err))
    }
  }
  return (
    <form onSubmit={onSubmit} className="hair-b flex flex-wrap items-end gap-3 bg-sheet2 px-4 py-3">
      <label>
        <span className="label">姓名</span>
        <input required name="name" maxLength={20} className="field mt-1 w-28" />
      </label>
      <label>
        <span className="label">手机号</span>
        <input required name="phone" inputMode="numeric" pattern="1[0-9]{10}" maxLength={11} className="field mt-1 w-36" />
      </label>
      <label>
        <span className="label">身份证后 6 位</span>
        <input required name="id_tail" pattern="[0-9]{5}[0-9Xx]" maxLength={6} className="field mt-1 w-28" />
      </label>
      <label>
        <span className="label">名册 slug（可空）</span>
        <input name="slug" maxLength={40} className="field mt-1 w-28" />
      </label>
      <button type="submit" className="btn btn-primary">
        开号
      </button>
      <span className="kai text-[12px] text-ink3">身份证后 6 位就是登录密码，库里只存哈希。</span>
      {msg ? <span className="text-[13px] text-cinnabar">{msg}</span> : null}
    </form>
  )
}

function NewClient({ onDone }: { onDone: () => void }) {
  const [msg, setMsg] = useState('')
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setMsg('')
    try {
      await createClient({
        phone: String(form.get('phone')),
        name: String(form.get('name')),
        company: String(form.get('company')),
        initial_password: String(form.get('password')),
      })
      onDone()
    } catch (err) {
      setMsg(errorText(err))
    }
  }
  return (
    <form onSubmit={onSubmit} className="hair-b flex flex-wrap items-end gap-3 bg-sheet2 px-4 py-3">
      <label>
        <span className="label">公司</span>
        <input required name="company" maxLength={80} className="field mt-1 w-48" />
      </label>
      <label>
        <span className="label">对接人</span>
        <input required name="name" maxLength={20} className="field mt-1 w-24" />
      </label>
      <label>
        <span className="label">手机号</span>
        <input required name="phone" inputMode="numeric" pattern="1[0-9]{10}" maxLength={11} className="field mt-1 w-36" />
      </label>
      <label>
        <span className="label">初始密码</span>
        <input required name="password" minLength={6} maxLength={64} className="field mt-1 w-28" />
      </label>
      <button type="submit" className="btn btn-primary">
        建号（待开通）
      </button>
      <span className="kai text-[12px] text-ink3">建好先不能登录，确认收款后点「确认付款并开通」。</span>
      {msg ? <span className="text-[13px] text-cinnabar">{msg}</span> : null}
    </form>
  )
}

function AccountRow({
  row,
  selected,
  onSelect,
  onChanged,
}: {
  row: AdminAccountRow
  selected: boolean
  onSelect: () => void
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  async function act(fn: () => Promise<unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(true)
    try {
      await fn()
      onChanged()
    } catch (err) {
      window.alert(errorText(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <tr className={cn('hair-b', selected && 'bg-sel')}>
      <td className="px-4 py-2.5">
        <button type="button" onClick={onSelect} className="text-left">
          <span className="font-semibold">{row.kind === 'client' ? row.company : row.alias || row.name}</span>
          {row.is_admin ? <Chip className="ml-2">管理员</Chip> : null}
          <span className="block text-[12px] text-ink3">
            {row.kind === 'client' ? `对接人 ${row.name}` : row.alias && row.alias !== row.name ? row.name : ''}
          </span>
        </button>
      </td>
      <td className="px-2 py-2.5 tabular-nums text-ink2">{maskPhone(row.phone)}</td>
      {row.kind === 'staff' ? (
        <td className="px-2 py-2.5 text-ink2">
          {row.gate ?? (row.is_admin ? '道长' : '—')} · {realmLabel(row.realm_no ?? 0)}
        </td>
      ) : (
        <td className="px-2 py-2.5 text-ink2">{row.paid_at ? `付款 ${row.paid_at.slice(0, 10)}` : '未付款'}</td>
      )}
      <td className="px-2 py-2.5">
        <StatusChip row={row} />
      </td>
      <td className="px-4 py-2.5 text-right">
        <span className="inline-flex flex-wrap justify-end gap-1.5">
          {row.kind === 'staff' ? (
            <button type="button" className="btn btn-quiet" onClick={onSelect}>
              认证
            </button>
          ) : null}
          {row.status === 'pending' ? (
            <button
              type="button"
              disabled={busy}
              className="btn btn-primary"
              onClick={() => act(() => setAccountStatus(row.id, 'active'), `确认 ${row.company} 已付款，开通账号？`)}
            >
              确认付款并开通
            </button>
          ) : null}
          {row.status === 'disabled' ? (
            <button type="button" disabled={busy} className="btn" onClick={() => act(() => setAccountStatus(row.id, 'active'))}>
              恢复
            </button>
          ) : null}
          {row.status === 'active' && !row.is_admin ? (
            <button
              type="button"
              disabled={busy}
              className="btn btn-quiet"
              onClick={() => act(() => setAccountStatus(row.id, 'disabled'), `停用 ${row.name} 的账号？会立刻下线。`)}
            >
              停用
            </button>
          ) : null}
          {!row.is_admin ? (
            <button
              type="button"
              disabled={busy}
              className="btn btn-quiet"
              onClick={() => {
                const next = window.prompt(`给 ${row.name} 设一个临时密码（至少 6 位），对方登录后要再改：`)
                if (next) void act(() => resetPassword(row.id, next))
              }}
            >
              重置密码
            </button>
          ) : null}
        </span>
      </td>
    </tr>
  )
}

export function AccountsPage() {
  const [tab, setTab] = useState<Tab>('staff')
  const [rows, setRows] = useState<AdminAccountRow[]>([])
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setRows((await adminAccounts()).items)
      setError('')
    } catch (err) {
      setError(errorText(err))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const staff = rows.filter((r) => r.kind === 'staff')
  const clients = rows.filter((r) => r.kind === 'client')
  const list = tab === 'staff' ? staff : clients
  const selected = staff.find((r) => r.id === selectedId) ?? null

  return (
    <>
      <PageHead
        title="账号与认证"
        note="只有管理员能看"
        tabs={
          <Tabs<Tab>
            label="账号分类"
            value={tab}
            onChange={(next) => {
              setTab(next)
              setAdding(false)
              setSelectedId(null)
            }}
            tabs={[
              { key: 'staff', label: '同门', count: staff.length },
              { key: 'client', label: '合作企业', count: clients.length },
              { key: 'projects', label: '项目' },
            ]}
          />
        }
      />
      {error ? <p className="mb-3 text-[14px] text-cinnabar">{error}</p> : null}

      {tab === 'projects' ? (
        <ProjectsAdmin accounts={rows} />
      ) : (
        <div className={cn('grid gap-4', selected && 'xl:grid-cols-[minmax(0,1fr)_400px]')}>
          <Sheet>
            <SectionHead
              title={tab === 'staff' ? '同门账号' : '合作企业账号'}
              hint={tab === 'staff' ? '手机号 + 密码，密码是身份证后 6 位' : '付款后开通'}
              aside={
                <button type="button" className="btn" onClick={() => setAdding((v) => !v)}>
                  {adding ? '收起' : tab === 'staff' ? '新开同门' : '新建企业账号'}
                </button>
              }
            />
            {adding ? (
              tab === 'staff' ? (
                <NewStaff onDone={() => { setAdding(false); void load() }} />
              ) : (
                <NewClient onDone={() => { setAdding(false); void load() }} />
              )
            ) : null}
            {list.length === 0 ? (
              <Empty title={tab === 'staff' ? '还没有同门账号' : '还没有合作企业账号'} hint={tab === 'staff' ? '先用 seed_accounts 脚本批量开，或点右上角新开。' : '客户付款后在这里建号开通。'} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-[14px]">
                  <thead>
                    <tr className="hair-b text-[12px] text-ink3">
                      <th className="px-4 py-2 font-normal">{tab === 'staff' ? '同门' : '公司'}</th>
                      <th className="px-2 py-2 font-normal">手机</th>
                      <th className="px-2 py-2 font-normal">{tab === 'staff' ? '门派 · 境界' : '付款'}</th>
                      <th className="px-2 py-2 font-normal">状态</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((row) => (
                      <AccountRow
                        key={row.id}
                        row={row}
                        selected={row.id === selectedId}
                        onSelect={() => setSelectedId(row.kind === 'staff' ? row.id : null)}
                        onChanged={() => void load()}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Sheet>

          {selected ? (
            <Sheet className="self-start">
              <SectionHead
                title={`认证 · ${selected.alias || selected.name}`}
                aside={
                  <button type="button" className="btn btn-quiet" onClick={() => setSelectedId(null)}>
                    关闭
                  </button>
                }
              />
              <CertEditor
                key={selected.id}
                row={selected}
                onDone={() => {
                  setSelectedId(null)
                  void load()
                }}
              />
            </Sheet>
          ) : null}
        </div>
      )}
    </>
  )
}
