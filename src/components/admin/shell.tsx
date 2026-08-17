import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { BedDouble, CalendarCheck2, LayoutDashboard, LogOut, UserCog, Users } from 'lucide-react'

import { authClient } from '#/lib/auth-client'

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/participants', label: 'Participants', icon: Users },
  { to: '/admin/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck2 },
  { to: '/admin/users', label: 'User Management', icon: UserCog },
] as const

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const { data: session } = authClient.useSession()

  return (
    <div className="admin-shell flex flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <aside className="admin-sidebar flex shrink-0 flex-col gap-6 p-6 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:overflow-y-auto">
        <div>
          <p className="text-sm font-extrabold text-white">IIUC Admin</p>
          <p className="text-xs text-white/50">Teachers Development Training 2026</p>
        </div>

        <nav aria-label="Admin" className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="sidebar-link"
              activeOptions={{ exact: l.to === '/admin' }}
              activeProps={{ className: 'sidebar-link is-active' }}
            >
              <l.icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              <span className="whitespace-nowrap">{l.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <p className="truncate text-xs text-white/50">{session?.user?.displayUsername ?? session?.user?.name}</p>
          <button
            type="button"
            className="sidebar-link mt-2 w-full"
            onClick={() => {
              void authClient.signOut({ fetchOptions: { onSuccess: () => window.location.assign('/admin/login') } })
            }}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 sm:p-10 lg:h-screen lg:overflow-y-auto">
        <h1 className="text-2xl font-extrabold text-[var(--charcoal-900)] sm:text-3xl">{title}</h1>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  )
}
