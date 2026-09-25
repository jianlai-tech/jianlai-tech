import { Link } from '@tanstack/react-router'
import { DoodleArrow } from '@/components/DoodleArrow'
import { Mark } from '@/components/Mark'
import { TapePhoto } from '@/components/TapePhoto'

export function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-16">
      <section className="grid items-start gap-10 pt-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h1 className="font-mark text-6xl leading-[0.95] sm:text-7xl">剑来</h1>
          <p className="mt-6 max-w-[16ch] font-mark text-4xl leading-tight sm:text-5xl">
            派人驻进公司，把经营做成
            <Mark>能跑的系统</Mark>。
          </p>
          <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink/80">
            工作室。主理人接现场，驻场的人按档位进组。做过 K12 一对一家教、医疗器械批发分销、管材贸易。不卖标准软件，不交一叠方案。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link to="/start" className="zine-cta no-underline">
              留个联系方式
            </Link>
            <Link to="/work" className="zine-link">
              先看案例集
            </Link>
          </div>
        </div>

        <aside className="relative mt-2 border border-ink/15 bg-white/40 px-5 py-4">
          <span className="absolute -top-2 right-6 h-6 w-5 bg-blush/70 shadow-sm" />
          <p className="font-doodle text-lg">目录</p>
          <ul className="mt-3 space-y-3 font-doodle text-base">
            <li className="flex items-baseline justify-between gap-3 border-b border-dotted border-ink/25 pb-2">
              <Mark>家教</Mark>
              <Link to="/work/$slug" params={{ slug: 'k12-jiajiao' }} className="zine-link">
                试课到课酬
              </Link>
            </li>
            <li className="flex items-baseline justify-between gap-3 border-b border-dotted border-ink/25 pb-2">
              <Mark tone="pink">分销</Mark>
              <Link to="/work/$slug" params={{ slug: 'yiliao-fenxiao' }} className="zine-link">
                货仓账对齐
              </Link>
            </li>
            <li className="flex items-baseline justify-between gap-3 pb-1 text-ink/55">
              <span>管材</span>
              <span>故事还在收</span>
            </li>
          </ul>
        </aside>
      </section>

      <section className="mt-16 grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <TapePhoto
          src="/cases/jiajiao-trials.png"
          alt="家教试课台脱敏截图"
          caption="家教现场的试课台。人名糊掉，留下排课这一格。"
          tilt="left"
        />
        <div>
          <p className="font-mark text-4xl leading-tight">
            人走进去，
            <br />
            才看得见现场。
          </p>
          <p className="mt-4 max-w-prose leading-relaxed text-ink/80">
            案例集只写行业，不写客户名。图都标了示意，数字和名单已经糊掉。
          </p>
          <DoodleArrow className="mt-4 w-24" />
          <Link to="/work" className="zine-link mt-3 inline-block">
            翻开案例集
          </Link>
        </div>
      </section>
    </main>
  )
}
