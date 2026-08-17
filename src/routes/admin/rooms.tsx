import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'

import { createRoom, deleteRoom, listRooms } from '#/lib/admin-api'
import { requireAdminRoute } from '#/lib/session'
import { AdminShell } from '#/components/admin/shell'

export const Route = createFileRoute('/admin/rooms')({
  beforeLoad: requireAdminRoute,
  loader: () => listRooms(),
  component: AdminRooms,
})

const emptyForm = { roomNumber: '', block: '', capacity: 2, notes: '' }

function AdminRooms() {
  const rooms = Route.useLoaderData()
  const router = useRouter()
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.roomNumber.trim()) return
    await createRoom({ data: { ...form, capacity: Number(form.capacity) || 1 } })
    setForm(emptyForm)
    setShowForm(false)
    await router.invalidate()
  }

  async function onDelete(id: number) {
    if (!window.confirm('Delete this room? Participants assigned to it will become unassigned.')) return
    await deleteRoom({ data: { id } })
    await router.invalidate()
  }

  return (
    <AdminShell title="Rooms">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--charcoal-500)]">{rooms.length} rooms configured</p>
        <button type="button" className="btn btn-forest" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-5 w-5" strokeWidth={2.2} />
          Add Room
        </button>
      </div>

      {showForm && (
        <form onSubmit={onCreate} className="card mt-6 grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="field-label">Room number *</label>
            <input required className="input" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Block / building</label>
            <input className="input" value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Capacity</label>
            <input type="number" min={1} className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          </div>
          <div>
            <label className="field-label">Notes</label>
            <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-4">
            <button type="submit" className="btn btn-forest">Save Room</button>
            <button type="button" className="btn btn-outline-forest" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => (
          <div key={r.id} className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-extrabold text-[var(--charcoal-900)]">Room {r.roomNumber}</p>
                <p className="text-sm text-[var(--charcoal-500)]">{r.block || 'BARD, Cumilla'}</p>
              </div>
              <button
                type="button"
                aria-label={`Delete room ${r.roomNumber}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--crimson-600)] hover:bg-[#fbebec]"
                onClick={() => onDelete(r.id)}
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
            <p className={`pill mt-4 ${r.occupancy >= r.capacity ? 'pill-absent' : 'pill-present'}`}>
              {r.occupancy} / {r.capacity} beds filled
            </p>
            {r.notes && <p className="mt-3 text-sm text-[var(--charcoal-700)]">{r.notes}</p>}
          </div>
        ))}
        {rooms.length === 0 && (
          <p className="text-sm text-[var(--charcoal-500)]">No rooms yet — add the first one above.</p>
        )}
      </div>
    </AdminShell>
  )
}
