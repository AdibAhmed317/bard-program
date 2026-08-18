import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, Check, Download, Loader2, RotateCcw, X } from 'lucide-react'

import {
  TRAINING_DAYS,
  clearAttendance,
  listAllAttendance,
  listAttendance,
  markAttendance,
} from '#/lib/admin-api'
import { useAction } from '#/lib/use-action'
import { AdminSkeleton } from '#/components/admin/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'

export const Route = createFileRoute('/admin/_shell/attendance')({
  loaderDeps: ({ search }) => ({ day: search.day }),
  loader: ({ deps }) => listAttendance({ data: { day: deps.day ?? TRAINING_DAYS[0].value } }),
  validateSearch: (search: Record<string, unknown>) => ({
    day: typeof search.day === 'string' ? search.day : undefined,
  }),
  pendingComponent: AdminSkeleton,
  component: AdminAttendance,
})

type Status = 'present' | 'absent' | null

function AdminAttendance() {
  const rows = Route.useLoaderData()
  const { day } = Route.useSearch()
  const navigate = Route.useNavigate()
  const activeDay = day ?? TRAINING_DAYS[0].value

  const mark = useAction(markAttendance)
  const clear = useAction(clearAttendance)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const error = mark.error ?? clear.error ?? exportError

  async function onExport() {
    setExporting(true)
    setExportError(null)
    try {
      const { buildAttendanceWorkbook, downloadBlob } = await import('#/lib/excel-export')
      // Fetch every day, not just the one on screen, so one file covers both.
      const days = await listAllAttendance()
      const blob = await buildAttendanceWorkbook(days)
      const stamp = new Date().toISOString().slice(0, 10)
      downloadBlob(blob, `IIUC-BARD-Attendance-${stamp}.xlsx`)
    } catch (e) {
      console.error('Attendance export failed:', e)
      setExportError(
        e instanceof Error ? `Export failed: ${e.message}` : 'Could not build the Excel file.',
      )
    } finally {
      setExporting(false)
    }
  }

  async function setStatus(participantId: number, status: 'present' | 'absent') {
    setPendingId(participantId)
    await mark.run({ data: { participantId, day: activeDay, status } })
    setPendingId(null)
  }

  async function clearStatus(participantId: number) {
    setPendingId(participantId)
    await clear.run({ data: { participantId, day: activeDay } })
    setPendingId(null)
  }

  const presentCount = rows.filter((r) => r.status === 'present').length

  return (
    <>
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

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--charcoal-500)]">
          {presentCount} / {rows.length} marked present
        </p>
        <button
          type="button"
          disabled={rows.length === 0 || exporting}
          className="btn btn-outline-forest"
          title="Download both days as one Excel file"
          onClick={onExport}
        >
          {exporting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Download className="h-5 w-5" strokeWidth={2} />
          )}
          Download Excel
        </button>
      </div>

      {error && (
        <p className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--crimson-600)] bg-[rgba(158,42,43,0.06)] p-4 text-sm font-semibold text-[var(--crimson-700)]">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          {error}
        </p>
      )}

      {/* Mobile: one card per participant, full-width tap targets */}
      <div className="mt-6 space-y-3 md:hidden">
        {rows.map((r, i) => (
          <div key={r.participantId} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-[var(--charcoal-500)]">#{i + 1}</p>
                <p className="font-bold text-[var(--charcoal-900)]">{r.name}</p>
                <p className="text-sm text-[var(--charcoal-500)]">
                  {[r.department, r.roomNumber && `Room ${r.roomNumber}`].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <StatusPill status={r.status} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MarkButton
                variant="present"
                pending={pendingId === r.participantId}
                onClick={() => setStatus(r.participantId, 'present')}
              />
              <MarkButton
                variant="absent"
                pending={pendingId === r.participantId}
                onClick={() => setStatus(r.participantId, 'absent')}
              />
              <MarkButton
                variant="reset"
                pending={pendingId === r.participantId}
                disabled={r.status == null}
                onClick={() => clearStatus(r.participantId)}
              />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="card p-6 text-center text-sm text-[var(--charcoal-500)]">
            No participants to mark yet — add participants first.
          </p>
        )}
      </div>

      {/* Desktop / tablet: table */}
      <div className="card mt-6 hidden overflow-x-auto md:block">
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
                <TableCell className="font-semibold whitespace-normal text-[var(--charcoal-900)]">
                  {r.name}
                </TableCell>
                <TableCell>{r.department || '—'}</TableCell>
                <TableCell>{r.roomNumber || '—'}</TableCell>
                <TableCell>
                  <StatusPill status={r.status} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={pendingId === r.participantId}
                      aria-label={`Mark ${r.name} present`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--hairline)] text-[var(--forest-800)] hover:bg-[var(--forest-100)] disabled:opacity-40"
                      onClick={() => setStatus(r.participantId, 'present')}
                    >
                      <Check className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      disabled={pendingId === r.participantId}
                      aria-label={`Mark ${r.name} absent`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--hairline)] text-[var(--crimson-600)] hover:bg-[#fbebec] disabled:opacity-40"
                      onClick={() => setStatus(r.participantId, 'absent')}
                    >
                      <X className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      disabled={pendingId === r.participantId || r.status == null}
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
    </>
  )
}

function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`pill shrink-0 ${
        status === 'present' ? 'pill-present' : status === 'absent' ? 'pill-absent' : 'pill-neutral'
      }`}
    >
      {status ?? 'Not marked'}
    </span>
  )
}

function MarkButton({
  variant,
  pending,
  disabled,
  onClick,
}: {
  variant: 'present' | 'absent' | 'reset'
  pending: boolean
  disabled?: boolean
  onClick: () => void
}) {
  const styles = {
    present: 'border-[var(--forest-800)] text-[var(--forest-800)]',
    absent: 'border-[var(--crimson-600)] text-[var(--crimson-600)]',
    reset: 'border-[var(--hairline)] text-[var(--charcoal-500)]',
  }[variant]
  const label = { present: 'Present', absent: 'Absent', reset: 'Reset' }[variant]
  const Icon = { present: Check, absent: X, reset: RotateCcw }[variant]

  return (
    <button
      type="button"
      disabled={pending || disabled}
      className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg border-2 text-sm font-bold disabled:opacity-40 ${styles}`}
      onClick={onClick}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
      ) : (
        <Icon className="h-4 w-4" strokeWidth={2.4} />
      )}
      {label}
    </button>
  )
}
