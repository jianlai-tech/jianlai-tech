import { Link } from '@tanstack/react-router'
import { InkCliff, InkMountains } from '@/components/Accents'
import { ComparisonTable } from '@/components/ComparisonTable'
import { NineFormsBook } from '@/components/NineFormsBook'

export function HomePage() {
  return (
    <main>
      <section className="relative mx-auto max-w-[1280px] lg:h-[576px]" aria-label="剑来">
        <div className="px-5 pt-8 sm:px-[54px] lg:pt-[72px]">
          <h1 className="brush text-[#0c0b09] [-webkit-text-stroke:1.2px_#0c0b09]">
            <span className="flex items-center gap-3 whitespace-nowrap text-[58px] leading-none tracking-[-0.14em] sm:text-[104px] lg:text-[128px]">
              唯此一剑，
            </span>
            <span className="mt-3 block whitespace-nowrap text-[40px] leading-none tracking-[0.01em] sm:text-[72px] lg:mt-6 lg:text-[80px]">
              斩尽天下不平事。
            </span>
          </h1>
          <div className="mt-7 max-w-[500px] lg:ml-3 lg:mt-[48px]">
            <p className="text-[19px] font-semibold leading-[1.6] text-[#0e0b08] sm:text-[23px]">
              为国铸剑，剑到人到。
            </p>
            <p className="mt-3 text-[17px] leading-[1.85] text-ink/80 sm:text-[18px]">
              驻场的人进你公司，把卡住的地方一剑一剑斩开。
              <span className="kai text-cinnabar">不交方案，交一套你们天天在用的系统。</span>
            </p>
          </div>
        </div>

        <figure className="relative mt-10 lg:absolute lg:right-0 lg:top-0 lg:mt-0 lg:h-[576px] lg:w-1/2">
          <picture>
            <source srcSet="/art/slash-art.webp" type="image/webp" />
            <img
              src="/art/slash-art.png"
              alt="白描：穿短袍的人挥出直剑，劈开表格、锁和一叠名片"
              width={1024}
              height={1024}
              className="plate-ink block h-full w-full object-cover"
            />
          </picture>
          <figcaption>
            <span className="sr-only">图注：表格并成一套口径；系统之间的锁打通；这一剑是会自己进化的数字员工，替人值班，越干越懂行。</span>
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
                { k: '这一剑 · 数字员工', v: '替人值班，越干越懂行', x: 330, y: 846, path: 'M 340 806 C 340 740, 334 690, 322 618', dot: [320, 606] },
              ].map((n) => (
                <g key={n.k}>
                  <path d={n.path} fill="none" stroke="#1c1a17" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="5 6" strokeLinecap="round" />
                  <circle cx={n.dot[0]} cy={n.dot[1]} r="11" fill="none" stroke="#a8322a" strokeWidth="2.6" strokeOpacity="0.85" />
                  <text x={n.x} y={n.y} className="kai">
                    <tspan fill="#a8322a">{n.k}</tspan>
                    <tspan x={n.x} dy="1.35em" fill="#1c1a17" fillOpacity="0.82">
                      {n.v}
                    </tspan>
                  </text>
                </g>
              ))}
            </svg>
          </figcaption>
        </figure>

      </section>

      <section className="mx-auto mt-14 max-w-[1280px] px-5 sm:px-[54px] lg:mt-20" aria-labelledby="forms-title">
        <div className="mx-auto max-w-[1100px]">
          <h2 id="forms-title" className="sr-only">
            剑来九式
          </h2>
          <NineFormsBook />
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
