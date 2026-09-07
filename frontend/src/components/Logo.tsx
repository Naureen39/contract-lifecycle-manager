import { useId } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

/**
 * The bolt/pennant silhouette is lifted verbatim from the project's own
 * favicon.svg — that file's outer path is already a crisp, single-shape
 * mark; everything else in it (a mask plus ~14 feGaussianBlur ellipse
 * layers) was decorative glow that read as mud at sidebar/favicon sizes.
 * This keeps the exact silhouette and the violet-to-cyan brand identity,
 * as a single flat gradient fill instead.
 */
const MARK_PATH =
  'M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z'

interface LogoProps {
  className?: string
  variant?: 'mark' | 'full'
  wordmarkClassName?: string
  /** Wraps the mark in a Link to "/" — used on marketing/auth chrome, not inside the already-linked AppShell sidebar. */
  href?: string
}

export function Logo({ className, variant = 'full', wordmarkClassName, href }: LogoProps) {
  const gradientId = useId()

  const mark = (
    <svg
      viewBox="0 0 48 46"
      className={cn('shrink-0', className)}
      fill="none"
      aria-hidden={variant === 'full' ? true : undefined}
      role={variant === 'mark' ? 'img' : undefined}
      aria-label={variant === 'mark' ? 'ObliTrack' : undefined}
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="42" x2="44" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7e14ff" />
          <stop offset="55%" stopColor="#863bff" />
          <stop offset="100%" stopColor="#47bfff" />
        </linearGradient>
      </defs>
      <path fill={`url(#${gradientId})`} d={MARK_PATH} />
    </svg>
  )

  const content =
    variant === 'full' ? (
      <span className="inline-flex items-center gap-2">
        {mark}
        <span className={cn('text-[15px] font-semibold tracking-tight', wordmarkClassName)}>
          ObliTrack
        </span>
      </span>
    ) : (
      mark
    )

  if (href) {
    return (
      <Link to={href} className="inline-flex items-center">
        {content}
      </Link>
    )
  }
  return content
}
