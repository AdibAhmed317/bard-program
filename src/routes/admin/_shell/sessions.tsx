import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  MapPin,
  Mic,
  Paperclip,
  Pencil,
  Plus,
  Presentation,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react'

import { TRAINING_DAYS } from '#/lib/admin-api'
import {
  RESOURCE_KINDS,
  addSessionResource,
  createSession,
  deleteSession,
  updateSession,
  deleteSessionResource,
  listSessions,
} from '#/lib/sessions-api'
import type { ResourceKind } from '#/lib/sessions-api'
import { useAction } from '#/lib/use-action'
import { AdminSkeleton } from '#/components/admin/skeleton'

export const Route = createFileRoute('/admin/_shell/sessions')({
  loaderDeps: ({ search }) => ({ day: search.day }),
  loader: ({ deps }) => listSessions({ data: { day: deps.day ?? TRAINING_DAYS[0].value } }),
  validateSearch: (search: Record<string, unknown>) => ({
    day: typeof search.day === 'string' ? search.day : undefined,
  }),
  pendingComponent: AdminSkeleton,
  component: AdminSessions,
})

const emptySession = {
  title: '',
  startTime: '',
  endTime: '',
  place: '',
  speaker: '',
  moderator: '',
  notes: '',
}

const kindIcon: Record<ResourceKind, typeof Link2> = {
  slide: Presentation,
  file: FileText,
  link: Link2,
}

