import { CheckCircle2, Gauge, Library, ShieldOff } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const STATS: { icon: LucideIcon; value: string; label: string }[] = [
  { icon: CheckCircle2, value: '274', label: 'automated tests, all passing' },
  { icon: Gauge, value: '45.7%', label: 'token reduction before any paid LLM call' },
  { icon: Library, value: '11,990', label: 'clause benchmark corpus (real CUAD v1 data)' },
  { icon: ShieldOff, value: '0', label: 'known dependency vulnerabilities' },
]

/**
 * Real, verifiable engineering metrics — deliberately framed as
 * engineering rigor, never as customer proof: this is a solo-built
 * product with no customers, so there are no logos or testimonials to
 * show, and inventing any would be dishonest.
 */
export function ProofPoints() {
  return (
    <section id="proof" className="border-t border-white/10 bg-sidebar text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="mb-8 text-center text-xs font-semibold tracking-wider text-white/40 uppercase">
          Built with rigor, not just a demo
        </p>
        <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <Icon className="size-5 text-white/30" />
              <dt className="sr-only">{label}</dt>
              <dd className="text-3xl font-bold tabular-nums sm:text-4xl">{value}</dd>
              <dd className="text-xs text-white/50 sm:text-sm">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
