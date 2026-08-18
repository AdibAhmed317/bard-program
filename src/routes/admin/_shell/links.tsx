import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, ExternalLink, Loader2, MessageCircle, Plus, Trash2 } from 'lucide-react'

import { createLink, deleteLink, listLinks } from '#/lib/links-api'
import { useAction } from '#/lib/use-action'
import { AdminSkeleton } from '#/components/admin/skeleton'

export const Route = createFileRoute('/admin/_shell/links')({
  loader: () => listLinks(),
  pendingComponent: AdminSkeleton,
  component: AdminLinks,
})

const emptyForm = { label: '', url: '' }

function AdminLinks() {
  const rows = Route.useLoaderData()
  const create = useAction(createLink)
  const remove = useAction(deleteLink)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [pendingId, setPendingId] = useState<number | null>(null)

  const error = create.error ?? remove.error

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.label.trim() || !form.url.trim()) return
    const res = await create.run({ data: form })
    if (res.ok) {
      setForm(emptyForm)
      setShowForm(false)
    }
  }

  async function onDelete(id: number, label: string) {
    if (!window.confirm(`Remove "${label}"?`)) return
    setPendingId(id)
    await remove.run({ data: { id } })
    setPendingId(null)
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--charcoal-500)]">
          Shown to every lecturer on the Participant Information page.
        </p>
        <button type="button" className="btn btn-forest" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-5 w-5" strokeWidth={2.2} />
          Add Link
        </button>
      </div>

      {error && (
        <p className="mt-6 flex items-center gap-2 rounded-lg border border-[var(--crimson-600)] bg-[rgba(158,42,43,0.06)] p-4 text-sm font-semibold text-[var(--crimson-700)]">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          {error}
        </p>
      )}

      {showForm && (
        <form onSubmit={onCreate} className="card mt-6 grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <label className="field-label">Label *</label>
            <input
              required
              className="input"
              placeholder="Programme WhatsApp Group"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Link *</label>
            <input
              required
              type="url"
              className="input"
              placeholder="https://chat.whatsapp.com/…"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
            <button type="submit" disabled={create.pending} className="btn btn-forest">
              {create.pending && <Loader2 className="h-5 w-5 animate-spin" />}
              Save Link
            </button>
            <button type="button" className="btn btn-outline-forest" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {rows.map((l) => (
          <div key={l.id} className="card flex items-start justify-between gap-3 p-4 sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--forest-800)]" strokeWidth={1.8} />
              <div className="min-w-0">
                <p className="font-bold text-[var(--charcoal-900)]">{l.label}</p>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 break-all text-sm font-semibold text-[var(--forest-800)] hover:underline"
                >
                  {l.url}
                  <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={2} />
                </a>
              </div>
            </div>
            <button
              type="button"
              disabled={pendingId === l.id}
              aria-label={`Remove ${l.label}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--crimson-600)] hover:bg-[#fbebec] disabled:opacity-40"
              onClick={() => onDelete(l.id, l.label)}
            >
              {pendingId === l.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" strokeWidth={1.8} />
              )}
            </button>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="card p-6 text-center text-sm text-[var(--charcoal-500)]">
            No links yet — add the WhatsApp group link above.
          </p>
        )}
      </div>
    </>
  )
}
