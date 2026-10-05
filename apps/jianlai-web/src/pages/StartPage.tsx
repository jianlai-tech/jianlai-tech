import { useNavigate, useSearch } from '@tanstack/react-router'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Seal } from '@/components/Seal'
import { getHttpErrorMessage } from '@/lib/http'
import { submitLead, type LeadKind } from '@/lib/api/leads'
import { cn } from '@/lib/cn'

type KindCopy = {
  tab: string
  tabHint: string
  title: [string, string]
  lead: string
  noteLabel: string
  notePlaceholder: string
  nameLabel: string
  done: string
}

const COPY: Record<LeadKind, KindCopy> = {
  project: {
    tab: '公司有项目',
    tabHint: '自己公司哪里卡住了',
    title: ['企业喊一声，', '剑来。'],
    lead: '三样就够：哪里卡住了、怎么称呼、手机号。道长看过再打给你，先聊能不能帮上忙。',
    noteLabel: '简要说说，哪里卡住了',
    notePlaceholder: '比如：订单在三个系统里各录一遍，月底对账要好几天。',
    nameLabel: '怎么称呼你',
    done: '收到了。道长看过之后，一般一个工作日内打给你。',
  },
  referral: {
    tab: '帮朋友引荐',
    tabHint: '身边有公司需要',
    title: ['替朋友，', '喊一声剑来。'],
    lead: '知道谁家公司天天跟表格和对不上的账较劲？留下你的称呼和手机，说说是什么情况。我们先跟你通个气，再由你引荐，不会直接打扰对方。',
    noteLabel: '简要说说，是谁家、什么情况',
    notePlaceholder: '比如：朋友开了家建材批发，进销存全靠表格，老板自己天天对账。',
    nameLabel: '你怎么称呼',
    done: '收到了，谢谢你想着我们。我们先打给你了解情况，引荐前不会联系对方。',
  },
}

export function StartPage() {
  const search = useSearch({ from: '/start' })
  const navigate = useNavigate({ from: '/start' })
  const kind: LeadKind = search.kind === 'referral' ? 'referral' : 'project'
  const copy = COPY[kind]

  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const [message, setMessage] = useState('')
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
  }

  function switchKind(next: LeadKind) {
    if (next === kind) return
    setStatus('idle')
    setMessage('')
    setTie('none')
    void navigate({ search: next === 'referral' ? { kind: 'referral' } : {}, replace: true })
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    setStatus('sending')
    setMessage('')
    try {
      await submitLead({
        kind,
        note: String(form.get('note') ?? '').trim(),
        contact_name: String(form.get('contact_name') ?? '').trim(),
        phone: String(form.get('phone') ?? '').trim(),
        source: kind === 'referral' ? '转介绍' : '官网',
      })
      setStatus('ok')
      formEl.reset()
      playTie()
    } catch (err) {
      setStatus('err')
      setMessage(getHttpErrorMessage(err, '没提交上，请稍后再试'))
    }
  }

  return (
    <main className="mx-auto max-w-[1280px] px-5 pb-10 sm:px-[54px]">
      <div className="grid gap-10 pt-8 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div>
          <h1
            key={kind}
            className="brush page-turn text-[52px] leading-[1.1] tracking-[-0.06em] [-webkit-text-stroke:1px_#1c1a17] sm:text-[80px]"
          >
            {copy.title[0]}
            <br />
            {copy.title[1]}
          </h1>
          <p className="mt-6 max-w-[26em] text-[18px] leading-[1.85] text-ink/80">{copy.lead}</p>
          <p className="kai mt-6 text-[15px] text-ink/60">斩掉的是重复活和对不上的账，不是你的人。</p>
        </div>

        <div className="relative">
          {tie === 'sent' ? (
            <div role="status" className="guji-leaf guji-frame flex min-h-[420px] flex-col items-center justify-center px-8 py-12 text-center">
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
          {/* 帖头：一道朱红封条，竖写「拜帖」 */}
          <div aria-hidden className="absolute -top-[2px] left-1/2 h-[6px] w-28 -translate-x-1/2 bg-cinnabar" />
          {tie === 'stamp' || tie === 'fly' ? (
            <span className="tie-stamp absolute left-1/2 top-1/2 z-10">
              <Seal chars="剑来" size={96} title="剑来科技" />
            </span>
          ) : null}
          {/* 两张签：像书上夹的两枚书签，选哪种留资 */}
          <div role="tablist" aria-label="留资类型" className="grid grid-cols-2 border-b border-ink/30">
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
                    'relative px-5 py-4 text-left transition-colors duration-300 sm:px-8',
                    active ? 'bg-transparent' : 'bg-ink/[0.05] text-ink/55 hover:bg-ink/[0.03] hover:text-ink/80',
                    key === 'referral' && 'border-l border-ink/30',
                  )}
                >
                  <span className={cn('brush block text-[26px] leading-none', active && 'text-ink')}>{COPY[key].tab}</span>
                  <span className="kai mt-1.5 block text-[14px] text-ink/55">{COPY[key].tabHint}</span>
                  <span
                    aria-hidden
                    className={cn(
                      'absolute inset-x-5 bottom-[-1px] h-[3px] bg-cinnabar transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:inset-x-8',
                      active ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                </button>
              )
            })}
          </div>

          <form key={kind} role="tabpanel" className="px-6 py-8 sm:px-10" onSubmit={onSubmit}>
            <label className="block text-[16px]">
              {copy.noteLabel}
              <textarea
                required
                name="note"
                rows={3}
                maxLength={500}
                placeholder={copy.notePlaceholder}
                className="field resize-none leading-[1.8] placeholder:text-ink/35"
              />
            </label>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <label className="block text-[16px]">
                {copy.nameLabel}
                <input
                  required
                  name="contact_name"
                  maxLength={40}
                  autoComplete="name"
                  placeholder="王总 / 李姐"
                  className="field placeholder:text-ink/35"
                />
              </label>
              <label className="block text-[16px]">
                手机号
                <input
                  required
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="1[0-9]{10}"
                  maxLength={11}
                  autoComplete="tel"
                  title="11 位手机号"
                  className="field"
                />
              </label>
            </div>

            <button type="submit" disabled={status === 'sending' || tie !== 'none'} className="ink-btn mt-9 w-full sm:w-auto">
              {status === 'sending' ? '递帖中' : kind === 'referral' ? '替朋友下帖' : '下帖请剑'}
            </button>
            {status === 'err' ? (
              <p role="alert" className="kai mt-4 text-[16px] text-cinnabar">
                {message}
              </p>
            ) : null}
            <p className="kai mt-6 text-[14px] text-ink/45">手机号只用来回访，不外传。</p>
          </form>
        </div>
          )}
        </div>
      </div>
    </main>
  )
}
