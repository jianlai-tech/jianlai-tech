import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/cn'
import { CollectorSeals } from '@/components/CollectorSeals'
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
      <header className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-6">
        <Link to="/" aria-label="剑来科技 · 回首页" className="flex shrink-0 items-center gap-2.5 no-underline">
          <Seal chars="剑来" size={22} className="-rotate-2" />
          <span className="brush hidden text-[30px] leading-none text-ink sm:inline">剑来</span>
        </Link>
        <nav aria-label="主导航" className="flex items-center gap-5 text-[16px] sm:gap-12 sm:text-[19px]">
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
            className="whitespace-nowrap rounded-sm border border-ink/35 px-3 py-1 text-[15px] text-ink/80 no-underline transition-colors hover:border-ink hover:text-ink sm:text-[16px]"
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

        <div className="relative -mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 sm:-mt-10">
          <CollectorSeals />
          <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <a href="/dashboard/" className="text-ink/65 no-underline hover:text-ink">
              同门 / 合作企业登录
            </a>
            <span>长沙市望城区剑来科技有限责任公司</span>
          </span>
        </div>
      </footer>
    </div>
  )
}
