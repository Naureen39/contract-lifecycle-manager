import type { ReactNode } from 'react'

import { Logo } from '@/components/Logo'

/**
 * Split-screen shell shared by LoginPage/RegisterPage: a branded dark
 * panel (the same fixed --sidebar chrome the app already uses, and the
 * landing page's hero) on the left, the actual form on the right. Below
 * `lg` the branded panel disappears entirely and the form takes the full
 * width, rather than squeezing both columns into a narrow viewport.
 */
export function AuthLayout({ children, tagline }: { children: ReactNode; tagline: string }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-white lg:flex">
        <Logo variant="full" className="size-8" wordmarkClassName="text-white" />
        <div className="flex max-w-sm flex-col gap-3">
          <p className="text-3xl font-bold tracking-tight text-balance">{tagline}</p>
          <p className="text-sm text-white/60">
            Contract lifecycle &amp; obligation management for legal and procurement teams.
          </p>
        </div>
        <p className="text-xs text-white/40">© {new Date().getFullYear()} ObliTrack</p>
      </div>
      <div className="flex items-center justify-center px-4 py-12">{children}</div>
    </div>
  )
}
