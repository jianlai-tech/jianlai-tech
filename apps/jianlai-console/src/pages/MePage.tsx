import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '@/data/auth'
import { DIMS, REALMS, person, tierOfRealm, TIER_NAME, type DimKey, type Tier } from '@/data/studio'
import { changePassword, saveProfile, type Cert, type MyProject, type Profile } from '@/lib/account'
import { errorText } from '@/lib/api'
import { Avatar, Chip, PageHead, Sheet, SectionHead, Empty } from '@/components/ui'
import { cn } from '@/lib/cn'

const PROFILE_FIELDS: { key: keyof Profile; label: string; hint: string; max: number; rows?: number }[] = [
  { key: 'alias', label: '对外称呼', hint: '官网名册上显示的名字，比如「木木」', max: 20 },
  { key: 'tagline', label: '一句话介绍', hint: '名册上名字下面那一行', max: 60 },
  { key: 'skills', label: '擅长', hint: '会做什么：对接接口、做表单、画界面…', max: 300, rows: 2 },
  { key: 'prefers', label: '想做的', hint: '更想做哪类活、哪类行业', max: 300, rows: 2 },
  { key: 'character', label: '性格', hint: '两三句，像同事介绍', max: 300, rows: 2 },
  { key: 'availability', label: '有空的时间', hint: '每周几天、寒暑假、实习到哪月', max: 200 },
]

export function realmLabel(realmNo: number) {
  return realmNo <= 0 ? '剑胚' : REALMS[realmNo - 1]
}

export function stageTone(stage: MyProject['stage']) {
  return stage === '已完结' ? 'plain' : stage === '上线护航' ? 'jade' : 'ochre'
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-24 overflow-hidden rounded-sm bg-ink/10">
        <span className="block h-full bg-rail" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </span>
      <span className="text-[12px] tabular-nums text-ink3">{value}%</span>
    </span>
  )
}

function CertBlock({ cert }: { cert: Cert | null | undefined }) {
  if (!cert) return <Empty title="还没认证" hint="主理人评过之后，门派、境界和四维会出现在这里。" />
  const tier: Tier = tierOfRealm(Math.max(1, cert.realm_no))
  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <span>
          <span className="label">门派</span>
          <span className="ml-2 font-semibold">{cert.gate ?? '道长 · 三门皆归'}</span>
        </span>
        <span>
          <span className="label">境界</span>
          <span className="ml-2 font-semibold">{realmLabel(cert.realm_no)}</span>
          {cert.realm_no > 0 ? <span className="ml-1.5 text-[12px] text-ink3">{TIER_NAME[tier]}</span> : null}
        </span>
      </div>
      <dl className="grid gap-px overflow-hidden rounded-sm border border-ink/15 bg-ink/10 sm:grid-cols-2">
        {DIMS.map((dim) => {
          const level = cert.dims?.[dim.key as DimKey] as Tier | undefined
          return (
            <div key={dim.key} className="bg-sheet px-3 py-2.5">
              <dt className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">
                  {dim.name}
                  <span className="ml-1.5 text-[12px] font-normal text-ink3">{dim.asks}</span>
                </span>
                <span className="text-[12px] text-ink3">{level ? TIER_NAME[level] : '未评'}</span>
              </dt>
              <dd className="kai mt-1 text-[13px] text-ink2">{level ? dim.levels[level] : '—'}</dd>
            </div>
          )
        })}
      </dl>
      {cert.note ? <p className="kai text-[14px] text-ink2">主理人评语：{cert.note}</p> : null}
      <p className="text-[12px] text-ink3">
        {cert.certified_at
          ? `${cert.certified_by ?? '主理人'} 认证于 ${cert.certified_at.slice(0, 10)}`
          : '尚未正式认证'}
        。这一栏只有管理员能改。
      </p>
    </div>
  )
}

function ProjectsBlock({ projects }: { projects: MyProject[] }) {
  if (projects.length === 0) return <Empty title="还没进过项目" hint="主理人把你派进项目后，会出现在这里。" />
  return (
    <ul>
      {projects.map((item) => (
        <li key={item.id} className="hair-b grid gap-1 px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{item.name}</span>
              {item.industry ? <span className="text-[12px] text-ink3">{item.industry}</span> : null}
              <Chip tone={stageTone(item.stage)}>{item.stage}</Chip>
            </div>
            <div className="mt-0.5 text-[13px] text-ink2">
              角色：<span className="font-semibold text-ink">{item.role ?? '—'}</span>
              {item.progress_note ? <span className="ml-3 text-ink3">{item.progress_note}</span> : null}
            </div>
          </div>
          <ProgressBar value={item.progress} />
        </li>
      ))}
    </ul>
  )
}

