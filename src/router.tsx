import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { RouteError, RoutePending } from './components/route-status'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    // Hovering a nav link preloads the route; keeping that result fresh for a
    // short window makes the actual click instant instead of refetching from
    // scratch. Mutations call router.invalidate(), which ignores these windows
    // and always refetches, so edits still show up immediately.
    defaultPreloadStaleTime: 30_000,
    defaultStaleTime: 10_000,
    // Only show the pending UI if a load is genuinely slow, then hold it briefly
    // so it can't flash on and off.
    defaultPendingMs: 300,
    defaultPendingMinMs: 400,
    defaultPendingComponent: RoutePending,
    defaultErrorComponent: RouteError,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
