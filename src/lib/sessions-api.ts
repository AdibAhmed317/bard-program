import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'

import { db } from '#/db'
import { sessionResources, sessions } from '#/db/schema'
import { requireAdminHandler } from '#/lib/session'

export const RESOURCE_KINDS = ['slide', 'file', 'link'] as const
export type ResourceKind = (typeof RESOURCE_KINDS)[number]

/**
 * These URLs are rendered as `href`s, so anything other than http(s) — most
 * importantly `javascript:` — must be rejected before it reaches the database.
 */
function assertSafeUrl(raw: string) {
  const trimmed = raw.trim()
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error('Enter a full link starting with http:// or https://')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http:// and https:// links are allowed.')
  }
  return parsed.toString()
}

export const listSessions = createServerFn({ method: 'GET' })
  .validator((input: { day: string }) => input)
  .handler(async ({ data }) => {
    await requireAdminHandler()
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.day, data.day))
      .orderBy(asc(sessions.startTime), asc(sessions.id))

    if (rows.length === 0) return []

    const resources = await db.select().from(sessionResources).orderBy(asc(sessionResources.id))
    return rows.map((s) => ({
      ...s,
      resources: resources.filter((r) => r.sessionId === s.id),
    }))
  })

export const createSession = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      day: string
      title: string
      startTime?: string
      endTime?: string
      place?: string
      speaker?: string
      moderator?: string
      notes?: string
    }) => input,
  )
  .handler(async ({ data }) => {
    await requireAdminHandler()
    if (!data.title.trim()) throw new Error('A session title is required.')
    await db.insert(sessions).values({ ...data, title: data.title.trim() })
  })

export const updateSession = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      id: number
      title?: string
      startTime?: string
      endTime?: string
      place?: string
      speaker?: string
      moderator?: string
      notes?: string
    }) => input,
  )
  .handler(async ({ data }) => {
    await requireAdminHandler()
    const { id, ...rest } = data
    await db.update(sessions).set(rest).where(eq(sessions.id, id))
  })

export const deleteSession = createServerFn({ method: 'POST' })
  .validator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdminHandler()
    // session_resources cascades on delete
    await db.delete(sessions).where(eq(sessions.id, data.id))
  })

export const addSessionResource = createServerFn({ method: 'POST' })
  .validator((input: { sessionId: number; kind: ResourceKind; label: string; url: string }) => input)
  .handler(async ({ data }) => {
    await requireAdminHandler()
    if (!data.label.trim()) throw new Error('A label is required.')
    const url = assertSafeUrl(data.url)
    await db.insert(sessionResources).values({
      sessionId: data.sessionId,
      kind: data.kind,
      label: data.label.trim(),
      url,
    })
  })

export const deleteSessionResource = createServerFn({ method: 'POST' })
  .validator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdminHandler()
    await db.delete(sessionResources).where(eq(sessionResources.id, data.id))
  })
