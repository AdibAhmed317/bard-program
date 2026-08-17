import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Loader2, Plus, Trash2 } from 'lucide-react'

import { createAdminUser, deleteAdminUser, listAdminUsers } from '#/lib/users-api'
import { requireAdminRoute } from '#/lib/session'
import { AdminShell } from '#/components/admin/shell'
import { PasswordField } from '#/components/admin/password-field'
import { authClient } from '#/lib/auth-client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'

export const Route = createFileRoute('/admin/users')({
  beforeLoad: requireAdminRoute,
  loader: () => listAdminUsers(),
  component: AdminUsers,
})

const emptyForm = { username: '', password: '', name: '' }

function AdminUsers() {
  const users = Route.useLoaderData()
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    await router.invalidate()
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.username.trim() || !form.password) return
    setSaving(true)
    setError(null)
    try {
      await createAdminUser({ data: form })
      setForm(emptyForm)
      setShowForm(false)
      await refresh()
    } catch {
      setError('Could not create that user — the username may already be taken.')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(userId: string, username: string | null) {
    if (!window.confirm(`Remove access for ${username ?? 'this user'}?`)) return
    await deleteAdminUser({ data: { userId } })
    await refresh()
  }

  return (
    <AdminShell title="User Management">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--charcoal-500)]">{users.length} admin account{users.length === 1 ? '' : 's'}</p>
        <button type="button" className="btn btn-forest" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-5 w-5" strokeWidth={2.2} />
          Create User
        </button>
      </div>

      {showForm && (
        <form onSubmit={onCreate} className="card mt-6 grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
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

          {error && <p className="text-sm font-semibold text-[var(--crimson-700)] sm:col-span-2 lg:col-span-3">{error}</p>}

          <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={saving} className="btn btn-forest">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" strokeWidth={2.2} />}
              Save User
            </button>
            <button type="button" className="btn btn-outline-forest" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="card mt-6 overflow-x-auto">
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
                <TableCell className="font-semibold whitespace-normal text-[var(--charcoal-900)]">{u.name}</TableCell>
                <TableCell>{u.username ?? '—'}</TableCell>
                <TableCell>
                  <span className="pill pill-present">{u.role}</span>
                </TableCell>
                <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    disabled={u.id === session?.user?.id}
                    aria-label={`Remove ${u.username ?? u.name}`}
                    title={u.id === session?.user?.id ? "You can't remove your own account" : 'Remove access'}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--crimson-600)] hover:bg-[#fbebec] disabled:opacity-30"
                    onClick={() => onDelete(u.id, u.username)}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.8} />
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
    </AdminShell>
  )
}
