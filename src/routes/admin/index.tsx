import { createFileRoute } from '@tanstack/react-router'
import { BedDouble, CalendarCheck2, Users } from 'lucide-react'

import { listParticipants, listRooms } from '#/lib/admin-api'
import { requireAdminRoute } from '#/lib/session'
import { AdminShell } from '#/components/admin/shell'

export const Route = createFileRoute('/admin/')({
  beforeLoad: requireAdminRoute,
  loader: async () => ({
    participants: await listParticipants(),
    rooms: await listRooms(),
  }),
  component: AdminDashboard,
})

function AdminDashboard() {
  const { participants, rooms } = Route.useLoaderData()
  const assigned = participants.filter((p) => p.roomId != null).length
  const capacity = rooms.reduce((sum, r) => sum + r.capacity, 0)
  const occupied = rooms.reduce((sum, r) => sum + r.occupancy, 0)

  const cards = [
    { icon: Users, label: 'Participants', value: participants.length, hint: `${assigned} assigned a room` },
    { icon: BedDouble, label: 'Rooms', value: rooms.length, hint: `${occupied} / ${capacity} beds filled` },
    { icon: CalendarCheck2, label: 'Training Days', value: 3, hint: '19 · 20 · 21 August' },
  ]

  return (
    <AdminShell title="Dashboard">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {cards.map(({ icon: Icon, label, value, hint }) => (
          <div key={label} className="card p-6">
            <Icon className="h-7 w-7 text-[var(--forest-800)]" strokeWidth={1.7} />
            <p className="mt-4 text-3xl font-extrabold text-[var(--charcoal-900)]">{value}</p>
            <p className="text-sm font-bold text-[var(--charcoal-700)]">{label}</p>
            <p className="mt-1 text-sm text-[var(--charcoal-500)]">{hint}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-6">
        <p className="text-sm font-bold text-[var(--charcoal-900)]">Recently added participants</p>
        <ul className="mt-4 divide-y divide-[var(--hairline)]">
          {participants.slice(0, 6).map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold text-[var(--charcoal-900)]">{p.name}</p>
                <p className="text-sm text-[var(--charcoal-500)]">{p.department ?? '—'}</p>
              </div>
              <span className={`pill ${p.roomNumber ? 'pill-present' : 'pill-neutral'}`}>
                {p.roomNumber ? `Room ${p.roomNumber}` : 'No room'}
              </span>
            </li>
          ))}
          {participants.length === 0 && (
            <li className="py-3 text-sm text-[var(--charcoal-500)]">No participants added yet.</li>
          )}
        </ul>
      </div>
    </AdminShell>
  )
}
