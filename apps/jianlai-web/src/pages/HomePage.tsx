import { Link } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { InkCliff, InkMountains } from '@/components/Accents'
import { ComparisonTable } from '@/components/ComparisonTable'
import { NineFormsBook } from '@/components/NineFormsBook'
import { Seal } from '@/components/Seal'
import { FORMS, ORDINALS } from '@/content/forms'

export function HomePage() {
  const [bookPage, setBookPage] = useState(0)
  const formsRef = useRef<HTMLElement>(null)

  // 首屏九式条：点哪式，剑谱翻到那一页再滚过去
  function openForm(index: number) {
    setBookPage(index + 2)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    formsRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <main>
      <section className="relative mx-auto max-w-[1280px] lg:h-[724px]" aria-label="剑来">
        <div className="relative z-10 px-5 pt-8 sm:px-[54px] lg:w-[56%] lg:pt-[52px]">
          <h1 className="brush text-[#0c0b09] [-webkit-text-stroke:1.2px_#0c0b09]">
            <span className="hero-write block whitespace-nowrap text-[58px] leading-none tracking-[-0.04em] sm:text-[104px] lg:text-[118px]">
              唯此一剑，
            </span>
            {/* 落款：第二行写完，印钤在句末 */}
            <span className="mt-3 flex items-end gap-3 whitespace-nowrap text-[40px] leading-none tracking-[0.01em] sm:gap-4 sm:text-[72px] lg:mt-5 lg:text-[76px]">
              <span className="hero-write [animation-delay:380ms]">斩尽天下不平事。</span>
              <span className="hero-seal mb-1 inline-block w-[24px] -rotate-6 sm:w-[34px]">
                <Seal chars="剑来" size={34} className="h-auto w-full" />
              </span>
            </span>
          </h1>
          <div className="hero-rise mt-7 max-w-[30em] lg:ml-2 lg:mt-9">
            <p className="text-[19px] font-semibold leading-[1.6] text-[#0e0b08] sm:text-[22px]">
              企业 AI 落地，<span className="title-swash">剑到人到</span>。
            </p>
            <p className="mt-3 text-[17px] leading-[1.85] text-ink/80 sm:text-[18px]">
              驻场的人进你公司，把系统打通、把智能体做进日常，一处一处斩开卡点。不交方案，只认指标：
            </p>
            {/* 三条指标：楷体短句，朱点起头，读起来像剑谱上的要诀 */}
            <ul className="kai mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[17px] text-ink sm:text-[18px]">
              {['成本降下来', '效率提上去', '长出新业务'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span aria-hidden className="h-[7px] w-[7px] rotate-45 bg-cinnabar" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link to="/start" className="ink-btn ink-btn-framed no-underline">
                企业喊一声，剑来
              </Link>
              <Link to="/work" className="ink-link text-[17px]">
                看看做过的案例
              </Link>
            </div>
          </div>
        </div>

        <figure className="relative mt-10 lg:absolute lg:right-0 lg:top-0 lg:mt-0 lg:h-[566px] lg:w-[48%]">
          <picture>
            <source srcSet="/art/slash-art.webp" type="image/webp" />
            <img
              src="/art/slash-art.png"
              alt="白描：穿短袍的人挥出直剑，劈开表格、锁和一叠名片"
              width={1024}
              height={1024}
              className="plate-ink hero-slash block h-full w-full object-cover"
            />
          </picture>
          <figcaption>
            <span className="sr-only">图注：表格并成一套口径；系统之间的锁打通；数字员工会自己迭代，补上财务、经营分析这类企业缺的专业人手，AI 给建议，人来判断和执行。</span>
            {/* 批注跟着画走：坐标是原图 1024 方格，slice 和 object-cover 裁法一致 */}
            <svg
              aria-hidden
              viewBox="0 0 1024 1024"
              preserveAspectRatio="xMidYMid slice"
              className="slash-notes pointer-events-none absolute inset-0 h-full w-full"
            >
              {[
                { k: '散在各处的表格', v: '并成一套口径', x: 44, y: 196, path: 'M 120 236 C 118 300, 132 360, 150 420', dot: [152, 432] },
                { k: '系统之间的锁', v: 'OA、CRM、ERP 打通', x: 330, y: 214, path: 'M 340 254 C 330 300, 312 340, 300 392', dot: [298, 404] },
                { k: '数字员工', v: ['补财务、经营分析的专业缺口', 'AI 给建议，人判断、执行', '能自己迭代，越用越懂行'], x: 330, y: 846, path: 'M 340 806 C 340 740, 334 690, 322 618', dot: [320, 606] },
              ].map((n, i) => (
                <g key={n.k} className="hero-note" style={{ animationDelay: `${1300 + i * 220}ms` }}>
                  <path d={n.path} fill="none" stroke="#1c1a17" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="5 6" strokeLinecap="round" />
                  <circle cx={n.dot[0]} cy={n.dot[1]} r="11" fill="none" stroke="#a8322a" strokeWidth="2.6" strokeOpacity="0.85" />
                  <text x={n.x} y={n.y} className="kai">
                    <tspan fill="#a8322a">{n.k}</tspan>
                    {(Array.isArray(n.v) ? n.v : [n.v]).map((line) => (
                      <tspan key={line} x={n.x} dy="1.35em" fill="#1c1a17" fillOpacity="0.82">
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              ))}
            </svg>
          </figcaption>
        </figure>

        <nav
          aria-label="剑来九式"
          className="relative z-10 mx-5 mt-8 border-y-2 border-ink sm:mx-[54px] lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0"
        >
          <ol className="grid grid-cols-3 gap-px bg-ink/20 lg:grid-cols-9">
            {FORMS.map((form, index) => (
              <li key={form.name}>
                <button
                  type="button"
                  onClick={() => openForm(index)}
                  className="form-tab group flex w-full flex-col items-center gap-1 bg-[#eddec4] px-1 pb-4 pt-3 transition-colors hover:bg-[#e8d8bb] lg:pb-[18px] lg:pt-3.5"
                >
                  <span className="kai text-[12px] tracking-[0.2em] text-ink/50">第{ORDINALS[index]}式</span>
                  <span className="brush text-[26px] leading-none transition-colors group-hover:text-cinnabar lg:text-[28px]">
                    {form.name}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </section>

      <section
        ref={formsRef}
        className="mx-auto mt-14 max-w-[1280px] scroll-mt-6 px-5 sm:px-[54px] lg:mt-20"
        aria-labelledby="forms-title"
      >
        <div className="mx-auto max-w-[1100px]">
          <h2 id="forms-title" className="sr-only">
            剑来九式
          </h2>
          <NineFormsBook page={bookPage} onPageChange={setBookPage} />
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1280px] px-5 sm:px-[54px] lg:mt-28" aria-labelledby="compare-title">
        <div className="mx-auto max-w-[1100px]">
          <ComparisonTable />
        </div>
      </section>

      <section className="relative mx-auto mt-24 max-w-[1280px] overflow-hidden px-5 pb-24 sm:px-[54px] sm:pb-52 lg:mt-32">
        <InkMountains className="absolute inset-x-0 bottom-0 w-full opacity-25" />
        {/* 崖上一人负剑，衣带往左飘：剑已在路上 */}
        <InkCliff className="absolute bottom-6 right-[-6%] w-[78%] opacity-20 sm:bottom-10 sm:w-[58%] lg:right-[2%] lg:w-[46%] lg:opacity-60" />

        <div className="relative mx-auto max-w-[1100px] text-center lg:text-left">
          <div className="lg:flex lg:items-stretch lg:gap-6">
            <span aria-hidden className="hidden w-[3px] shrink-0 bg-cinnabar/70 lg:block" />
            <p className="mx-auto max-w-[20em] text-[19px] leading-[1.9] text-ink/75 sm:text-[21px] lg:mx-0">
              不平事，不在远方。
              <br />
              在每天重录的那张单里，在月底对不上的那笔账里。
            </p>
          </div>
          <p className="brush mt-8 text-[60px] leading-[1.05] sm:text-[96px] lg:-ml-2">
            喊一声，
            <br className="hidden lg:block" />
            剑来。
          </p>
          <div className="mt-10 flex flex-col items-center gap-5 lg:flex-row lg:items-center lg:gap-7">
            <Link to="/start" className="ink-btn ink-btn-framed no-underline">
              留个联系方式
            </Link>
            <p className="kai max-w-[22em] text-[15px] leading-[1.8] text-ink/60 [text-shadow:0_0_8px_#efe6d2,0_0_2px_#efe6d2]">
              说说你公司哪里卡住了，一般一个工作日内回你。
              <br />
              身边朋友的公司需要？
              <Link to="/start" search={{ kind: 'referral' }} className="ink-link ml-1">
                帮朋友引荐
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
