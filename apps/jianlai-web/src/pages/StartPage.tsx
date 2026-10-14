import { useNavigate, useSearch } from '@tanstack/react-router'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Seal } from '@/components/Seal'
import { getHttpErrorMessage } from '@/lib/http'
import { submitLead, type LeadKind } from '@/lib/api/leads'
import { cn } from '@/lib/cn'

type KindCopy = {
  tab: string
  tabBadge: string
  tabHint: string
  kicker: string
  title: [string, string]
  lead: string
  steps: { num: string; title: string; desc: string }[]
  quickTags: string[]
  noteLabel: string
  notePlaceholder: string
  companyLabel: string
  companyPlaceholder: string
  nameLabel: string
  done: string
}

const COPY: Record<LeadKind, KindCopy> = {
  project: {
    tab: '公司有项目',
    tabBadge: '本司请剑',
    tabHint: '自己公司哪里卡住了',
    kicker: '〔 请剑拜帖 · 企业问诊 〕',
    title: ['企业喊一声，', '剑来。'],
    lead: '不用准备需求文档。说说你公司哪段活最费人、哪笔账老对不上，道长看过亲自回你，先聊能不能帮上忙。',
    steps: [
      { num: '壹', title: '道长回信', desc: '一个工作日内由道长本人电话或微信联系，不派推销员。' },
      { num: '贰', title: '现场摸底', desc: '进场跟着你的人走一遍真实的单，把卡点看清。' },
      { num: '叁', title: '一处起手', desc: '先挑最急的一处做最小 MVP，人用上了再算下一处。' },
    ],
    quickTags: ['网页、小程序开发', 'APP 开发', '智能体开发', '企业内部系统定制'],
    noteLabel: '简要说说，哪里卡住了',
    notePlaceholder: '比如：订单在三个系统里各录一遍，月底财务对账要花好几天……',
    companyLabel: '公司或行业',
    companyPlaceholder: '如：医疗器械分销 / 教培机构',
    nameLabel: '怎么称呼你',
    done: '收到了。道长看过之后，一般一个工作日内联系你。',
  },
  referral: {
    tab: '帮朋友引荐',
    tabBadge: '仗义引荐',
    tabHint: '身边有公司需要',
    kicker: '〔 同道引荐 · 成人之美 〕',
    title: ['替朋友，', '喊一声剑来。'],
    lead: '知道哪家朋友的公司天天跟表格和烂账较劲？留下你的称呼和联系方式，我们先跟你通气，再由你引荐，绝不直接打扰对方。',
    steps: [
      { num: '壹', title: '先与你通气', desc: '道长先联系你了解朋友公司的大致情况，评估能不能接。' },
      { num: '贰', title: '由你搭桥', desc: '确定能帮上忙后，由你拉群或引荐，绝不冒昧打扰朋友。' },
      { num: '叁', title: '成事重谢', desc: '项目落地后，按剑来规矩奉上引荐谢礼，不负同道情分。' },
    ],
    quickTags: ['网页、小程序开发', 'APP 开发', '智能体开发', '企业内部系统定制'],
    noteLabel: '简要说说，是谁家、什么情况',
    notePlaceholder: '比如：朋友开了家建材批发，进销存全靠表格，老板自己天天熬夜对账……',
    companyLabel: '朋友公司的行业',
    companyPlaceholder: '如：建材批发 / 连锁餐饮',
    nameLabel: '你怎么称呼',
    done: '收到了，谢谢你想着我们。我们先联系你了解情况，引荐前绝不打扰对方。',
  },
}

