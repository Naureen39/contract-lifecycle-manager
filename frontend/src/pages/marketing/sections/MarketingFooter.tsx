import { Link } from 'react-router-dom'

import { Logo } from '@/components/Logo'

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-sidebar text-white/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <Logo variant="mark" className="size-5 opacity-70" />
        <p className="text-xs">© {new Date().getFullYear()} ObliTrack. All rights reserved.</p>
        <nav className="flex items-center gap-4 text-xs">
          <Link to="/login" className="transition-colors hover:text-white">
            Log in
          </Link>
          <Link to="/register" className="transition-colors hover:text-white">
            Get started
          </Link>
        </nav>
      </div>
    </footer>
  )
}
