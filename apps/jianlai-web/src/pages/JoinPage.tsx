import { FormEvent, useEffect, useRef, useState } from 'react'
import { getHttpErrorMessage } from '@/lib/http'
import { submitRecruit, type RecruitTrack } from '@/lib/api/recruits'
import { cn } from '@/lib/cn'
import './join.css'

/** 帖内正文，竖排，一行一列，从右往左读 */
type DecreeLine = {
  lead?: string
  text: string
  tone?: 'lead' | 'end'
  groupEnd?: boolean
}

const DECREE: DecreeLine[] = [
  { lead: '招贤', text: '剑修二期', tone: 'lead', groupEnd: true },
  { text: '广募中南学子' },
  { text: '不问出身专业', groupEnd: true },
  { lead: '上山', text: '磨AI技艺' },
  { lead: '下山', text: '落地企业AI' },
  { lead: '立身', text: '吃饱喝足身体好', groupEnd: true },
  { text: '书投名状一纸', tone: 'end' },
]

/** 剑修四要：一字为纲，两行小字齐整；加分项「艺」单独成横幅，让四要名副其实 */
const RULES: { char: string; lines: [string, string] }[] = [
  { char: '韧', lines: ['扛得住压', '受得了磨'] },
  { char: '勤', lines: ['时间肯投入', '精力给得足'] },
  { char: '敏', lines: ['学得快', '说得清'] },
  { char: '技', lines: ['有编程底子更好', '没有就加倍苦功'] },
]

const BONUS = {
  tag: '加分',
  char: '艺',
  text: '唱跳、设计、体育、摄影、表达，有一技更佳',
}

/** 投名状预设项，和 API 的白名单一一对应 */
const GRADES = ['大一', '大二', '大三', '大四', '研一', '研二', '研三', '博士'] as const
const WATCH_ONLY = new Set<string>(['大一', '大二'])
const TRACKS: { key: RecruitTrack; badge: string; title: string; hint: string }[] = [
  { key: 'watch', badge: '入山 · 习剑', title: '观摩学习', hint: '旁观真实项目拆解，先看懂再上手' },
  { key: 'work', badge: '下山 · 出剑', title: '驻场接活', hint: '随道长入企业现场，真刀真枪干活' },
]
const WEEKLY_HOURS = ['10 小时以内', '10–20 小时', '20–30 小时', '30 小时以上'] as const
const CS_BASES = ['计算机相关专业', '自学过编程', '用 AI 做成过东西', '暂时没有'] as const
const TALENTS = ['唱歌', '跳舞', '设计', '体育', '摄影剪辑', '写作', '主持表达', '乐器', '组织活动'] as const

/** 对联：上联在右，下联在左，与页脚同一副 */
const COUPLET = { upper: '此日楼台鼎鼐', lower: '他时剑履山河' }

