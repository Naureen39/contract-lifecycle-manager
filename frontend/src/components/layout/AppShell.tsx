import { NavLink, Outlet, useLocation } from 'react-router-dom'

import {
  BarChart3,
  Calendar,
  ChevronsUpDown,
  FileSearch,
  FileText,
  Gauge,
  ListChecks,
  LogOut,
  MessageSquare,
  ScrollText,
} from 'lucide-react'

import { useAuth } from '@/auth/AuthContext'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/contracts', label: 'Contracts', icon: FileText },
  { to: '/review-queue', label: 'Review Queue', icon: ListChecks },
  { to: '/calendar', label: 'Compliance Calendar', icon: Calendar },
  { to: '/precedents', label: 'Precedent Search', icon: FileSearch },
  { to: '/chat', label: 'Chat Assistant', icon: MessageSquare },
]

const ADMIN_NAV_ITEMS = [
  { to: '/admin/llm-usage', label: 'LLM Usage', icon: BarChart3 },
  { to: '/audit-log', label: 'Audit Log', icon: ScrollText },
]

// Static, route-derived label for the top bar — deliberately independent
// of each page's own (often dynamic) PageHeader title, e.g. a contract
// detail page's top-bar label stays "Contract" while its PageHeader shows
// the real contract.title.
const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/contracts': 'Contracts',
  '/review-queue': 'Review Queue',
  '/calendar': 'Compliance Calendar',
  '/precedents': 'Precedent Search',
  '/chat': 'Chat Assistant',
  '/admin/llm-usage': 'LLM Usage',
  '/audit-log': 'Audit Log',
}

function routeTitle(pathname: string): string | null {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  if (pathname.startsWith('/contracts/')) return 'Contract'
  return null
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  legal_ops: 'Legal Ops',
  viewer: 'Viewer',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

function NavSection({
  items,
  eyebrow,
}: {
  items: typeof NAV_ITEMS
  eyebrow?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {eyebrow ? (
        <p className="px-3 pt-4 pb-1 text-[11px] font-semibold tracking-wider text-sidebar-foreground/45 uppercase">
          {eyebrow}
        </p>
      ) : null}
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-sidebar-primary transition-opacity',
                  isActive ? 'opacity-100' : 'opacity-0',
                )}
              />
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}

export function AppShell() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const title = routeTitle(location.pathname)

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center px-4">
          <Logo variant="full" className="size-7" wordmarkClassName="text-sidebar-foreground" />
        </div>
        <Separator className="bg-sidebar-border" />

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
          <NavSection items={NAV_ITEMS} />
          {user?.role === 'admin' ? <NavSection items={ADMIN_NAV_ITEMS} eyebrow="Admin" /> : null}
        </nav>

        <Separator className="bg-sidebar-border" />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-2.5 p-3 text-left transition-colors hover:bg-sidebar-accent/60"
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                    {user ? initials(user.full_name) : '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{user?.full_name}</span>
                  <span className="block truncate text-xs text-sidebar-foreground/55">
                    {user ? (ROLE_LABEL[user.role] ?? user.role) : ''}
                  </span>
                </span>
                <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/45" />
              </button>
            }
          />
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel>
              <span className="block truncate font-medium">{user?.full_name}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {user?.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void logout()} variant="destructive">
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-1 border-b px-6">
          <h2 className="text-sm font-medium text-foreground/80">{title}</h2>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
