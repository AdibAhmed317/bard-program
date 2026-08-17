import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Check, RotateCcw, X } from 'lucide-react'

import { TRAINING_DAYS, clearAttendance, listAttendance, markAttendance } from '#/lib/admin-api'
import { requireAdminRoute } from '#/lib/session'
import { AdminShell } from '#/components/admin/shell'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'

export const Route = createFileRoute('/admin/attendance')({
  beforeLoad: requireAdminRoute,
  loaderDeps: ({ search }) => ({ day: search.day }),
  loader: ({ deps }) => listAttendance({ data: { day: deps.day ?? TRAINING_DAYS[0].value } }),
  validateSearch: (search: Record<string, unknown>) => ({
    day: typeof search.day === 'string' ? search.day : undefined,
  }),
  component: AdminAttendance,
})

function AdminAttendance() {
  const rows = Route.useLoaderData()
  const { day } = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const activeDay = day ?? TRAINING_DAYS[0].value
  const [pending, setPending] = useState<number | null>(null)

  async function setStatus(participantId: number, status: 'present' | 'absent') {
    setPending(participantId)
    await markAttendance({ data: { participantId, day: activeDay, status } })
    await router.invalidate()
    setPending(null)
  }

  async function clearStatus(participantId: number) {
    setPending(participantId)
    await clearAttendance({ data: { participantId, day: activeDay } })
    await router.invalidate()
    setPending(null)
  }

  const presentCount = rows.filter((r) => r.status === 'present').length

  return (
    <AdminShell title="Attendance">
      <div className="flex flex-wrap gap-3">
        {TRAINING_DAYS.map((d) => (
          <button
            key={d.value}
            type="button"
            className={`btn ${activeDay === d.value ? 'btn-forest' : 'btn-outline-forest'}`}
            onClick={() => void navigate({ search: { day: d.value } })}
          >
            {d.label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-[var(--charcoal-500)]">
        {presentCount} / {rows.length} marked present
      </p>

      <div className="card mt-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SL</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Mark</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.participantId}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-semibold whitespace-normal text-[var(--charcoal-900)]">{r.name}</TableCell>
                <TableCell>{r.department || '—'}</TableCell>
                <TableCell>{r.roomNumber || '—'}</TableCell>
                <TableCell>
                  <span className={`pill ${r.status === 'present' ? 'pill-present' : r.status === 'absent' ? 'pill-absent' : 'pill-neutral'}`}>
                    {r.status ?? 'Not marked'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={pending === r.participantId}
                      aria-label={`Mark ${r.name} present`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--hairline)] text-[var(--forest-800)] hover:bg-[var(--forest-100)] disabled:opacity-40"
                      onClick={() => setStatus(r.participantId, 'present')}
                    >
                      <Check className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      disabled={pending === r.participantId}
                      aria-label={`Mark ${r.name} absent`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--hairline)] text-[var(--crimson-600)] hover:bg-[#fbebec] disabled:opacity-40"
                      onClick={() => setStatus(r.participantId, 'absent')}
                    >
                      <X className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      disabled={pending === r.participantId || r.status == null}
                      aria-label={`Reset ${r.name} to not marked`}
                      title="Reset to not marked"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--hairline)] text-[var(--charcoal-500)] hover:bg-[var(--ivory-100)] disabled:opacity-40"
                      onClick={() => clearStatus(r.participantId)}
                    >
                      <RotateCcw className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-[var(--charcoal-500)]">
                  No participants to mark yet — add participants first.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  )
}
