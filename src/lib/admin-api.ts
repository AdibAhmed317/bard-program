import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'

import { db } from '#/db'
import { attendance, participants, rooms } from '#/db/schema'
import { requireAdminHandler } from '#/lib/session'

export const TRAINING_DAYS = [
  { value: '2026-08-20', label: '20 Aug · Day 1' },
  { value: '2026-08-21', label: '21 Aug · Day 2' },
] as const

/* --------------------------------- rooms ---------------------------------- */

export const listRooms = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdminHandler()
  const [allRooms, occupants] = await Promise.all([
    db.select().from(rooms).orderBy(rooms.roomNumber),
    db.select({ roomId: participants.roomId }).from(participants),
  ])
  return allRooms.map((room) => ({
    ...room,
    occupancy: occupants.filter((p) => p.roomId === room.id).length,
  }))
})

export const createRoom = createServerFn({ method: 'POST' })
  .validator((input: { roomNumber: string; block?: string; capacity: number; notes?: string }) => input)
  .handler(async ({ data }) => {
    await requireAdminHandler()
    await db.insert(rooms).values(data)
  })

export const deleteRoom = createServerFn({ method: 'POST' })
  .validator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdminHandler()
    await db.delete(rooms).where(eq(rooms.id, data.id))
  })

/* ------------------------------ participants ------------------------------- */

export const listParticipants = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdminHandler()
  return db
    .select({
      id: participants.id,
      name: participants.name,
      designation: participants.designation,
      department: participants.department,
      phone: participants.phone,
      email: participants.email,
      idCardNo: participants.idCardNo,
      groupLeader: participants.groupLeader,
      roomId: participants.roomId,
      roomNumber: rooms.roomNumber,
      notes: participants.notes,
    })
    .from(participants)
    .leftJoin(rooms, eq(participants.roomId, rooms.id))
    .orderBy(participants.department, participants.name)
})

export const createParticipant = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      name: string
      designation?: string
      department?: string
      phone?: string
      email?: string
      idCardNo?: string
      groupLeader?: string
    }) => input,
  )
  .handler(async ({ data }) => {
    await requireAdminHandler()
    await db.insert(participants).values(data)
  })

export const updateParticipant = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      id: number
      name?: string
      designation?: string
      department?: string
      phone?: string
      email?: string
      idCardNo?: string
      groupLeader?: string
      roomId?: number | null
      notes?: string
    }) => input,
  )
  .handler(async ({ data }) => {
    await requireAdminHandler()
    const { id, ...rest } = data
    await db.update(participants).set(rest).where(eq(participants.id, id))
  })

export const deleteParticipant = createServerFn({ method: 'POST' })
  .validator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdminHandler()
    await db.delete(participants).where(eq(participants.id, data.id))
  })

type ImportRow = {
  name: string
  designation?: string
  department?: string
  phone?: string
  email?: string
  idCardNo?: string
}

export const bulkImportParticipants = createServerFn({ method: 'POST' })
  .validator((input: { rows: ImportRow[] }) => input)
  .handler(async ({ data }) => {
    await requireAdminHandler()
    const existing = await db
      .select({ idCardNo: participants.idCardNo, email: participants.email })
      .from(participants)
    const existingIds = new Set(existing.map((e) => e.idCardNo).filter(Boolean))
    const existingEmails = new Set(existing.map((e) => e.email).filter(Boolean))

    const toInsert = data.rows.filter((r) => {
      if (r.idCardNo && existingIds.has(r.idCardNo)) return false
      if (r.email && existingEmails.has(r.email)) return false
      return true
    })

    if (toInsert.length > 0) {
      await db.insert(participants).values(toInsert)
    }

    return { inserted: toInsert.length, skipped: data.rows.length - toInsert.length }
  })

/* ------------------------------- attendance --------------------------------- */

export const listAttendance = createServerFn({ method: 'GET' })
  .validator((input: { day: string }) => input)
  .handler(async ({ data }) => {
    await requireAdminHandler()
    return db
      .select({
        participantId: participants.id,
        name: participants.name,
        department: participants.department,
        roomNumber: rooms.roomNumber,
        status: attendance.status,
      })
      .from(participants)
      .leftJoin(rooms, eq(participants.roomId, rooms.id))
      .leftJoin(attendance, and(eq(attendance.participantId, participants.id), eq(attendance.day, data.day)))
      .orderBy(participants.department, participants.name)
  })

export const markAttendance = createServerFn({ method: 'POST' })
  .validator((input: { participantId: number; day: string; status: 'present' | 'absent' }) => input)
  .handler(async ({ data }) => {
    const admin = await requireAdminHandler()
    await db
      .insert(attendance)
      .values({ participantId: data.participantId, day: data.day, status: data.status, markedById: admin.id })
      .onConflictDoUpdate({
        target: [attendance.participantId, attendance.day],
        set: { status: data.status, markedById: admin.id, markedAt: new Date() },
      })
  })

export const clearAttendance = createServerFn({ method: 'POST' })
  .validator((input: { participantId: number; day: string }) => input)
  .handler(async ({ data }) => {
    await requireAdminHandler()
    await db
      .delete(attendance)
      .where(and(eq(attendance.participantId, data.participantId), eq(attendance.day, data.day)))
  })
