import { Link } from 'react-router-dom'

import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-sidebar/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo variant="full" href="/" className="size-7" wordmarkClassName="text-white" />
        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a href="#product" className="transition-colors hover:text-white">
            Product
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-white">
            How it works
          </a>
          <a href="#proof" className="transition-colors hover:text-white">
            Engineering
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            render={<Link to="/login" />}
          >
            Log in
          </Button>
          <Button render={<Link to="/register" />}>Get started</Button>
        </div>
      </div>
    </header>
  )
}
