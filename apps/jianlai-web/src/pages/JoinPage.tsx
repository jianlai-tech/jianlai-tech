import { Link } from '@tanstack/react-router'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { getHttpErrorMessage } from '@/lib/http'
import { submitRecruit } from '@/lib/api/recruits'
import { cn } from '@/lib/cn'
import './join.css'

/** 帖内正文，竖排，从右往左读 */
const DECREE = [
  '剑来扩招',
  '广募天下学子为剑修',
  '不问出身 不问专业',
  '只问心中可有 AI',
  '随道长入企业现场',
  '斩重复之活',
  '断对不上之账',
  '有意者 书投名状一纸',
]

type Phase = 'closed' | 'opening' | 'open' | 'pressing' | 'done'

function reduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function useWide() {
  const query = '(min-width: 1024px)'
  const [wide, setWide] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setWide(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return wide
}

/** 朱砂指印 */
function Thumbprint({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 100" className={className} aria-hidden>
      <defs>
        <filter id="yx-thumb">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  9 0 0 0 -3.2" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
      </defs>
      <g filter="url(#yx-thumb)" fill="none" stroke="#b3261e" strokeLinecap="round">
        {Array.from({ length: 11 }, (_, i) => (
          <ellipse
            key={i}
            cx={40 + Math.sin(i) * 0.8}
            cy={52 - i * 0.6}
            rx={6 + i * 3.1}
            ry={8 + i * 3.9}
            strokeWidth={1.7}
            strokeDasharray={i % 3 === 0 ? undefined : `${8 + i} ${2 + (i % 2)}`}
            opacity={1 - i * 0.045}
          />
        ))}
      </g>
    </svg>
  )
}

/** 封面：大红帖，金字竖写 */
function Cover({ onOpen, disabled }: { onOpen: () => void; disabled: boolean }) {
  return (
    <button type="button" className="yx-cover" onClick={onOpen} disabled={disabled} aria-label="启帖，打开英雄帖">
      <span className="yx-cover-frame" aria-hidden />
      <span className="yx-cover-band" aria-hidden />
      <span className="yx-cover-title brush">英雄帖</span>
      <span className="yx-cover-from kai">剑来科技 敬呈</span>
      <span className="yx-wax" aria-hidden>
        <span className="brush">剑</span>
      </span>
      <span className="yx-cover-hint kai">轻触 · 启帖</span>
    </button>
  )
}

/** 帖内左页：金字正文 */
function Decree() {
  return (
    <div className="yx-decree">
      <span className="yx-cover-frame" aria-hidden />
      <p className="yx-decree-head brush">英雄帖</p>
      <div className="yx-decree-body kai" aria-label={DECREE.join('，')}>
        {DECREE.map((line, i) => (
          <span key={line} style={{ animationDelay: `${420 + i * 120}ms` }}>
            {line}
          </span>
        ))}
      </div>
      <div className="yx-decree-foot">
        <span className="kai">长沙 · 望城</span>
        <span className="yx-seal brush" aria-hidden>
          剑来
        </span>
      </div>
    </div>
  )
}

export function JoinPage() {
  const wide = useWide()
  const [phase, setPhase] = useState<Phase>('closed')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [signedName, setSignedName] = useState('')
  const timers = useRef<number[]>([])
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = document.title
    document.title = '英雄帖 · 剑来科技招剑修'
    return () => {
      document.title = prev
      timers.current.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms))
  }

  function open() {
    if (reduced()) {
      setPhase('open')
      return
    }
    setPhase('opening')
    later(() => setPhase('open'), wide ? 1300 : 650)
  }

  useEffect(() => {
    if (phase !== 'open' || wide) return
    pageRef.current?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' })
  }, [phase, wide])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const text = (key: string) => String(form.get(key) ?? '').trim()
    setSending(true)
    setError('')
    try {
      await submitRecruit({
        name: text('name'),
        age: Number(text('age')),
        school: text('school') || undefined,
        major: text('major'),
        ai_story: text('ai_story'),
        strengths: text('strengths'),
        phone: text('phone'),
        wechat: text('wechat') || undefined,
        source: '英雄帖',
      })
      setSignedName(text('name'))
      formEl.reset()
      if (reduced()) setPhase('done')
      else {
        setPhase('pressing')
        later(() => setPhase('done'), 1400)
      }
    } catch (err) {
      setError(getHttpErrorMessage(err, '没递上去，请稍后再试'))
    } finally {
      setSending(false)
    }
  }

  const isOpen = phase !== 'closed' && phase !== 'opening'
  const formLive = phase === 'open' || phase === 'pressing'

  const page = (
    <div className="yx-page" ref={pageRef}>
      {phase === 'done' ? (
        <div role="status" className="yx-done">
          <p className="kai yx-kicker">投名状 已收</p>
          <p className="brush yx-done-title">{signedName ? `${signedName}，` : ''}收到了</p>
          <Thumbprint className="yx-done-thumb" />
          <p className="yx-done-text">
            道长会一张张看。合适的话打电话或加微信约你聊聊，再一起做件小事试试手。
          </p>
          <button type="button" className="yx-link kai" onClick={() => setPhase('open')}>
            替同学再写一张
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className={cn('yx-form', phase === 'pressing' && 'pointer-events-none')} inert={!formLive}>
          <div className="yx-form-head">
            <h1 className="brush">投名状</h1>
            <p className="kai">照实写，写你真做过的。只有道长看得到。</p>
          </div>

          <fieldset>
            <legend>
              <span className="brush">一问</span>你是谁
            </legend>
            <div className="yx-grid yx-grid-4">
              <label>
                姓名
                <input required name="name" maxLength={20} autoComplete="name" />
              </label>
              <label>
                年纪
                <input required name="age" type="number" inputMode="numeric" min={14} max={60} />
              </label>
              <label>
                专业
                <input required name="major" maxLength={40} placeholder="什么专业都行" />
              </label>
              <label>
                学校和年级 <em>选填</em>
                <input name="school" maxLength={60} placeholder="湖南大学 大二" />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <span className="brush">二问</span>你和 AI 交过手吗
            </legend>
            <textarea
              required
              name="ai_story"
              rows={4}
              maxLength={1500}
              aria-label="和 AI 打过的交道"
              placeholder="用过什么、拿它做成过什么、卡在哪又怎么过去的。课程作业、自己的小工具、帮家里或社团干的活都算。"
            />
          </fieldset>

          <fieldset>
            <legend>
              <span className="brush">三问</span>你身上有什么本事
            </legend>
            <textarea
              required
              name="strengths"
              rows={3}
              maxLength={800}
              aria-label="自己的特长"
              placeholder="写代码、画画、剪视频、写东西、跟人打交道、能熬能扛……什么都算。"
            />
          </fieldset>

          <div className="yx-sign">
            <label>
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
              />
            </label>
            <label>
              微信号 <em>选填</em>
              <input name="wechat" maxLength={40} />
            </label>
            <button type="submit" className="yx-press" disabled={sending || phase === 'pressing'} aria-label="按指印，递上投名状">
              {phase === 'pressing' ? (
                <Thumbprint className="yx-thumb-press" />
              ) : (
                <>
                  <Thumbprint className="yx-thumb-ghost" />
                  <span className="brush">{sending ? '递帖中' : '画押'}</span>
                </>
              )}
            </button>
          </div>
          {error ? (
            <p role="alert" className="yx-error kai">
              {error}
            </p>
          ) : null}
          <p className="yx-fine kai">手机号只用来约聊，不外传。</p>
        </form>
      )}
    </div>
  )

  return (
    <div className="yx-stage">
      <header className="yx-top">
        <Link to="/" className="yx-brand kai">
          剑来科技
        </Link>
        <span className="kai">招剑修 · 专业不限</span>
      </header>

      {wide ? (
        <div className={cn('yx-book', phase === 'closed' && 'is-closed', phase === 'opening' && 'is-opening', isOpen && 'is-open')}>
          <div className="yx-left" aria-hidden={!isOpen} />
          <div className="yx-right">{page}</div>
          {/* 封面：一面是封皮，翻过去背面是正文 */}
          <div className="yx-leaf">
            <div className="yx-leaf-front">
              <Cover onOpen={open} disabled={phase !== 'closed'} />
            </div>
            <div className="yx-leaf-back">
              <Decree />
            </div>
          </div>
        </div>
      ) : (
        <div className="yx-stack">
          {phase === 'closed' || phase === 'opening' ? (
            <div className={cn('yx-stack-cover', phase === 'opening' && 'is-lifting')}>
              <Cover onOpen={open} disabled={phase !== 'closed'} />
            </div>
          ) : (
            <>
              <Decree />
              {page}
            </>
          )}
        </div>
      )}

      <p className="yx-foot kai">
        剑来不等现成的高手，从大学生开始铸剑。
        <Link to="/people" className="yx-link">
          看看剑修名册
        </Link>
      </p>
    </div>
  )
}
