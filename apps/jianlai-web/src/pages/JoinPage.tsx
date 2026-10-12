import { Link } from '@tanstack/react-router'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { PineBranch } from '@/components/Accents'
import { Seal } from '@/components/Seal'
import { getHttpErrorMessage } from '@/lib/http'
import { submitRecruit } from '@/lib/api/recruits'
import { cn } from '@/lib/cn'

/** 帖文三条：招谁、看什么、来了做什么 */
const TERMS: { head: string; body: string }[] = [
  {
    head: '招谁',
    body: '在读大学生，专业不限。学计算机的来，学中文、会计、设计、机械的也来。',
  },
  {
    head: '看什么',
    body: '看你对 AI 是不是真的上心。不看会多少，看你自己折腾过什么、卡在哪、怎么过去的。',
  },
  {
    head: '来了做什么',
    body: '跟着道长和师兄师姐进真实的企业现场，把散着的系统接通，把智能体做进人家每天的活里。边做边学，用 AI 干活。',
  },
]

export function JoinPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'err'>('idle')
  const [message, setMessage] = useState('')
  /** 揭榜动画：折 → 印 → 收下 */
  const [tie, setTie] = useState<'none' | 'fold' | 'stamp' | 'sent'>('none')
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
    timers.current.push(window.setTimeout(() => setTie('sent'), 1500))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const text = (key: string) => String(form.get(key) ?? '').trim()
    setStatus('sending')
    setMessage('')
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
        source: '官网',
      })
      setStatus('idle')
      formEl.reset()
      playTie()
    } catch (err) {
      setStatus('err')
      setMessage(getHttpErrorMessage(err, '没递上去，请稍后再试'))
    }
  }

  return (
    <main className="relative mx-auto max-w-[1280px] px-5 pb-10 sm:px-[54px]">
      <PineBranch className="pointer-events-none absolute right-[54px] top-0 hidden w-[280px] opacity-60 mix-blend-multiply xl:block" />
      <div className="relative grid gap-10 pt-8 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div>
          <p className="kai text-[17px] tracking-[0.2em] text-cinnabar">剑来扩招</p>
          <h1 className="brush mt-2 text-[64px] leading-[1.05] tracking-[-0.04em] [-webkit-text-stroke:1px_#1c1a17] sm:text-[96px]">
            英雄帖
          </h1>
          <p className="mt-6 max-w-[26em] text-[18px] leading-[1.85] text-ink/80">
            剑来不等现成的高手，从大学生开始铸剑。这一回多招几位剑修，下山进企业，斩那些让人白干、干错的流程。
          </p>

          <dl className="mt-8 max-w-[34em] border-t-2 border-ink/70 pt-[3px]">
            <div className="border-t border-ink/30" />
            {TERMS.map((term) => (
              <div
                key={term.head}
                className="grid grid-cols-[5.5rem_1fr] items-baseline gap-4 border-b border-ink/15 py-4"
              >
                <dt className="brush text-[28px] leading-none">{term.head}</dt>
                <dd className="text-[17px] leading-[1.8] text-ink/85">{term.body}</dd>
              </div>
            ))}
          </dl>

          <p className="kai mt-6 text-[15px] leading-[1.8] text-ink/60">
            想先看看剑修都是什么样的人？翻翻
            <Link to="/people" className="ink-link mx-1">
              剑修名册
            </Link>
            。
          </p>
        </div>

        <div className="relative">
          {tie === 'sent' ? (
            <div
              role="status"
              className="guji-leaf guji-frame flex min-h-[520px] flex-col items-center justify-center px-8 py-12 text-center"
            >
              <Seal chars="剑来" size={72} title="剑来科技" className="-rotate-6" />
              <p className="brush mt-8 text-[44px] leading-tight">帖子道长收下了</p>
              <p className="mt-4 max-w-[22em] text-[17px] leading-[1.8] text-ink/75">
                道长会一张张看。合适的话，会打电话或加微信约你聊一聊，再一起做件小事试试手。
              </p>
              <button
                type="button"
                onClick={() => setTie('none')}
                className="ink-link kai mt-8 text-[16px]"
              >
                替同学再揭一张
              </button>
            </div>
          ) : (
            <div
              className={cn('guji-leaf guji-frame relative', (tie === 'fold' || tie === 'stamp') && 'tie-fold [animation-fill-mode:forwards]')}
            >
              <div aria-hidden className="absolute -top-[2px] left-1/2 h-[6px] w-28 -translate-x-1/2 bg-cinnabar" />
              {tie === 'stamp' ? (
                <span className="tie-stamp absolute left-1/2 top-1/2 z-10">
                  <Seal chars="剑来" size={96} title="剑来科技" />
                </span>
              ) : null}

              <div className="border-b border-ink/30 px-6 py-5 sm:px-10">
                <p className="brush text-[30px] leading-none">揭榜</p>
                <p className="kai mt-2 text-[15px] text-ink/60">照实写，写你真做过的就好。</p>
              </div>

              <form className="px-6 py-7 sm:px-10" onSubmit={onSubmit}>
                <div className="grid gap-6 sm:grid-cols-[1fr_7rem]">
                  <label className="block text-[16px]">
                    姓名
                    <input required name="name" maxLength={20} autoComplete="name" className="field" />
                  </label>
                  <label className="block text-[16px]">
                    年纪
                    <input
                      required
                      name="age"
                      type="number"
                      inputMode="numeric"
                      min={14}
                      max={60}
                      placeholder="20"
                      className="field placeholder:text-ink/35"
                    />
                  </label>
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <label className="block text-[16px]">
                    专业
                    <input
                      required
                      name="major"
                      maxLength={40}
                      placeholder="比如：汉语言文学"
                      className="field placeholder:text-ink/35"
                    />
                  </label>
                  <label className="block text-[16px]">
                    学校和年级 <span className="kai text-[14px] text-ink/45">选填</span>
                    <input
                      name="school"
                      maxLength={60}
                      placeholder="比如：湖南大学 大二"
                      className="field placeholder:text-ink/35"
                    />
                  </label>
                </div>

                <label className="mt-6 block text-[16px]">
                  和 AI 打过的交道
                  <textarea
                    required
                    name="ai_story"
                    rows={4}
                    maxLength={1500}
                    placeholder="用过什么、拿它做成过什么、卡在哪又怎么过去的。课程作业、自己的小工具、帮家里或社团干的活都算。"
                    className="field resize-y leading-[1.8] placeholder:text-ink/35"
                  />
                </label>

                <label className="mt-6 block text-[16px]">
                  自己的特长
                  <textarea
                    required
                    name="strengths"
                    rows={3}
                    maxLength={800}
                    placeholder="写代码、画画、剪视频、写东西、跟人打交道、能熬能扛……什么都算。"
                    className="field resize-y leading-[1.8] placeholder:text-ink/35"
                  />
                </label>

                <div className="mt-6 grid gap-6 sm:grid-cols-2">
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
                  <label className="block text-[16px]">
                    微信号 <span className="kai text-[14px] text-ink/45">选填</span>
                    <input name="wechat" maxLength={40} className="field" />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending' || tie !== 'none'}
                  className="ink-btn mt-9 w-full sm:w-auto"
                >
                  {status === 'sending' ? '递帖中' : '揭榜下山'}
                </button>
                {status === 'err' ? (
                  <p role="alert" className="kai mt-4 text-[16px] text-cinnabar">
                    {message}
                  </p>
                ) : null}
                <p className="kai mt-6 text-[14px] text-ink/45">只有道长看得到，手机号只用来约聊，不外传。</p>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