function PasswordForm() {
  const [state, setState] = useState<{ busy: boolean; msg: string; ok: boolean }>({ busy: false, msg: '', ok: false })
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    setState({ busy: true, msg: '', ok: false })
    try {
      await changePassword(String(form.get('old') ?? ''), String(form.get('next') ?? ''))
      formEl.reset()
      setState({ busy: false, msg: '密码已改，其它设备会下线', ok: true })
    } catch (err) {
      setState({ busy: false, msg: errorText(err), ok: false })
    }
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 px-4 py-4">
      <label>
        <span className="label">当前密码</span>
        <input required name="old" type="password" autoComplete="current-password" className="field mt-1 w-44" />
      </label>
      <label>
        <span className="label">新密码（至少 8 位）</span>
        <input required name="next" type="password" minLength={8} autoComplete="new-password" className="field mt-1 w-44" />
      </label>
      <button type="submit" disabled={state.busy} className="btn">
        {state.busy ? '保存中' : '改密码'}
      </button>
      {state.msg ? (
        <span role="status" className={cn('text-[13px]', state.ok ? 'text-jade' : 'text-cinnabar')}>
          {state.msg}
        </span>
      ) : null}
    </form>
  )
}

export function MePage() {
  const { me, refresh } = useAuth()
  const [draft, setDraft] = useState<Profile>({
    alias: null,
    tagline: null,
    skills: null,
    prefers: null,
    character: null,
    availability: null,
  })
  const [save, setSave] = useState<{ busy: boolean; msg: string; ok: boolean }>({ busy: false, msg: '', ok: false })

  useEffect(() => {
    if (me?.profile) setDraft(me.profile)
  }, [me?.profile])

  if (!me) return null
  const account = me.account
  const roster = account.staff_slug ? person(account.staff_slug) : undefined

  async function onSave(event: FormEvent) {
    event.preventDefault()
    setSave({ busy: true, msg: '', ok: false })
    try {
      await saveProfile(draft)
      await refresh()
      setSave({ busy: false, msg: '已保存', ok: true })
    } catch (err) {
      setSave({ busy: false, msg: errorText(err), ok: false })
    }
  }

  return (
    <>
      <PageHead title="我的档案" note={account.is_admin ? '管理员' : '个性化你来改，认证由主理人定'} />
      <div className="mb-4 flex items-center gap-3">
        {roster ? <Avatar person={roster} size={48} /> : null}
        <div>
          <div className="title-serif text-[18px]">
            {draft.alias || account.name}
            {draft.alias && draft.alias !== account.name ? (
              <span className="ml-2 text-[14px] text-ink3">{account.name}</span>
            ) : null}
          </div>
          <div className="text-[13px] text-ink3">{account.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Sheet>
          <SectionHead title="个性化" hint="对外展示，你自己改" />
          <form onSubmit={onSave} className="space-y-3 px-4 py-4">
            {PROFILE_FIELDS.map((field) => (
              <label key={field.key} className="block">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="label">{field.label}</span>
                  <span className="kai text-[12px] text-ink3">{field.hint}</span>
                </span>
                {field.rows ? (
                  <textarea
                    rows={field.rows}
                    maxLength={field.max}
                    value={draft[field.key] ?? ''}
                    onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                    className="field mt-1 w-full resize-none"
                  />
                ) : (
                  <input
                    maxLength={field.max}
                    value={draft[field.key] ?? ''}
                    onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                    className="field mt-1 w-full"
                  />
                )}
              </label>
            ))}
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={save.busy} className="btn btn-primary">
                {save.busy ? '保存中' : '保存'}
              </button>
              {save.msg ? (
                <span role="status" className={cn('text-[13px]', save.ok ? 'text-jade' : 'text-cinnabar')}>
                  {save.msg}
                </span>
              ) : null}
            </div>
          </form>
        </Sheet>

        <div className="space-y-4">
          <Sheet>
            <SectionHead title="剑来认证 · 能力水平" hint="主理人认证" />
            <CertBlock cert={me.cert} />
          </Sheet>
          <Sheet>
            <SectionHead title="剑来认证 · 参与的项目" hint="角色和进度由主理人维护" />
            <ProjectsBlock projects={me.projects ?? []} />
          </Sheet>
          <Sheet>
            <SectionHead title="登录密码" />
            <PasswordForm />
          </Sheet>
        </div>
      </div>
    </>
  )
}
