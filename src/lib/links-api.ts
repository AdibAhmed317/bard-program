import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'

import { db } from '#/db'
import { links } from '#/db/schema'
import { requireAdminHandler } from '#/lib/session'
import { assertSafeUrl } from '#/lib/safe-url'

export const listLinks = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdminHandler()
  return db.select().from(links).orderBy(asc(links.id))
})

export const createLink = createServerFn({ method: 'POST' })
  .validator((input: { label: string; url: string }) => input)
  .handler(async ({ data }) => {
    await requireAdminHandler()
    if (!data.label.trim()) throw new Error('A label is required.')
    await db.insert(links).values({ label: data.label.trim(), url: assertSafeUrl(data.url) })
  })

export const deleteLink = createServerFn({ method: 'POST' })
  .validator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdminHandler()
    await db.delete(links).where(eq(links.id, data.id))
  })
