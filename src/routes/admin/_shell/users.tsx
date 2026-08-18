import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, Loader2, Plus, Trash2 } from 'lucide-react'

import { createAdminUser, deleteAdminUser, listAdminUsers } from '#/lib/users-api'
import { useAction } from '#/lib/use-action'
import { AdminSkeleton } from '#/components/admin/skeleton'
import { PasswordField } from '#/components/admin/password-field'
import { authClient } from '#/lib/auth-client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'

export const Route = createFileRoute('/admin/_shell/users')({
  loader: () => listAdminUsers(),
  pendingComponent: AdminSkeleton,
  component: AdminUsers,
})

const emptyForm = { username: '', password: '', name: '' }

function AdminUsers() {
  const users = Route.useLoaderData()
  const { data: session } = authClient.useSession()
  const create = useAction(createAdminUser)
  const remove = useAction(deleteAdminUser)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const error = create.error ?? remove.error

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.username.trim() || !form.password) return
    const res = await create.run({ data: form })
    if (res.ok) {
      setForm(emptyForm)
      setShowForm(false)
    }
  }

  async function onDelete(userId: string, username: string | null) {
    if (!window.confirm(`Remove access for ${username ?? 'this user'}?`)) return
    setPendingId(userId)
    await remove.run({ data: { userId } })
    setPendingId(null)
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--charcoal-500)]">
          {users.length} admin account{users.length === 1 ? '' : 's'}
        </p>
        <button type="button" className="btn btn-forest" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-5 w-5" strokeWidth={2.2} />
          Create User
        </button>
      </div>

      {error && (
        <p className="mt-6 flex items-center gap-2 rounded-lg border border-[var(--crimson-600)] bg-[rgba(158,42,43,0.06)] p-4 text-sm font-semibold text-[var(--crimson-700)]">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          {error}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={onCreate}
          className="card mt-6 grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3"
        >
          <div>
            <label className="field-label">Username *</label>
            <input
              required
              className="input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <PasswordField
            id="new-user-password"
            label="Password *"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
          />
          <div>
            <label className="field-label">Full name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={create.pending} className="btn btn-forest">
              {create.pending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" strokeWidth={2.2} />
              )}
              Save User
            </button>
            <button type="button" className="btn btn-outline-forest" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Mobile: card per account */}
      <div className="mt-6 space-y-3 md:hidden">
        {users.map((u) => (
          <div key={u.id} className="card flex items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-bold text-[var(--charcoal-900)]">{u.name}</p>
              <p className="text-sm text-[var(--charcoal-500)]">{u.username ?? '—'}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="pill pill-present">{u.role}</span>
                <span className="text-xs text-[var(--charcoal-500)]">
                  {new Date(u.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled={u.id === session?.user?.id || pendingId === u.id}
              aria-label={`Remove ${u.username ?? u.name}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--crimson-600)] hover:bg-[#fbebec] disabled:opacity-30"
              onClick={() => onDelete(u.id, u.username)}
            >
              {pendingId === u.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" strokeWidth={1.8} />
              )}
            </button>
          </div>
        ))}
        {users.length === 0 && (
          <p className="card p-6 text-center text-sm text-[var(--charcoal-500)]">No admin accounts yet.</p>
        )}
      </div>

      {/* Desktop / tablet: table */}
      <div className="card mt-6 hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-semibold whitespace-normal text-[var(--charcoal-900)]">
                  {u.name}
                </TableCell>
                <TableCell>{u.username ?? '—'}</TableCell>
                <TableCell>
                  <span className="pill pill-present">{u.role}</span>
                </TableCell>
                <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    disabled={u.id === session?.user?.id || pendingId === u.id}
                    aria-label={`Remove ${u.username ?? u.name}`}
                    title={
                      u.id === session?.user?.id ? "You can't remove your own account" : 'Remove access'
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--crimson-600)] hover:bg-[#fbebec] disabled:opacity-30"
                    onClick={() => onDelete(u.id, u.username)}
                  >
                    {pendingId === u.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                    )}
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-[var(--charcoal-500)]">
                  No admin accounts yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
