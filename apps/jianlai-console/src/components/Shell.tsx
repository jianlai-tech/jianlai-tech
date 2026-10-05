import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { BadgeCheck, Coins, FolderKanban, LogOut, ScrollText, Swords, UserRound, Users, type LucideIcon } from 'lucide-react'
import { asset, cn } from '@/lib/cn'
import { diffDays, fmtMDWeek, todayIso } from '@/lib/date'
import { person } from '@/data/studio'
import { useAuth } from '@/data/auth'
import { useStore } from '@/data/store'
import { Avatar } from '@/components/ui'

type NavTo = '/' | '/sales' | '/hr' | '/finance' | '/accounts' | '/me' | '/project'

type NavItem = {
  to: NavTo
  label: string
  hint: string
  icon: LucideIcon
}

const ADMIN_NAV: NavItem[] = [
  { to: '/', label: '总览', hint: '今日要办', icon: ScrollText },
  { to: '/sales', label: '销售', hint: '留资到派人', icon: Swords },
  { to: '/hr', label: '人事', hint: '名册与四维', icon: Users },
  { to: '/finance', label: '财务', hint: '流水与应收', icon: Coins },
  { to: '/accounts', label: '账号', hint: '开通与认证', icon: BadgeCheck },
  { to: '/me', label: '档案', hint: '我的', icon: UserRound },
]

const STAFF_NAV: NavItem[] = [{ to: '/me', label: '我的档案', hint: '个性化与认证', icon: UserRound }]

const CLIENT_NAV: NavItem[] = [{ to: '/project', label: '项目进度', hint: '驻场在做什么', icon: FolderKanban }]

function useBadges(): Partial<Record<NavTo, number>> {
  const { leads, receivables } = useStore()
  const today = todayIso()
  const toFollow = leads.filter(
    (lead) =>
      (lead.stage === 'new' || lead.stage === 'talked') &&
      lead.nextFollow !== null &&
      diffDays(lead.nextFollow, today) <= 0,
  ).length
  const overdue = receivables.filter((row) => !row.paidOn && diffDays(row.due, today) < 0).length
  return { '/sales': toFollow, '/finance': overdue }
}

function isActive(pathname: string, to: NavTo) {
  return to === '/' ? pathname === '/' : pathname.startsWith(to)
}

function Count({ n }: { n: number | undefined }) {
  if (!n || n <= 0) return null
  return (
    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-sm bg-cinnabar px-1 text-[12px] font-bold leading-none text-[#f5ecd9] tabular-nums">
      {n}
    </span>
  )
}

export function Shell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const badges = useBadges()
  const { me, signOut } = useAuth()
  if (!me) return null
  const account = me.account
  const NAV = account.kind === 'client' ? CLIENT_NAV : account.is_admin ? ADMIN_NAV : STAFF_NAV
  const roster = account.staff_slug ? person(account.staff_slug) : undefined
  const displayName = me.profile?.alias || account.name
  const roleLine =
    account.kind === 'client' ? account.company ?? '合作企业' : account.is_admin ? '主理人 · 管理员' : '驻场'

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      {/* 桌面：左侧模块轨 */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-rail text-paper lg:flex">
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-sm bg-paper">
            <img src={asset('/brand/jian-glyph.png')} alt="" className="ink-plate h-9 w-9 object-contain" />
          </span>
          <div className="min-w-0">
            <div className="title-serif text-[19px] leading-6 tracking-[0.12em]">剑来科技</div>
            <div className="kai text-[13px] text-[#bdb69f]">内务 · 不对外</div>
          </div>
        </div>

        <nav aria-label="模块" className="min-h-0 flex-1 overflow-y-auto px-3">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.to)
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-11 items-center gap-3 rounded-sm px-3 text-[15px] font-semibold no-underline transition-colors duration-150',
                      active
                        ? 'bg-paper text-ink'
                        : 'text-paper/85 hover:bg-railhi hover:text-paper',
                    )}
                  >
                    <Icon
                      aria-hidden
                      className={cn('h-[18px] w-[18px] shrink-0', active && 'text-cinnabar')}
                      strokeWidth={2}
                    />
                    <span>{item.label}</span>
                    <span
                      className={cn(
                        'kai text-[13px] font-normal',
                        active ? 'text-ink3' : 'text-[#bdb69f]',
                      )}
                    >
                      {item.hint}
                    </span>
                    <Count n={badges[item.to]} />
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-paper/15 px-4 py-4">
          {account.is_admin ? (
            <div className="mb-3 rounded-sm border border-paper/20 px-3 py-2 text-[13px] leading-5 text-[#d9d2bb]">
              销售、财务、现场分配是<strong className="font-bold text-paper">示意数据</strong>
              ，还没接库。账号、认证、项目是真的。
            </div>
          ) : null}
          <div className="flex items-center gap-3">
            {roster ? <Avatar person={roster} size={36} /> : null}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold">{displayName}</div>
              <div className="truncate text-[12px] text-[#bdb69f]">{roleLine}</div>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              title="退出登录"
              aria-label="退出登录"
              className="grid h-8 w-8 place-items-center rounded-sm text-paper/80 hover:bg-railhi hover:text-paper"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 手机：顶栏 + 底部模块条 */}
      <header className="sticky top-0 z-20 flex h-12 items-center justify-between bg-rail px-4 text-paper lg:hidden">
        <span className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-sm bg-paper">
            <img src={asset('/brand/jian-glyph.png')} alt="" className="ink-plate h-6 w-6 object-contain" />
          </span>
          <span className="title-serif text-[16px] tracking-[0.1em]">剑来 · 内务</span>
        </span>
        <span className="flex items-center gap-3 text-[13px] text-[#d9d2bb]">
          {fmtMDWeek(todayIso())}
          <button type="button" onClick={() => void signOut()} aria-label="退出登录" className="text-paper/80">
            <LogOut className="h-4 w-4" />
          </button>
        </span>
      </header>

      <main className="min-w-0 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7">
        <div className="mx-auto max-w-[1320px]">
          <Outlet />
        </div>
      </main>

      <nav
        aria-label="模块"
        className="fixed inset-x-0 bottom-0 z-20 grid border-t border-paper/15 bg-rail pb-[env(safe-area-inset-bottom)] text-paper lg:hidden"
        style={{ gridTemplateColumns: `repeat(${NAV.length}, minmax(0, 1fr))` }}
      >
        {NAV.map((item) => {
          const active = isActive(pathname, item.to)
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-14 flex-col items-center justify-center gap-0.5 text-[12px] font-semibold no-underline',
                active ? 'bg-paper text-ink' : 'text-paper/85',
              )}
            >
              <Icon
                aria-hidden
                className={cn('h-5 w-5', active && 'text-cinnabar')}
                strokeWidth={2}
              />
              {item.label}
              {(badges[item.to] ?? 0) > 0 ? (
                <span className="absolute right-[calc(50%-22px)] top-1.5 grid h-4 min-w-4 place-items-center rounded-sm bg-cinnabar px-1 text-[11px] font-bold leading-none text-[#f5ecd9]">
                  {badges[item.to]}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
