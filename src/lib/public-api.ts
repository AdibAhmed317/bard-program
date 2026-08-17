import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { attendance, participants, rooms } from '#/db/schema'
import { TRAINING_DAYS } from '#/lib/admin-api'

type LookupResult =
  | { found: false }
  | {
      found: true
      name: string
      designation: string | null
      department: string | null
      roomNumber: string | null
      attendance: { day: string; label: string; status: 'present' | 'absent' | null }[]
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
        designation: participants.designation,
        department: participants.department,
        phone: participants.phone,
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

    const [room] = row.roomId
      ? await db.select({ roomNumber: rooms.roomNumber }).from(rooms).where(eq(rooms.id, row.roomId)).limit(1)
      : []

    const attendanceRows = await db
      .select({ day: attendance.day, status: attendance.status })
      .from(attendance)
      .where(eq(attendance.participantId, row.id))

    return {
      found: true,
      name: row.name,
      designation: row.designation,
      department: row.department,
      roomNumber: room?.roomNumber ?? null,
      attendance: TRAINING_DAYS.map((d) => ({
        day: d.value,
        label: d.label,
        status: attendanceRows.find((a) => a.day === d.value)?.status ?? null,
      })),
    }
  })
