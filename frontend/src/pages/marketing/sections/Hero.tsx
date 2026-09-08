import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { HeroVisual } from '@/pages/marketing/sections/HeroVisual'

export function Hero() {
  return (
    <section className="bg-sidebar text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pt-20 pb-24 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <div className="flex flex-col items-start gap-8 text-left">
          <h1 className="text-5xl leading-[1.05] font-black tracking-tight text-balance sm:text-6xl">
            Every contract hides a{' '}
            <span className="bg-gradient-to-r from-[#a970ff] to-[#47bfff] bg-clip-text text-transparent">
              deadline
            </span>{' '}
            nobody's watching.
          </h1>
          <p className="max-w-xl text-lg text-white/65">
            ObliTrack extracts every obligation, deadline, and monetary milestone from your signed
            contracts and turns them into a live, queryable compliance calendar with proactive
            alerts, so a missed renewal window gets caught weeks in advance, not after the fact.
          </p>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button size="lg" className="h-11 px-6 text-base" render={<Link to="/register" />}>
              Get started
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-11 px-6 text-base text-white hover:bg-white/10 hover:text-white"
              render={<a href="#how-it-works" />}
            >
              See how it works
            </Button>
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  )
}
