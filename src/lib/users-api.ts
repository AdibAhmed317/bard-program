import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import { auth } from '#/lib/auth'
import { requireAdminHandler } from '#/lib/session'

export const listAdminUsers = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdminHandler()
  const result = await auth.api.listUsers({
    query: { limit: 200, sortBy: 'createdAt', sortDirection: 'desc' },
    headers: getRequest().headers,
  })
  return result.users.map((u) => ({
    id: u.id,
    name: u.name,
    username: (u as typeof u & { username?: string | null }).username ?? null,
    role: u.role ?? 'user',
    createdAt: u.createdAt,
  }))
})

export const createAdminUser = createServerFn({ method: 'POST' })
  .validator((input: { username: string; password: string; name?: string }) => input)
  .handler(async ({ data }) => {
    await requireAdminHandler()
    const username = data.username.trim().toLowerCase()
    const result = await auth.api.createUser({
      body: {
        email: `${username}@admin.local`,
        password: data.password,
        name: data.name?.trim() || username,
        role: 'admin',
        data: { username, displayUsername: username },
      },
      headers: getRequest().headers,
    })
    return { id: result.user.id }
  })

export const deleteAdminUser = createServerFn({ method: 'POST' })
  .validator((input: { userId: string }) => input)
  .handler(async ({ data }) => {
    await requireAdminHandler()
    await auth.api.removeUser({ body: { userId: data.userId }, headers: getRequest().headers })
  })
