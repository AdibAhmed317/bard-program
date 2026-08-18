import { createFileRoute } from '@tanstack/react-router'
import { BedDouble, CalendarCheck2, Users } from 'lucide-react'

import { listParticipants, listRooms } from '#/lib/admin-api'
import { AdminSkeleton } from '#/components/admin/skeleton'

export const Route = createFileRoute('/admin/_shell/')({
  // Both queries are independent — run them concurrently rather than waiting
  // for participants to come back before even starting rooms.
  loader: async () => {
    const [participants, rooms] = await Promise.all([listParticipants(), listRooms()])
    return { participants, rooms }
  },
  pendingComponent: AdminSkeleton,
  component: AdminDashboard,
})

function AdminDashboard() {
  const { participants, rooms } = Route.useLoaderData()
  const assigned = participants.filter((p) => p.roomId != null).length
  const capacity = rooms.reduce((sum, r) => sum + r.capacity, 0)
  const occupied = rooms.reduce((sum, r) => sum + r.occupancy, 0)

  const cards = [
    {
      icon: Users,
      label: 'Participants',
      value: participants.length,
      hint: `${assigned} assigned a room`,
    },
    {
      icon: BedDouble,
      label: 'Rooms',
      value: rooms.length,
      hint: `${occupied} / ${capacity} beds filled`,
    },
    {
      icon: CalendarCheck2,
      label: 'Training Days',
      value: 2,
      hint: '20 · 21 August',
    },
  ]

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ icon: Icon, label, value, hint }) => (
          <div key={label} className="card p-5 sm:p-6">
            <Icon className="h-7 w-7 text-[var(--forest-800)]" strokeWidth={1.7} />
            <p className="mt-4 text-3xl font-extrabold text-[var(--charcoal-900)]">{value}</p>
            <p className="text-sm font-bold text-[var(--charcoal-700)]">{label}</p>
            <p className="mt-1 text-sm text-[var(--charcoal-500)]">{hint}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-5 sm:p-6">
        <p className="text-sm font-bold text-[var(--charcoal-900)]">Recently added participants</p>
        <ul className="mt-4 divide-y divide-[var(--hairline)]">
          {participants.slice(0, 6).map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--charcoal-900)]">{p.name}</p>
                <p className="truncate text-sm text-[var(--charcoal-500)]">{p.department ?? '—'}</p>
              </div>
              <span className={`pill shrink-0 ${p.roomNumber ? 'pill-present' : 'pill-neutral'}`}>
                {p.roomNumber ? `Room ${p.roomNumber}` : 'No room'}
              </span>
            </li>
          ))}
          {participants.length === 0 && (
            <li className="py-3 text-sm text-[var(--charcoal-500)]">No participants added yet.</li>
          )}
        </ul>
      </div>
    </>
  )
}
