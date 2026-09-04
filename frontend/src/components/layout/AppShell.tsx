import { NavLink, Outlet } from 'react-router-dom'

import {
  BarChart3,
  Calendar,
  FileSearch,
  FileText,
  Gauge,
  ListChecks,
  LogOut,
  ScrollText,
} from 'lucide-react'

import { useAuth } from '@/auth/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/contracts', label: 'Contracts', icon: FileText },
  { to: '/review-queue', label: 'Review Queue', icon: ListChecks },
  { to: '/calendar', label: 'Compliance Calendar', icon: Calendar },
  { to: '/precedents', label: 'Precedent Search', icon: FileSearch },
]

const ADMIN_NAV_ITEMS = [
  { to: '/admin/llm-usage', label: 'LLM Usage', icon: BarChart3 },
  { to: '/audit-log', label: 'Audit Log', icon: ScrollText },
]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function AppShell() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <span className="text-lg font-semibold tracking-tight">ObliTrack</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
          {user?.role === 'admin' ? (
            <>
              <p className="mt-4 px-3 text-xs font-semibold tracking-wide text-sidebar-foreground/50 uppercase">
                Admin
              </p>
              {ADMIN_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )
                  }
                >
                  <Icon className="size-4" />
                  {label}
                </NavLink>
              ))}
            </>
          ) : null}
        </nav>
        <div className="flex items-center gap-3 border-t p-3">
          <Avatar className="size-8">
            <AvatarFallback>{user ? initials(user.full_name) : '?'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.full_name}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void logout()}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
