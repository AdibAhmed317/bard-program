import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'

import { db } from '#/db'
import { attendance, links, participants, rooms, sessionResources, sessions } from '#/db/schema'
import { TRAINING_DAYS } from '#/lib/admin-api'
import type { ResourceKind } from '#/lib/sessions-api'

type SessionResource = { id: number; kind: ResourceKind; label: string; url: string }

type ScheduleDay = {
  day: string
  label: string
  sessions: {
    id: number
    title: string
    startTime: string | null
    endTime: string | null
    place: string | null
    speaker: string | null
    moderator: string | null
    notes: string | null
    resources: SessionResource[]
  }[]
}

type LookupResult =
  | { found: false }
  | {
      found: true
      name: string
      idCardNo: string | null
      designation: string | null
      department: string | null
      phone: string | null
      email: string | null
      groupLeader: string | null
      roomNumber: string | null
      attendance: { day: string; label: string; status: 'present' | 'absent' | null }[]
      schedule: ScheduleDay[]
      links: { id: number; label: string; url: string }[]
    }

export const lookupParticipant = createServerFn({ method: 'POST' })
  .validator((input: { idCardNo: string; phone: string }) => input)
  .handler(async ({ data }): Promise<LookupResult> => {
    const idCardNo = data.idCardNo.trim()
    const inputDigits = data.phone.replace(/\D/g, '')
    if (!idCardNo || inputDigits.length < 6) return { found: false }

    const [row] = await db
      .select({
        id: participants.id,
        name: participants.name,
        idCardNo: participants.idCardNo,
        designation: participants.designation,
        department: participants.department,
        phone: participants.phone,
        email: participants.email,
        groupLeader: participants.groupLeader,
        roomId: participants.roomId,
      })
      .from(participants)
      .where(eq(participants.idCardNo, idCardNo))
      .limit(1)

    if (!row) return { found: false }

    // A participant's phone field can hold multiple comma-separated numbers
    // (e.g. "01860931204, 01615760051") — require an exact match against one
    // of them, not just a substring match against the field as a whole.
    const storedNumbers = (row.phone ?? '').split(',').map((p) => p.replace(/\D/g, ''))
    if (!storedNumbers.includes(inputDigits)) return { found: false }

    // Everything below is independent of the others — run concurrently.
    const [roomRows, attendanceRows, sessionRows, resourceRows, linkRows] = await Promise.all([
      row.roomId
        ? db.select({ roomNumber: rooms.roomNumber }).from(rooms).where(eq(rooms.id, row.roomId)).limit(1)
        : Promise.resolve([]),
      db
        .select({ day: attendance.day, status: attendance.status })
        .from(attendance)
        .where(eq(attendance.participantId, row.id)),
      db.select().from(sessions).orderBy(asc(sessions.startTime), asc(sessions.id)),
      db.select().from(sessionResources).orderBy(asc(sessionResources.id)),
      db.select({ id: links.id, label: links.label, url: links.url }).from(links).orderBy(asc(links.id)),
    ])

    return {
      found: true,
      name: row.name,
      idCardNo: row.idCardNo,
      designation: row.designation,
      department: row.department,
      phone: row.phone,
      email: row.email,
      groupLeader: row.groupLeader,
      roomNumber: roomRows[0]?.roomNumber ?? null,
      links: linkRows,
      attendance: TRAINING_DAYS.map((d) => ({
        day: d.value,
        label: d.label,
        status: attendanceRows.find((a) => a.day === d.value)?.status ?? null,
      })),
      schedule: TRAINING_DAYS.map((d) => ({
        day: d.value,
        label: d.label,
        sessions: sessionRows
          .filter((s) => s.day === d.value)
          .map((s) => ({
            id: s.id,
            title: s.title,
            startTime: s.startTime,
            endTime: s.endTime,
            place: s.place,
            speaker: s.speaker,
            moderator: s.moderator,
            notes: s.notes,
            resources: resourceRows
              .filter((r) => r.sessionId === s.id)
              .map((r) => ({ id: r.id, kind: r.kind, label: r.label, url: r.url })),
          })),
      })),
    }
  })
