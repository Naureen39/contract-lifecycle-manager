import type { ReactNode } from 'react'

import { Logo } from '@/components/Logo'

/**
 * Deliberately small and utilitarian — real enterprise login screens
 * (Salesforce, Workday, Oracle) don't spend half the viewport on a
 * marketing panel; that's a consumer-SaaS pattern. The marketing case
 * belongs to the landing page. This is just: logo, form, done.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-muted/20 px-4 py-12">
      <Logo variant="full" href="/" className="size-7" />
      {children}
    </div>
  )
}
