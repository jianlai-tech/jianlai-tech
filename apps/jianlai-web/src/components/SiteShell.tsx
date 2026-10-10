import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/cn'
import { InkRiver } from '@/components/Accents'
import { Seal } from '@/components/Seal'

const NAV = [
  { to: '/', label: '首页' },
  { to: '/work', label: '案例集' },
  { to: '/people', label: '剑修名册' },
] as const

/** 洒金笺对联条，竖写一联 */
function CoupletStrip({ text }: { text: string }) {
  return (
    <p
      className="brush vertical relative px-3 py-6 text-[30px] leading-none tracking-[0.32em] text-ink/85 shadow-[0_10px_18px_-14px_rgba(28,26,23,0.6)]"
      style={{
        backgroundColor: '#e4cfa9',
        backgroundImage: "url('/art/sajin.webp'), linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.04))",
        backgroundSize: '220px, 100%',
      }}
    >
      {text}
    </p>
  )
}

export function SiteShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <div className="paper">
      <div aria-hidden className="read-progress pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] origin-left scale-x-0 bg-cinnabar/80" />
      <header className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-6">
        {/* 落款式标识：印在前，名在后，一道细界行隔开题旨 */}
        <Link to="/" aria-label="剑来科技 · 企业 AI 落地，回首页" className="group flex shrink-0 items-center no-underline">
          <Seal chars="剑来" size={22} className="-rotate-3 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-0" />
          <span className="brush ml-2.5 text-[30px] leading-none text-ink sm:ml-3 sm:text-[36px]">剑来</span>
          <span aria-hidden className="ml-3 hidden h-7 w-px bg-ink/30 sm:block" />
          <span className="kai ml-3 hidden text-[14px] leading-none tracking-[0.06em] text-ink/60 sm:block">企业 AI 落地</span>
        </Link>
        <nav aria-label="主导航" className="flex items-center gap-3.5 text-[15px] sm:gap-12 sm:text-[19px]">
          {NAV.map((item) => {
            const active =
              pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to))
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'whitespace-nowrap pb-1 no-underline transition-colors',
                  active ? 'border-b-2 border-moss text-ink' : 'text-ink/75 hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            )
          })}
          <a
            href="/dashboard/"
            className="whitespace-nowrap rounded-sm border border-ink/35 px-2 py-1 text-[14px] sm:px-3 sm:text-[15px] text-ink/80 no-underline transition-colors hover:border-ink hover:text-ink sm:text-[16px]"
          >
            登录
          </a>
        </nav>
      </header>
      <Outlet />
      <footer className="relative mx-auto mt-16 max-w-[1280px] overflow-hidden px-5 pb-8 text-sm text-ink/65 sm:px-[54px]">
        <div className="brush-rule mx-auto w-[min(520px,78%)]" aria-hidden />

        <div className="mt-12 flex items-center justify-center gap-10 lg:gap-16">
          <span className="hidden md:block">
            <CoupletStrip text="他时剑履山河" />
          </span>

          {/* 牌记：古籍卷末刊记的样子，双边框里落款 */}
          <div className="guji-frame flex flex-col items-center bg-[#f2e7cf]/60 px-8 py-6 text-center sm:px-10">
            <Seal size={56} title="剑来科技" />
            <p className="brush mt-4 text-[30px] leading-none text-ink">剑来科技</p>
            <p className="kai mt-3 text-[14px] tracking-[0.3em] text-ink/60">望城 · 风起大泽</p>
            <p className="kai mt-3 text-[15px] leading-[1.9] tracking-[0.12em] text-ink/75 md:hidden">
              此日楼台鼎鼐
              <br />
              他时剑履山河
            </p>
          </div>

          <span className="hidden md:block">
            <CoupletStrip text="此日楼台鼎鼐" />
          </span>
        </div>

        {/* 江上一叶扁舟：接住 CTA 的远山，山之后是水 */}
        <InkRiver className="mx-auto mt-4 block w-full max-w-[1100px] opacity-55 md:-mt-4" />

        {/* 卷末：一道双界行，下面是去处和刊记 */}
        <div className="relative mt-2 border-t-2 border-ink/70 pt-[3px]">
          <div className="border-t border-ink/30" />
          <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-baseline sm:justify-between">
            <nav aria-label="页脚" className="kai flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-[15px]">
              {[
                { to: '/work', label: '案例集' },
                { to: '/people', label: '剑修名册' },
                { to: '/start', label: '企业喊一声' },
              ].map((item) => (
                <span key={item.to} className="flex items-center">
                  <Link to={item.to} className="px-2 text-ink/75 no-underline transition-colors hover:text-cinnabar">
                    {item.label}
                  </Link>
                  <span aria-hidden className="text-ink/30">·</span>
                </span>
              ))}
              <a href="/dashboard/" className="px-2 text-ink/75 no-underline transition-colors hover:text-cinnabar">
                同门 / 合作企业登录
              </a>
            </nav>
            <div className="flex items-baseline gap-5">
              <p className="kai text-[13px] tracking-[0.12em] text-ink/50">长沙市望城区剑来科技有限责任公司</p>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="kai text-[14px] text-ink/60 transition-colors hover:text-cinnabar"
              >
                回卷首 ↑
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
