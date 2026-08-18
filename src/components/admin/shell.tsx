import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
  BedDouble,
  CalendarCheck2,
  LayoutDashboard,
  LogOut,
  Menu,
  Presentation,
  UserCog,
  Users,
  X,
} from 'lucide-react'

import { authClient } from '#/lib/auth-client'
import logoUrl from '#/assets/logo.webp'

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/participants', label: 'Participants', icon: Users },
  { to: '/admin/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/admin/sessions', label: 'Sessions', icon: Presentation },
  { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck2 },
  { to: '/admin/users', label: 'User Management', icon: UserCog },
] as const

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const { data: session } = authClient.useSession()
  const [navOpen, setNavOpen] = useState(false)

  // Escape closes the mobile drawer, and body scroll is locked while it's open
  // so the page behind doesn't scroll under the overlay.
  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [navOpen])

  return (
    <div className="admin-shell lg:flex lg:h-screen lg:overflow-hidden">
      {/* Mobile top bar */}
      <div className="admin-topbar flex items-center justify-between gap-3 px-4 py-3 lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <img src={logoUrl} alt="" className="h-9 w-9 shrink-0 object-contain" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-extrabold text-white">IIUC Admin</p>
            <p className="truncate text-xs text-white/50">Training 2026</p>
          </div>
        </div>
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/25 text-white"
          aria-label="Open menu"
          aria-expanded={navOpen}
          aria-controls="admin-nav"
          onClick={() => setNavOpen(true)}
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden="true"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside
        id="admin-nav"
        className={`admin-sidebar flex shrink-0 flex-col gap-6 p-6 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:overflow-y-auto ${
          navOpen ? 'is-open' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="" className="h-10 w-10 shrink-0 object-contain" />
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-extrabold text-white">IIUC Admin</p>
            <p className="text-xs text-white/50">Teachers Development Training 2026</p>
          </div>
          <button
            type="button"
            className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/25 text-white lg:hidden"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <nav aria-label="Admin" className="flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="sidebar-link"
              activeOptions={{ exact: l.to === '/admin' }}
              activeProps={{ className: 'sidebar-link is-active' }}
              onClick={() => setNavOpen(false)}
            >
              <l.icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              <span>{l.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <p className="truncate text-xs text-white/50">
            {session?.user?.displayUsername ?? session?.user?.name}
          </p>
          <button
            type="button"
            className="sidebar-link mt-2 w-full"
            onClick={() => {
              void authClient.signOut({
                fetchOptions: { onSuccess: () => window.location.assign('/admin/login') },
              })
            }}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:h-screen lg:overflow-y-auto lg:p-10">
        <h1 className="text-2xl font-extrabold text-[var(--charcoal-900)] sm:text-3xl">{title}</h1>
        <div className="mt-6 sm:mt-8">{children}</div>
      </main>
    </div>
  )
}
