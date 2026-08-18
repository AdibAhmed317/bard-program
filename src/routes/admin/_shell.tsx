import { Outlet, createFileRoute } from '@tanstack/react-router'

import { requireAdminRoute } from '#/lib/session'
import { AdminShell } from '#/components/admin/shell'

/**
 * Pathless layout route: keeps URLs as /admin/participants etc. while mounting
 * the sidebar once. Without it every page rendered its own <AdminShell>, so the
 * whole chrome unmounted and re-rendered on each navigation.
 *
 * The admin check lives here too, so it runs once for the section rather than
 * being repeated in every child route.
 */
export const Route = createFileRoute('/admin/_shell')({
  beforeLoad: requireAdminRoute,
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  )
}
