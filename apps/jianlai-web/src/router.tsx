import { RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { SiteShell } from '@/components/SiteShell'
import { CasePage } from '@/pages/CasePage'
import { HomePage } from '@/pages/HomePage'
import { PeoplePage } from '@/pages/PeoplePage'
import { StartPage } from '@/pages/StartPage'
import { WorkPage } from '@/pages/WorkPage'

const rootRoute = createRootRoute({
  component: SiteShell,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const workRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/work',
  component: WorkPage,
})

const caseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/work/$slug',
  component: CasePage,
})

const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/people',
  component: PeoplePage,
})

const startRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/start',
  component: StartPage,
  validateSearch: (search: Record<string, unknown>): { kind?: 'project' | 'referral' } =>
    search.kind === 'referral' ? { kind: 'referral' } : {},
})

const routeTree = rootRoute.addChildren([indexRoute, workRoute, caseRoute, peopleRoute, startRoute])

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
