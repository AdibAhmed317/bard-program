import { createServerFn, createServerOnlyFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { redirect } from '@tanstack/react-router'

import { auth } from '#/lib/auth'

const getSessionUser = createServerOnlyFn(async () => {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  return session?.user ?? null
})

/** Isomorphic — safe to call from `beforeLoad` (runs on server during SSR, proxies to server on client nav). */
export const getAuthUser = createServerFn({ method: 'GET' }).handler(() => getSessionUser())

/** Use inside a route's `beforeLoad`. Redirects to the login screen when the visitor isn't a signed-in admin. */
export async function requireAdminRoute() {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') {
    throw redirect({ to: '/admin/login' })
  }
  return user
}

/** Use inside another server function's handler (already server-only) to authorize a write/read. */
export async function requireAdminHandler() {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return user
}