export function StartPage() {
  const search = useSearch({ from: '/site/start' })
  const navigate = useNavigate({ from: '/start' })
  const kind: LeadKind = search.kind === 'referral' ? 'referral' : 'project'
  const copy = COPY[kind]

  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const [message, setMessage] = useState('')
  const [note, setNote] = useState('')
  const [pickedTags, setPickedTags] = useState<string[]>([])
  /** 拜帖动画：提交成功后 折 → 印 → 飞 → 递到 */
  const [tie, setTie] = useState<'none' | 'fold' | 'stamp' | 'fly' | 'sent'>('none')
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  function playTie() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setTie('sent')
      return
    }
    setTie('fold')
    timers.current.push(window.setTimeout(() => setTie('stamp'), 650))
    timers.current.push(window.setTimeout(() => setTie('fly'), 1350))
    timers.current.push(window.setTimeout(() => setTie('sent'), 2250))
  }

  function writeAnother() {
    setTie('none')
    setStatus('idle')
    setNote('')
    setPickedTags([])
  }

  function switchKind(next: LeadKind) {
    if (next === kind) return
    setStatus('idle')
    setMessage('')
    setTie('none')
    setNote('')
    setPickedTags([])
    void navigate({ search: next === 'referral' ? { kind: 'referral' } : {}, replace: true })
  }

  function toggleTag(tag: string) {
    setPickedTags((prev) => {
      const exists = prev.includes(tag)
      const next = exists ? prev.filter((t) => t !== tag) : [...prev, tag]
      if (!exists && !note.includes(tag)) {
        setNote((cur) => (cur.trim() ? `${cur.trim()}；${tag}` : tag))
      }
      return next
    })
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const text = (k: string) => String(form.get(k) ?? '').trim()
    setStatus('sending')
    setMessage('')
    try {
      await submitLead({
        kind,
        note: note.trim() || text('note'),
        contact_name: text('contact_name'),
        phone: text('phone'),
        company_name: text('company_name') || undefined,
        wechat: text('wechat') || undefined,
        scene: pickedTags.length > 0 ? pickedTags.join('、') : undefined,
        source: kind === 'referral' ? '转介绍' : '官网',
      })
      setStatus('ok')
      formEl.reset()
      setNote('')
      setPickedTags([])
      playTie()
    } catch (err) {
      setStatus('err')
      setMessage(getHttpErrorMessage(err, '没提交上，请稍后再试'))
    }
  }

  return (
    <main className="mx-auto max-w-[1280px] px-5 pb-12 sm:px-[54px]">
      <div className="grid gap-10 pt-8 lg:grid-cols-[0.95fr_1.1fr] lg:items-start lg:gap-14">
        {/* 左栏：题旨 + 下帖三步 + 定心丸 */}
        <div className="flex flex-col">
          <span className="kai text-[13px] tracking-[0.25em] text-cinnabar">{copy.kicker}</span>
          <h1
            key={kind}
            className="brush page-turn mt-2 text-[52px] leading-[1.08] tracking-[-0.04em] [-webkit-text-stroke:1px_#1c1a17] sm:text-[76px]"
          >
            {copy.title[0]}
            <br />
            {copy.title[1]}
          </h1>
          <p className="mt-5 max-w-[27em] text-[17.5px] leading-[1.85] text-ink/80">{copy.lead}</p>

          {/* 下帖三步：古籍竖栏步骤 */}
          <div className="mt-8 border-y border-ink/25 bg-[#f2e7cf]/45 px-5 py-5">
            <p className="kai text-[13px] tracking-[0.25em] text-ink/55">下帖之后 · 三步落定</p>
            <ol className="mt-3.5 space-y-3.5">
              {copy.steps.map((s) => (
                <li key={s.num} className="grid grid-cols-[2rem_1fr] items-baseline gap-2">
                  <span className="kai inline-flex h-6 w-6 items-center justify-center rounded-[2px] border border-cinnabar/40 bg-cinnabar/10 text-[12.5px] text-cinnabar">
                    {s.num}
                  </span>
                  <div>
                    <b className="kai text-[16px] font-semibold text-ink">{s.title}</b>
                    <span className="mx-2 text-ink/30">·</span>
                    <span className="text-[14.5px] leading-[1.7] text-ink/75">{s.desc}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <p className="kai mt-5 flex items-center gap-2.5 text-[15px] text-ink/65">
            <span aria-hidden className="inline-block h-2 w-2 rotate-45 bg-cinnabar" />
            <span>斩掉的是重复活和对不上的账，不是你的人。</span>
          </p>
        </div>

        {/* 右栏：拜帖文书 */}
        <div className="relative">
          {tie === 'sent' ? (
            <div role="status" className="guji-leaf guji-frame flex min-h-[460px] flex-col items-center justify-center px-8 py-12 text-center">
              <img src="/art/baitie.webp" alt="" className="w-[220px] opacity-90 mix-blend-multiply" />
              <p className="brush mt-6 text-[40px] leading-tight">帖已递到道长手里</p>
              <p className="mt-4 max-w-[22em] text-[17px] leading-[1.8] text-ink/75">{copy.done}</p>
              <button type="button" onClick={writeAnother} className="ink-link kai mt-8 text-[16px]">
                再写一帖
              </button>
            </div>
          ) : (
            <div
              className={cn(
                'guji-leaf guji-frame relative',
                tie === 'fold' && 'tie-fold',
                tie === 'stamp' && 'tie-fold [animation-fill-mode:forwards]',
                tie === 'fly' && 'tie-fly',
              )}
              style={tie === 'stamp' ? { transform: 'perspective(1400px) rotateX(64deg) scaleY(0.42) scale(0.86)' } : undefined}
            >
              {tie === 'stamp' || tie === 'fly' ? (
                <span className="tie-stamp absolute left-1/2 top-1/2 z-10">
                  <Seal chars="剑来" size={96} title="剑来科技" />
                </span>
              ) : null}

              {/* 两张签：选哪种留资 */}
              <div role="tablist" aria-label="留资类型" className="grid grid-cols-2 border-b-2 border-ink/75">
                {(Object.keys(COPY) as LeadKind[]).map((key) => {
                  const active = key === kind
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => switchKind(key)}
                      className={cn(
                        'relative px-5 py-4 text-left transition-colors duration-300 sm:px-7',
                        active ? 'bg-[#f6ecd6]/70' : 'bg-ink/[0.045] text-ink/55 hover:bg-ink/[0.025] hover:text-ink/80',
                        key === 'referral' && 'border-l border-ink/30',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn('brush text-[27px] leading-none', active ? 'text-ink' : 'text-ink/70')}>
                          {COPY[key].tab}
                        </span>
                        <span
                          className={cn(
                            'kai rounded-[2px] px-1.5 py-0.5 text-[11px] tracking-[0.1em]',
                            active
                              ? 'bg-cinnabar text-[#f5ecd9]'
                              : 'border border-ink/20 text-ink/45',
                          )}
                        >
                          {COPY[key].tabBadge}
                        </span>
                      </div>
                      <span className="kai mt-1.5 block text-[13.5px] text-ink/60">{COPY[key].tabHint}</span>
                      <span
                        aria-hidden
                        className={cn(
                          'absolute inset-x-0 bottom-[-2px] h-[3px] bg-cinnabar transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                          active ? 'scale-x-100' : 'scale-x-0',
                        )}
                      />
                    </button>
                  )
                })}
              </div>

              <form key={kind} role="tabpanel" className="px-6 py-6 sm:px-8 sm:py-7" onSubmit={onSubmit}>
                {/* 壹：卡点描述 + 快捷竹签 */}
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <label htmlFor="lead-note" className="kai flex items-center gap-2 text-[15.5px] font-semibold text-ink">
                      <span className="rounded-[2px] bg-cinnabar/10 px-1.5 py-0.5 text-[12px] text-cinnabar">一</span>
                      <span>{copy.noteLabel}</span>
                    </label>
                    <span className="kai text-[12px] text-ink/45">可点选需求类型，再补充几句</span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {copy.quickTags.map((tag) => {
                      const on = pickedTags.includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={cn(
                            'kai rounded-[2px] border px-2.5 py-1 text-[12.5px] transition-colors',
                            on
                              ? 'border-cinnabar bg-cinnabar text-[#f5ecd9]'
                              : 'border-ink/25 bg-[#f7efdd]/70 text-ink/75 hover:border-cinnabar/60 hover:text-cinnabar',
                          )}
                        >
                          + {tag}
                        </button>
                      )
                    })}
                  </div>

                  {/* 朱丝手书八行笺框 */}
                  <div className="mt-3 rounded-[2px] border border-cinnabar/30 bg-[#fbf5e6]/70 px-3.5 py-1.5 shadow-[inset_0_1px_3px_rgba(28,26,23,0.04)] focus-within:border-cinnabar/70 focus-within:bg-[#fbf5e6]">
                    <textarea
                      id="lead-note"
                      required
                      name="note"
                      rows={4}
                      maxLength={500}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={copy.notePlaceholder}
                      className="block w-full resize-none border-0 bg-transparent p-0 text-[15px] leading-[30px] text-ink placeholder:text-ink/35 focus:outline-none"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(to bottom, transparent 0, transparent 29px, rgba(168, 50, 42, 0.18) 29px, rgba(168, 50, 42, 0.18) 30px)',
                        backgroundAttachment: 'local',
                      }}
                    />
                  </div>
                </div>

                {/* 贰：称呼与联络方式 */}
                <div className="mt-6">
                  <p className="kai flex items-center gap-2 text-[15.5px] font-semibold text-ink">
                    <span className="rounded-[2px] bg-cinnabar/10 px-1.5 py-0.5 text-[12px] text-cinnabar">二</span>
                    <span>立帖人联络</span>
                    <span className="ml-auto text-[12px] font-normal text-ink/45">仅道长可见 · 绝不外传</span>
                  </p>

                  <div className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    <label className="block text-[14px] text-ink/70">
                      <span>{copy.nameLabel}</span>
                      <input
                        required
                        name="contact_name"
                        maxLength={40}
                        autoComplete="name"
                        placeholder="如：王总 / 李姐"
                        className="field text-[15.5px] placeholder:text-ink/30"
                      />
                    </label>
                    <label className="block text-[14px] text-ink/70">
                      <span>手机号</span>
                      <input
                        required
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        pattern="1[0-9]{10}"
                        maxLength={11}
                        autoComplete="tel"
                        placeholder="11 位常用手机号"
                        title="11 位手机号"
                        className="field text-[15.5px] placeholder:text-ink/30"
                      />
                    </label>
                    <label className="block text-[14px] text-ink/70">
                      <span>
                        {copy.companyLabel} <em className="not-italic text-[12px] text-ink/40">选填</em>
                      </span>
                      <input
                        name="company_name"
                        maxLength={80}
                        placeholder={copy.companyPlaceholder}
                        className="field text-[15.5px] placeholder:text-ink/30"
                      />
                    </label>
                    <label className="block text-[14px] text-ink/70">
                      <span>
                        微信号 <em className="not-italic text-[12px] text-ink/40">选填 · 偏爱微信可留</em>
                      </span>
                      <input
                        name="wechat"
                        maxLength={40}
                        placeholder="方便加你微信聊"
                        className="field text-[15.5px] placeholder:text-ink/30"
                      />
                    </label>
                  </div>
                </div>

                {/* 底部递帖栏 */}
                <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-ink/25 pt-5">
                  <div className="flex items-center gap-2.5">
                    <Seal chars="剑来" size={26} className="shrink-0 opacity-85" />
                    <span className="kai text-[13px] leading-[1.5] text-ink/60">
                      帖递望城 · 道长亲启
                      <br />
                      一般一个工作日内回信
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'sending' || tie !== 'none'}
                    className="ink-btn ink-btn-framed w-full px-7 py-3 text-[17px] sm:w-auto"
                  >
                    {status === 'sending' ? '递帖中…' : kind === 'referral' ? '替朋友下帖 →' : '下帖请剑 →'}
                  </button>
                </div>

                {status === 'err' ? (
                  <p role="alert" className="kai mt-4 text-right text-[15px] text-cinnabar">
                    {message}
                  </p>
                ) : null}
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