function AdminSessions() {
  const rows = Route.useLoaderData()
  const { day } = Route.useSearch()
  const navigate = Route.useNavigate()
  const activeDay = day ?? TRAINING_DAYS[0].value

  const create = useAction(createSession)
  const update = useAction(updateSession)
  const remove = useAction(deleteSession)
  const addResource = useAction(addSessionResource)
  const removeResource = useAction(deleteSessionResource)

  const [form, setForm] = useState(emptySession)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)

  const error =
    create.error ?? update.error ?? remove.error ?? addResource.error ?? removeResource.error

  function startEdit(s: (typeof rows)[number]) {
    setForm({
      title: s.title,
      startTime: s.startTime ?? '',
      endTime: s.endTime ?? '',
      place: s.place ?? '',
      speaker: s.speaker ?? '',
      moderator: s.moderator ?? '',
      notes: s.notes ?? '',
    })
    setEditingId(s.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeForm() {
    setForm(emptySession)
    setEditingId(null)
    setShowForm(false)
  }

  async function onSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    const res =
      editingId === null
        ? await create.run({ data: { ...form, day: activeDay } })
        : await update.run({ data: { id: editingId, ...form } })
    if (res.ok) closeForm()
  }

  async function onDelete(id: number, title: string) {
    if (!window.confirm(`Delete "${title}"? Its slides and links will be removed too.`)) return
    setPendingId(id)
    await remove.run({ data: { id } })
    setPendingId(null)
  }

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
          {rows.length} session{rows.length === 1 ? '' : 's'} scheduled
        </p>
        <button type="button" className="btn btn-forest" onClick={() => (showForm ? closeForm() : setShowForm(true))}>
          <Plus className="h-5 w-5" strokeWidth={2.2} />
          Add Session
        </button>
      </div>

      {error && (
        <p className="mt-6 flex items-center gap-2 rounded-lg border border-[var(--crimson-600)] bg-[rgba(158,42,43,0.06)] p-4 text-sm font-semibold text-[var(--crimson-700)]">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          {error}
        </p>
      )}

      {showForm && (
        <form onSubmit={onSubmitForm} className="card mt-6 grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <p className="text-lg font-extrabold text-[var(--charcoal-900)] sm:col-span-2">
            {editingId === null ? 'Add Session' : `Editing “${form.title || 'session'}”`}
          </p>
          <div className="sm:col-span-2">
            <label className="field-label">Session title *</label>
            <input
              required
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Start time</label>
            <input
              type="time"
              className="input"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">End time</label>
            <input
              type="time"
              className="input"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Place / venue</label>
            <input
              className="input"
              placeholder="Lalmai Auditorium"
              value={form.place}
              onChange={(e) => setForm({ ...form, place: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Speaker</label>
            <input
              className="input"
              value={form.speaker}
              onChange={(e) => setForm({ ...form, speaker: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Moderator</label>
            <input
              className="input"
              value={form.moderator}
              onChange={(e) => setForm({ ...form, moderator: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Notes</label>
            <input
              className="input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
            <button
              type="submit"
              disabled={create.pending || update.pending}
              className="btn btn-forest"
            >
              {(create.pending || update.pending) && <Loader2 className="h-5 w-5 animate-spin" />}
              {editingId === null ? 'Save Session' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-outline-forest" onClick={closeForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-4">
        {rows.map((s) => (
          <div key={s.id} className="card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {(s.startTime || s.endTime) && (
                  <p className="text-sm font-extrabold tabular-nums text-[var(--forest-800)]">
                    {[s.startTime, s.endTime].filter(Boolean).join(' – ')}
                  </p>
                )}
                <h2 className="text-lg font-extrabold text-[var(--charcoal-900)] sm:text-xl">{s.title}</h2>
                <dl className="mt-2 flex flex-col gap-1 text-sm text-[var(--charcoal-700)] sm:flex-row sm:flex-wrap sm:gap-x-5">
                  {s.place && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0 text-[var(--charcoal-500)]" strokeWidth={1.8} />
                      <dt className="sr-only">Place</dt>
                      <dd>{s.place}</dd>
                    </div>
                  )}
                  {s.speaker && (
                    <div className="flex items-center gap-1.5">
                      <Mic className="h-4 w-4 shrink-0 text-[var(--charcoal-500)]" strokeWidth={1.8} />
                      <dt className="sr-only">Speaker</dt>
                      <dd>{s.speaker}</dd>
                    </div>
                  )}
                  {s.moderator && (
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 shrink-0 text-[var(--charcoal-500)]" strokeWidth={1.8} />
                      <dt className="sr-only">Moderator</dt>
                      <dd>{s.moderator}</dd>
                    </div>
                  )}
                </dl>
                {s.notes && <p className="mt-2 text-sm text-[var(--charcoal-500)]">{s.notes}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label={`Edit ${s.title}`}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--forest-800)] hover:bg-[var(--forest-100)]"
                  onClick={() => startEdit(s)}
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  disabled={pendingId === s.id}
                  aria-label={`Delete ${s.title}`}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--crimson-600)] hover:bg-[#fbebec] disabled:opacity-40"
                  onClick={() => onDelete(s.id, s.title)}
                >
                  {pendingId === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                  )}
                </button>
              </div>
            </div>

            <Resources sessionId={s.id} resources={s.resources} onRemove={removeResource} onAdd={addResource} />
          </div>
        ))}

        {rows.length === 0 && (
          <p className="card p-6 text-center text-sm text-[var(--charcoal-500)]">
            No sessions for this day yet — add the first one above.
          </p>
        )}
      </div>
    </>
  )
}

function Resources({
  sessionId,
  resources,
  onAdd,
  onRemove,
}: {
  sessionId: number
  resources: { id: number; kind: ResourceKind; label: string; url: string }[]
  onAdd: ReturnType<typeof useAction<[{ data: { sessionId: number; kind: ResourceKind; label: string; url: string } }], void>>
  onRemove: ReturnType<typeof useAction<[{ data: { id: number } }], void>>
}) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [kind, setKind] = useState<ResourceKind>('slide')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || !url.trim()) return
    const res = await onAdd.run({ data: { sessionId, kind, label, url } })
    if (res.ok) {
      setLabel('')
      setUrl('')
      setOpen(false)
    }
  }

  return (
    <div className="mt-4 border-t border-[var(--hairline)] pt-4">
      <div className="flex flex-wrap items-center gap-2">
        {resources.map((r) => {
          const Icon = kindIcon[r.kind]
          return (
            <span
              key={r.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hairline)] py-1.5 pl-3 pr-1.5 text-sm"
            >
              <Icon className="h-4 w-4 shrink-0 text-[var(--forest-800)]" strokeWidth={1.8} />
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--forest-800)] hover:underline"
              >
                {r.label}
              </a>
              <ExternalLink className="h-3 w-3 shrink-0 text-[var(--charcoal-500)]" strokeWidth={2} />
              <button
                type="button"
                aria-label={`Remove ${r.label}`}
                className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--crimson-600)] hover:bg-[#fbebec]"
                onClick={() => onRemove.run({ data: { id: r.id } })}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.4} />
              </button>
            </span>
          )
        })}

        {!open && (
          <button
            type="button"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-dashed border-[var(--charcoal-500)] px-3 text-sm font-semibold text-[var(--charcoal-700)] hover:border-[var(--forest-800)] hover:text-[var(--forest-800)]"
            onClick={() => setOpen(true)}
          >
            <Paperclip className="h-4 w-4" strokeWidth={2} />
            Add slides / file / link
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[9rem_1fr_1fr_auto]">
          <select
            className="select"
            aria-label="Resource type"
            value={kind}
            onChange={(e) => setKind(e.target.value as ResourceKind)}
          >
            {RESOURCE_KINDS.map((k) => (
              <option key={k} value={k}>
                {k[0].toUpperCase() + k.slice(1)}
              </option>
            ))}
          </select>
          <input
            required
            className="input"
            placeholder="Label (e.g. Session slides)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            required
            type="url"
            className="input"
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={onAdd.pending} className="btn btn-forest flex-1 sm:flex-none">
              {onAdd.pending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Add'}
            </button>
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--hairline)]"
              aria-label="Cancel"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" strokeWidth={1.8} />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
