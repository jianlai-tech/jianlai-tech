import { RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { HomePage } from '@/pages/HomePage'
import { StartPage } from '@/pages/StartPage'

const rootRoute = createRootRoute()

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const startRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/start',
  component: StartPage,
})

const routeTree = rootRoute.addChildren([indexRoute, startRoute])

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
