import { Outlet, RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { SiteShell } from '@/components/SiteShell'
import { CasePage } from '@/pages/CasePage'
import { HomePage } from '@/pages/HomePage'
import { JoinPage } from '@/pages/JoinPage'
import { PeoplePage } from '@/pages/PeoplePage'
import { StartPage } from '@/pages/StartPage'
import { WorkPage } from '@/pages/WorkPage'

const rootRoute = createRootRoute({
  component: Outlet,
})

/** 官网框架：顶栏 + 页脚。英雄帖是独立帖子页，不挂在这下面 */
const siteRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'site',
  component: SiteShell,
})

const indexRoute = createRoute({
  getParentRoute: () => siteRoute,
  path: '/',
  component: HomePage,
})

const workRoute = createRoute({
  getParentRoute: () => siteRoute,
  path: '/work',
  component: WorkPage,
})

const caseRoute = createRoute({
  getParentRoute: () => siteRoute,
  path: '/work/$slug',
  component: CasePage,
})

const peopleRoute = createRoute({
  getParentRoute: () => siteRoute,
  path: '/people',
  component: PeoplePage,
})

const startRoute = createRoute({
  getParentRoute: () => siteRoute,
  path: '/start',
  component: StartPage,
  validateSearch: (search: Record<string, unknown>): { kind?: 'project' | 'referral' } =>
    search.kind === 'referral' ? { kind: 'referral' } : {},
})

const joinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/join',
  component: JoinPage,
})

const routeTree = rootRoute.addChildren([
  siteRoute.addChildren([indexRoute, workRoute, caseRoute, peopleRoute, startRoute]),
  joinRoute,
])

const router = createRouter({
  routeTree,
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
