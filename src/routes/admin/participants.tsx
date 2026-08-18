import { useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, Download, FileSpreadsheet, Loader2, Plus, Search, Trash2, X } from 'lucide-react'
import * as XLSX from 'xlsx'

import {
  bulkImportParticipants,
  createParticipant,
  deleteParticipant,
  listParticipants,
  listRooms,
  updateParticipant,
} from '#/lib/admin-api'
import { requireAdminRoute } from '#/lib/session'
import { useAction } from '#/lib/use-action'
import { AdminShell } from '#/components/admin/shell'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'

export const Route = createFileRoute('/admin/participants')({
  beforeLoad: requireAdminRoute,
  // Independent queries — fetch concurrently instead of one after the other.
  loader: async () => {
    const [participants, rooms] = await Promise.all([listParticipants(), listRooms()])
    return { participants, rooms }
  },
  component: AdminParticipants,
})

const emptyForm = {
  name: '',
  designation: '',
  department: '',
  phone: '',
  email: '',
  idCardNo: '',
  groupLeader: '',
}

type ImportRow = {
  name: string
  idCardNo: string
  designation: string
  phone: string
  email: string
  department: string
}

function AdminParticipants() {
  const { participants, rooms } = Route.useLoaderData()

  const create = useAction(createParticipant)
  const update = useAction(updateParticipant)
  const remove = useAction(deleteParticipant)
  const bulkImport = useAction(bulkImportParticipants)

  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [pendingRows, setPendingRows] = useState<ImportRow[] | null>(null)
  const [department, setDepartment] = useState('')
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [rowPendingId, setRowPendingId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const actionError =
    create.error ?? update.error ?? remove.error ?? bulkImport.error ?? exportError

  const departments = useMemo(
    () => Array.from(new Set(participants.map((p) => p.department).filter(Boolean))).sort(),
    [participants],
  )
  const visibleParticipants = useMemo(() => {
    const term = search.trim().toLowerCase()
    return participants.filter(
      (p) =>
        (!department || p.department === department) &&
        (!term ||
          p.name.toLowerCase().includes(term) ||
          (p.idCardNo ?? '').toLowerCase().includes(term)),
    )
  }, [participants, department, search])

  function cell(row: Record<string, unknown>, ...keys: string[]) {
    for (const key of keys) {
      const value = row[key]
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim()
      }
    }
    return ''
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setParsing(true)
    setImportMessage(null)
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

      const rows = raw
        .map((r) => ({
          name: cell(r, 'Name', 'Full Name'),
          idCardNo: cell(r, 'Teacher ID', 'ID', 'Employee ID'),
          designation: cell(r, 'Designation'),
          phone: cell(r, 'Mobile Number', 'Phone', 'Mobile'),
          email: cell(r, 'Email'),
          department: cell(r, 'Department'),
        }))
        .filter((r) => r.name)

      if (rows.length === 0) {
        setImportMessage('No rows with a name were found in that file.')
        return
      }
      setPendingRows(rows)
    } catch {
      setImportMessage('Could not read that file — make sure it is a valid .xlsx export.')
    } finally {
      setParsing(false)
    }
  }

  async function onSaveImport() {
    if (!pendingRows) return
    const res = await bulkImport.run({ data: { rows: pendingRows } })
    if (!res.ok) return
    const { inserted, skipped } = res.data
    setImportMessage(
      `Imported ${inserted} participant${inserted === 1 ? '' : 's'}` +
        (skipped > 0 ? ` · ${skipped} skipped (already in the list)` : ''),
    )
    setPendingRows(null)
  }

  async function onExport() {
    setExporting(true)
    setExportError(null)
    try {
      const { buildParticipantsWorkbook, downloadBlob } = await import('#/lib/excel-export')
      const blob = await buildParticipantsWorkbook(
        participants,
        departments.filter((d): d is string => Boolean(d)),
      )
      const stamp = new Date().toISOString().slice(0, 10)
      downloadBlob(blob, `IIUC-BARD-Participants-${stamp}.xlsx`)
    } catch (e) {
      console.error('Excel export failed:', e)
      setExportError(
        e instanceof Error ? `Export failed: ${e.message}` : 'Could not build the Excel file.',
      )
    } finally {
      setExporting(false)
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const res = await create.run({ data: form })
    if (res.ok) {
      setForm(emptyForm)
      setShowForm(false)
    }
  }

  async function onAssignRoom(participantId: number, roomId: string) {
    setRowPendingId(participantId)
    await update.run({ data: { id: participantId, roomId: roomId ? Number(roomId) : null } })
    setRowPendingId(null)
  }

  async function onDelete(id: number) {
    if (!window.confirm('Remove this participant?')) return
    setRowPendingId(id)
    await remove.run({ data: { id } })
    setRowPendingId(null)
  }

  const emptyMessage = search.trim()
    ? `No participant matches “${search.trim()}”${department ? ' in this department' : ''}.`
    : 'No participants in this department.'

  return (
    <AdminShell title="Participants">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--charcoal-500)]"
              strokeWidth={2}
              aria-hidden="true"
            />
            <input
              type="search"
              className="input"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search by name or ID"
              aria-label="Search participants by name or Teacher ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {departments.length > 0 && (
            <select
              className="select sm:w-auto sm:min-w-56"
              aria-label="Filter by department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
          <p className="shrink-0 text-sm text-[var(--charcoal-500)]">
            {visibleParticipants.length} shown · {participants.length} total
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={onImportFile}
          />
          <button
            type="button"
            disabled={participants.length === 0 || exporting}
            className="btn btn-outline-forest"
            title="Download all participants, with one sheet per department"
            onClick={onExport}
          >
            {exporting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" strokeWidth={2} />
            )}
            Download Excel
          </button>
          <button
            type="button"
            disabled={parsing}
            className="btn btn-outline-forest"
            onClick={() => fileInputRef.current?.click()}
          >
            {parsing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-5 w-5" strokeWidth={2} />
            )}
            Import Excel
          </button>
          <button type="button" className="btn btn-forest" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-5 w-5" strokeWidth={2.2} />
            Add Participant
          </button>
        </div>
      </div>

      {actionError && (
        <p className="mt-6 flex items-center gap-2 rounded-lg border border-[var(--crimson-600)] bg-[rgba(158,42,43,0.06)] p-4 text-sm font-semibold text-[var(--crimson-700)]">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          {actionError}
        </p>
      )}

      {importMessage && (
        <p className="card mt-6 p-5 text-sm font-semibold text-[var(--charcoal-900)] sm:p-6">
          {importMessage}
        </p>
      )}

      {pendingRows && (
        <div className="card mt-6 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-extrabold text-[var(--charcoal-900)]">Review before saving</p>
              <p className="text-sm text-[var(--charcoal-500)]">
                {pendingRows.length} rows parsed from the file — nothing has been saved yet.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={bulkImport.pending}
                className="btn btn-forest flex-1 sm:flex-none"
                onClick={onSaveImport}
              >
                {bulkImport.pending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" strokeWidth={2.2} />
                )}
                Save {pendingRows.length}
              </button>
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--hairline)]"
                aria-label="Cancel import"
                onClick={() => setPendingRows(null)}
              >
                <X className="h-5 w-5" strokeWidth={1.8} />
              </button>
            </div>
          </div>

          <div className="mt-6 max-h-96 overflow-auto rounded-lg border border-[var(--hairline)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SL</TableHead>
                  <TableHead>Teacher ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>{r.idCardNo || '—'}</TableCell>
                    <TableCell className="font-semibold whitespace-normal">{r.name}</TableCell>
                    <TableCell>{r.department || '—'}</TableCell>
                    <TableCell>{r.designation || '—'}</TableCell>
                    <TableCell>{r.phone || '—'}</TableCell>
                    <TableCell>{r.email || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={onCreate}
          className="card mt-6 grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3"
        >
          <Field label="Full name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Designation" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} />
          <Field label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Teacher ID" value={form.idCardNo} onChange={(v) => setForm({ ...form, idCardNo: v })} />
          <Field label="Group leader" value={form.groupLeader} onChange={(v) => setForm({ ...form, groupLeader: v })} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={create.pending} className="btn btn-forest">
              {create.pending && <Loader2 className="h-5 w-5 animate-spin" />}
              Save Participant
            </button>
            <button type="button" className="btn btn-outline-forest" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Mobile: card per participant */}
      <div className="mt-6 space-y-3 md:hidden">
        {visibleParticipants.map((p, i) => (
          <div key={p.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-[var(--charcoal-500)]">
                  #{i + 1} · ID {p.idCardNo || '—'}
                </p>
                <p className="font-bold text-[var(--charcoal-900)]">{p.name}</p>
                {p.designation && (
                  <p className="text-sm text-[var(--charcoal-500)]">{p.designation}</p>
                )}
              </div>
              <button
                type="button"
                disabled={rowPendingId === p.id}
                aria-label={`Remove ${p.name}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--crimson-600)] hover:bg-[#fbebec] disabled:opacity-40"
                onClick={() => onDelete(p.id)}
              >
                {rowPendingId === p.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                )}
              </button>
            </div>

            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="shrink-0 font-semibold text-[var(--charcoal-500)]">Dept</dt>
                <dd className="min-w-0 text-[var(--charcoal-900)]">{p.department || '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 font-semibold text-[var(--charcoal-500)]">Phone</dt>
                <dd className="min-w-0 text-[var(--charcoal-900)]">{p.phone || '—'}</dd>
              </div>
            </dl>

            <label className="mt-3 block">
              <span className="field-label">Room</span>
              <select
                className="select"
                disabled={rowPendingId === p.id}
                value={p.roomId ?? ''}
                onChange={(e) => onAssignRoom(p.id, e.target.value)}
              >
                <option value="">Unassigned</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomNumber} ({r.occupancy}/{r.capacity})
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
        {visibleParticipants.length === 0 && (
          <p className="card p-6 text-center text-sm text-[var(--charcoal-500)]">
            {participants.length === 0
              ? 'No participants yet — add the first one above.'
              : emptyMessage}
          </p>
        )}
      </div>

      {/* Desktop / tablet: table */}
      <div className="card mt-6 hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SL</TableHead>
              <TableHead>Teacher ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Group Leader</TableHead>
              <TableHead>Room</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleParticipants.map((p, i) => (
              <TableRow key={p.id}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell>{p.idCardNo || '—'}</TableCell>
                <TableCell className="whitespace-normal">
                  <p className="font-semibold text-[var(--charcoal-900)]">{p.name}</p>
                  <p className="text-xs text-[var(--charcoal-500)]">{p.designation}</p>
                </TableCell>
                <TableCell>{p.department || '—'}</TableCell>
                <TableCell>{p.phone || '—'}</TableCell>
                <TableCell>{p.groupLeader || '—'}</TableCell>
                <TableCell>
                  <select
                    className="select"
                    aria-label={`Room for ${p.name}`}
                    disabled={rowPendingId === p.id}
                    value={p.roomId ?? ''}
                    onChange={(e) => onAssignRoom(p.id, e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.roomNumber} ({r.occupancy}/{r.capacity})
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    disabled={rowPendingId === p.id}
                    aria-label={`Remove ${p.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--crimson-600)] hover:bg-[#fbebec] disabled:opacity-40"
                    onClick={() => onDelete(p.id)}
                  >
                    {rowPendingId === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                    )}
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {visibleParticipants.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-[var(--charcoal-500)]">
                  {participants.length === 0
                    ? 'No participants yet — add the first one above.'
                    : emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="field-label">
        {label}
        {required && ' *'}
      </label>
      <input
        type={type}
        required={required}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
