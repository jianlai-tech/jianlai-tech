import { Navigate, RouterProvider, createRootRoute, createRoute, createRouter, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Shell } from '@/components/Shell'
import { useAuth } from '@/data/auth'
import { AccountsPage } from '@/pages/AccountsPage'
import { ClientHomePage } from '@/pages/ClientHomePage'
import { FinancePage } from '@/pages/FinancePage'
import { ForcePasswordPage } from '@/pages/ForcePasswordPage'
import { HrPage } from '@/pages/HrPage'
import { LoginPage } from '@/pages/LoginPage'
import { MePage } from '@/pages/MePage'
import { OverviewPage } from '@/pages/OverviewPage'
import { SalesPage } from '@/pages/SalesPage'

const ADMIN_PATHS = new Set(['/', '/sales', '/hr', '/finance', '/accounts'])

function homeFor(kind: string, isAdmin: boolean) {
  if (kind === 'client') return '/project'
  if (isAdmin) return '/'
  return '/me'
}

/** 登录闸：没登录给登录页。剑修非管理员只能待在档案；合作企业待在项目进度。 */
function Gate() {
  const { me, loading } = useAuth()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  if (loading) {
    return <div className="grid min-h-dvh place-items-center text-ink3">载入中…</div>
  }
  if (!me) return <LoginPage />
  if (me.account.kind !== 'staff' && me.account.must_change_password) return <ForcePasswordPage />

  const home = homeFor(me.account.kind, me.account.is_admin)
  if (!me.account.is_admin && ADMIN_PATHS.has(pathname)) {
    return <Navigate to={home} replace />
  }
  if (me.account.kind === 'staff' && pathname === '/project') {
    return <Navigate to={home} replace />
  }
  if (me.account.kind === 'client' && pathname !== '/project') {
    return <Navigate to="/project" replace />
  }
  return <Shell />
}

/** 内务四个模块和账号管理只给管理员；其他同门进来看自己的档案，企业看自己的项目 */
function AdminOnly({ children }: { children: ReactNode }) {
  const { me } = useAuth()
  if (!me?.account.is_admin) return <Navigate to={me?.account.kind === 'client' ? '/project' : '/me'} replace />
  return <>{children}</>
}

function StaffOnly({ children }: { children: ReactNode }) {
  const { me } = useAuth()
  if (me?.account.kind !== 'staff') return <Navigate to="/project" replace />
  return <>{children}</>
}

function ClientOnly({ children }: { children: ReactNode }) {
  const { me } = useAuth()
  if (me?.account.kind !== 'client') return <Navigate to="/" replace />
  return <>{children}</>
}

const rootRoute = createRootRoute({ component: Gate })

const admin = (Page: () => ReactNode) => () => (
  <AdminOnly>
    <Page />
  </AdminOnly>
)

const overviewRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: admin(OverviewPage) })
const salesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sales', component: admin(SalesPage) })
const hrRoute = createRoute({ getParentRoute: () => rootRoute, path: '/hr', component: admin(HrPage) })
const financeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/finance', component: admin(FinancePage) })
const accountsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/accounts', component: admin(AccountsPage) })
const meRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/me',
  component: () => (
    <StaffOnly>
      <MePage />
    </StaffOnly>
  ),
})
const projectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/project',
  component: () => (
    <ClientOnly>
      <ClientHomePage />
    </ClientOnly>
  ),
})

const routeTree = rootRoute.addChildren([
  overviewRoute,
  salesRoute,
  hrRoute,
  financeRoute,
  accountsRoute,
  meRoute,
  projectRoute,
])

const router = createRouter({
  routeTree,
  basepath: '/dashboard',
  trailingSlash: 'never',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function AppRouterProvider() {
  return <RouterProvider router={router} />
}
