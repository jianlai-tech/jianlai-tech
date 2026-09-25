import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/cn'

const NAV = [
  { to: '/', label: '首页' },
  { to: '/work', label: '案例集' },
  { to: '/people', label: '人' },
] as const

export function SiteShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <div className="zine-root">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <img
            src="/brand/mark-light.png"
            alt=""
            className="h-11 w-11 object-contain"
          />
          <span className="font-mark text-3xl leading-none">剑来</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'font-doodle text-base no-underline',
                pathname === item.to ||
                  (item.to === '/work' && pathname.startsWith('/work'))
                  ? 'underline decoration-mark decoration-4 underline-offset-4'
                  : 'text-ink/80 hover:text-ink',
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/start" className="zine-cta no-underline">
            留个联系方式
          </Link>
        </nav>
      </header>
      <Outlet />
      <footer className="mx-auto max-w-5xl px-5 pb-10 pt-6 font-doodle text-sm text-ink/55">
        剑来科技 · 驻场做经营系统 · 不写客户名
      </footer>
    </div>
  )
}