/** 竖排里「AI」合成一格，不拆成 A / I 两个字 */
function renderLine(text: string) {
  return text.split('AI').flatMap((part, i, all) =>
    i < all.length - 1 ? [part, <span key={i} className="yx-tcy">AI</span>] : [part],
  )
}

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
      <div className="yx-decree-rule" aria-hidden />
      <div className="yx-decree-main">
        <p className="yx-couplet yx-couplet-lower brush" style={{ animationDelay: '1400ms' }}>
          {COUPLET.lower}
        </p>
        <div
          className="yx-decree-body kai"
          aria-label={DECREE.map((l) => (l.lead ? `${l.lead}，${l.text}` : l.text)).join('，')}
        >
          {DECREE.map((line, i) => (
            <span
              key={line.text}
              className={cn(
                'yx-col',
                line.tone && `is-${line.tone}`,
                line.groupEnd && 'is-group-end',
              )}
              style={{ animationDelay: `${420 + i * 130}ms` }}
            >
              {line.lead ? (
                <em className={cn('yx-col-badge', line.tone === 'lead' ? 'is-tag' : 'is-step')}>
                  {line.lead}
                </em>
              ) : null}
              <span className="yx-col-text">{renderLine(line.text)}</span>
              {line.tone === 'end' ? <i className="yx-col-dot" aria-hidden /> : null}
            </span>
          ))}
        </div>
        <p className="yx-couplet yx-couplet-upper brush" style={{ animationDelay: '1400ms' }}>
          {COUPLET.upper}
        </p>
      </div>
      <p className="yx-motto" aria-label="剑心通明">
        <span aria-hidden />
        <b className="brush">剑心通明</b>
        <span aria-hidden />
      </p>
      <div className="yx-rules">
        <p className="yx-rules-title kai">剑修四要</p>
        <ul>
          {RULES.map((rule, i) => (
            <li
              key={rule.char}
              className="yx-rule"
              style={{ animationDelay: `${1300 + i * 110}ms` }}
            >
              <b className="brush">{rule.char}</b>
              <span className="kai">
                {rule.lines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <div className="yx-bonus" style={{ animationDelay: '1740ms' }}>
          <em className="kai">{BONUS.tag}</em>
          <b className="brush">{BONUS.char}</b>
          <span className="kai">{BONUS.text}</span>
        </div>
      </div>
      <div className="yx-decree-foot">
        <span className="yx-foot-rule" aria-hidden />
        <span className="yx-seal brush" aria-hidden>
          剑来
        </span>
        <span className="kai">
          望城<i aria-hidden>·</i>风起大泽篇
        </span>
        <span className="yx-foot-rule" aria-hidden />
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
  const [signedTrack, setSignedTrack] = useState<RecruitTrack>('watch')
  const [grade, setGrade] = useState('')
  const [track, setTrack] = useState<RecruitTrack | ''>('')
  const [hours, setHours] = useState('')
  const [csBase, setCsBase] = useState('')
  const [talents, setTalents] = useState<string[]>([])
  const watchOnly = WATCH_ONLY.has(grade)
  const timers = useRef<number[]>([])
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = document.title
    document.title = '剑修二期招募 · 剑来科技'
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
    const picked: RecruitTrack = watchOnly ? 'watch' : track || 'watch'
    if (!grade || !hours || !csBase || (!watchOnly && !track)) {
      setError(!grade ? '先选年级' : !watchOnly && !track ? '选一条路：观摩学习还是驻场接活' : !hours ? '选一下每周能拿出的时间' : '选一下计算机基础')
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await submitRecruit({
        name: text('name'),
        school: text('school') || undefined,
        major: text('major'),
        grade,
        track: picked,
        weekly_hours: hours,
        cs_base: csBase,
        talents,
        strengths: text('strengths') || undefined,
        phone: text('phone'),
        wechat: text('wechat') || undefined,
        source: '英雄帖·二期',
      })
      setSignedName(text('name'))
      setSignedTrack(res.track)
      formEl.reset()
      setGrade('')
      setTrack('')
      setHours('')
      setCsBase('')
      setTalents([])
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
            {signedTrack === 'work'
              ? '道长会一张张看。合适的话打电话或加微信约你聊聊，再派件小活试试手。'
              : '已记下你观摩学习的意向。项目开讲、现场开放时，道长会拉你进来一起看。'}
          </p>
          <button type="button" className="yx-link kai" onClick={() => setPhase('open')}>
            替同学再写一张
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className={cn('yx-form', phase === 'pressing' && 'pointer-events-none')} inert={!formLive}>
          <div className="yx-form-head">
            <div className="yx-form-title-wrap">
              <span className="yx-form-stamp kai">立状</span>
              <h1 className="brush">投名状</h1>
            </div>
            <span className="yx-form-sub kai">四问 · 照实手书 · 阅毕画押</span>
          </div>

          <fieldset>
            <legend>
              <span className="yx-q-badge brush">一问</span>
              <span className="yx-q-title">你是谁</span>
              <span className="yx-q-rule" aria-hidden />
            </legend>
            <div className="yx-grid yx-grid-3">
              <label>
                <span>姓名</span>
                <input required name="name" maxLength={20} autoComplete="name" placeholder="你的姓名" />
              </label>
              <label>
                <span>
                  学院 <em>选填</em>
                </span>
                <input name="school" maxLength={60} placeholder="如 计算机学院" />
              </label>
              <label>
                <span>专业</span>
                <input required name="major" maxLength={40} placeholder="什么专业都行" />
              </label>
            </div>
            <div className="yx-field">
              <span className="yx-field-label">年级</span>
              <div className="yx-chips yx-chips-grade" role="radiogroup" aria-label="年级">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={grade === g}
                    className={cn('yx-chip', grade === g && 'is-on')}
                    onClick={() => {
                      setGrade(g)
                      if (WATCH_ONLY.has(g)) setTrack('watch')
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <span className="yx-q-badge brush">二问</span>
              <span className="yx-q-title">走哪条路</span>
              <span className="yx-q-rule" aria-hidden />
            </legend>
            <div className="yx-tracks" role="radiogroup" aria-label="走哪条路">
              {TRACKS.map((t) => {
                const locked = t.key === 'work' && watchOnly
                const on = (watchOnly ? 'watch' : track) === t.key
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={locked}
                    className={cn('yx-track', on && 'is-on')}
                    onClick={() => setTrack(t.key)}
                  >
                    <div className="yx-track-top">
                      <b className="brush">{t.title}</b>
                      <em className="kai">{t.badge}</em>
                    </div>
                    <span>{locked ? '大三起开放，先观摩攒底子' : t.hint}</span>
                  </button>
                )
              })}
            </div>
            <div className="yx-field">
              <span className="yx-field-label">每周能拿出</span>
              <div className="yx-chips" role="radiogroup" aria-label="每周能拿出的时间">
                {WEEKLY_HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    role="radio"
                    aria-checked={hours === h}
                    className={cn('yx-chip', hours === h && 'is-on')}
                    onClick={() => setHours(h)}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <span className="yx-q-badge brush">三问</span>
              <span className="yx-q-title">你的底子</span>
              <span className="yx-q-rule" aria-hidden />
            </legend>
            <div className="yx-field">
              <span className="yx-field-label">计算机基础</span>
              <div className="yx-chips" role="radiogroup" aria-label="计算机基础">
                {CS_BASES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={csBase === c}
                    className={cn('yx-chip', csBase === c && 'is-on')}
                    onClick={() => setCsBase(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="yx-field">
              <span className="yx-field-label">
                一技之长 <em>可多选</em>
              </span>
              <div className="yx-chips" aria-label="一技之长">
                {TALENTS.map((t) => {
                  const on = talents.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={on}
                      className={cn('yx-chip', on && 'is-on')}
                      onClick={() => setTalents((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]))}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <span className="yx-q-badge brush">四问</span>
              <span className="yx-q-title">说说你自己</span>
              <span className="yx-q-rule" aria-hidden />
            </legend>
            <div className="yx-ask-card">
              <p className="yx-ask kai">写得越具体，道长越知道该带你做什么（挑几条写即可）：</p>
              <ul className="yx-ask-list kai">
                <li>做过的项目、作品、比赛或奖项</li>
                <li>用 AI 做成过什么，怎么跨过卡点的</li>
                <li>所选的一技之长练到了什么程度</li>
                <li>为什么想来，想在剑来收获什么</li>
              </ul>
            </div>
            <div className="yx-paper-pad">
              <textarea
                name="strengths"
                rows={5}
                maxLength={800}
                aria-label="说说你自己"
                placeholder="比如：大三，校队主力。用 AI 帮社团做过报名小程序……"
              />
            </div>
          </fieldset>

          <div className="yx-sign">
            <div className="yx-sign-fields">
              <p className="yx-sign-head kai">
                <span>立状人联络</span>
                <em>仅道长可见 · 约聊之用</em>
              </p>
              <div className="yx-sign-inputs">
                <label>
                  <span>手机号</span>
                  <input
                    required
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="1[0-9]{10}"
                    maxLength={11}
                    autoComplete="tel"
                    placeholder="11 位常用手机"
                    title="11 位手机号"
                  />
                </label>
                <label>
                  <span>
                    微信号 <em>选填</em>
                  </span>
                  <input name="wechat" maxLength={40} placeholder="方便加你好友" />
                </label>
              </div>
            </div>
            <button type="submit" className="yx-press" disabled={sending || phase === 'pressing'} aria-label="按指印，递上投名状">
              {phase === 'pressing' ? (
                <Thumbprint className="yx-thumb-press" />
              ) : (
                <>
                  <Thumbprint className="yx-thumb-ghost" />
                  <span className="brush">{sending ? '递帖中' : '画押'}</span>
                  <small className="kai">按印递帖</small>
                </>
              )}
            </button>
          </div>
          {error ? (
            <p role="alert" className="yx-error kai">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </div>
  )

  return (
    <div className="yx-stage">
      <header className="yx-top">
        <a href="/" className="yx-brand" aria-label="剑来科技首页">
          <span className="brush">剑来科技</span>
        </a>
        <span className="yx-top-rule" aria-hidden />
        <h2 className="yx-top-title kai">
          剑修<b>二期</b>招募
        </h2>
        <span className="yx-top-rule" aria-hidden />
        <span className="yx-top-note kai">中南在校生</span>
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

    </div>
  )
}
