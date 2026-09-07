import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function FinalCta() {
  return (
    <section className="border-t border-white/10 bg-sidebar text-white">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Stop finding out about a missed deadline after the fact.
        </h2>
        <p className="max-w-xl text-white/65">
          Get started in minutes — upload a contract and watch ObliTrack build your compliance
          calendar for you.
        </p>
        <Button size="lg" className="h-11 px-6 text-base" render={<Link to="/register" />}>
          Get started
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  )
}
