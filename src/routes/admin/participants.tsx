import { useMemo, useRef, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { FileSpreadsheet, Loader2, Plus, Trash2, X } from 'lucide-react'
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
import { AdminShell } from '#/components/admin/shell'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'

export const Route = createFileRoute('/admin/participants')({
  beforeLoad: requireAdminRoute,
  loader: async () => ({
    participants: await listParticipants(),
    rooms: await listRooms(),
  }),
  component: AdminParticipants,
})

const emptyForm = { name: '', designation: '', department: '', phone: '', email: '', idCardNo: '', groupLeader: '' }

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
  const router = useRouter()
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [importSaving, setImportSaving] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [pendingRows, setPendingRows] = useState<ImportRow[] | null>(null)
  const [department, setDepartment] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const departments = useMemo(
    () => Array.from(new Set(participants.map((p) => p.department).filter(Boolean))).sort(),
    [participants],
  )
  const visibleParticipants = useMemo(
    () => (department ? participants.filter((p) => p.department === department) : participants),
    [participants, department],
  )

  async function refresh() {
    await router.invalidate()
  }

  function cell(row: Record<string, unknown>, ...keys: string[]) {
    for (const key of keys) {
      const value = row[key]
      if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim()
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
    setImportSaving(true)
    try {
      const result = await bulkImportParticipants({ data: { rows: pendingRows } })
      setImportMessage(
        `Imported ${result.inserted} participant${result.inserted === 1 ? '' : 's'}` +
          (result.skipped > 0 ? ` · ${result.skipped} skipped (already in the list)` : ''),
      )
      setPendingRows(null)
      await refresh()
    } finally {
      setImportSaving(false)
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await createParticipant({ data: form })
    setForm(emptyForm)
    setShowForm(false)
    setSaving(false)
    await refresh()
  }

  async function onAssignRoom(participantId: number, roomId: string) {
    await updateParticipant({ data: { id: participantId, roomId: roomId ? Number(roomId) : null } })
    await refresh()
  }

  async function onDelete(id: number) {
    if (!window.confirm('Remove this participant?')) return
    await deleteParticipant({ data: { id } })
    await refresh()
  }

  return (
    <AdminShell title="Participants">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-[var(--charcoal-500)]">{visibleParticipants.length} shown · {participants.length} registered</p>
          {departments.length > 0 && (
            <select
              className="select"
              style={{ width: 'auto', minWidth: '14rem' }}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={onImportFile}
          />
          <button
            type="button"
            disabled={parsing}
            className="btn btn-outline-forest"
            onClick={() => fileInputRef.current?.click()}
          >
            {parsing ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileSpreadsheet className="h-5 w-5" strokeWidth={2} />}
            Import Excel
          </button>
          <button type="button" className="btn btn-forest" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-5 w-5" strokeWidth={2.2} />
            Add Participant
          </button>
        </div>
      </div>

      {importMessage && (
        <p className="card mt-6 p-6 text-sm font-semibold text-[var(--charcoal-900)]">{importMessage}</p>
      )}

      {pendingRows && (
        <div className="card mt-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-extrabold text-[var(--charcoal-900)]">Review before saving</p>
              <p className="text-sm text-[var(--charcoal-500)]">{pendingRows.length} rows parsed from the file — nothing has been saved yet.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" disabled={importSaving} className="btn btn-forest" onClick={onSaveImport}>
                {importSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" strokeWidth={2.2} />}
                Save {pendingRows.length} Participants
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--hairline)]"
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
        <form onSubmit={onCreate} className="card mt-6 grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Full name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Designation" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} />
          <Field label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="ID card no." value={form.idCardNo} onChange={(v) => setForm({ ...form, idCardNo: v })} />
          <Field label="Group leader" value={form.groupLeader} onChange={(v) => setForm({ ...form, groupLeader: v })} />
          <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={saving} className="btn btn-forest">Save Participant</button>
            <button type="button" className="btn btn-outline-forest" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="card mt-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SL</TableHead>
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
                    aria-label={`Remove ${p.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--crimson-600)] hover:bg-[#fbebec]"
                    onClick={() => onDelete(p.id)}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {visibleParticipants.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-[var(--charcoal-500)]">
                  {participants.length === 0
                    ? 'No participants yet — add the first one above.'
                    : 'No participants in this department.'}
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
      <label className="field-label">{label}{required && ' *'}</label>
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
