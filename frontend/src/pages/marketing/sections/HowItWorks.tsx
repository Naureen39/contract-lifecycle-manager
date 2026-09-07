const STAGES = [
  { title: 'Contract intake', description: 'Upload a signed PDF or DOCX — validated and parsed into paragraph-level chunks.' },
  { title: 'Obligation extraction', description: 'Every deadline, renewal, and monetary milestone is extracted and confidence-scored.' },
  { title: 'Tracking database', description: 'Extracted obligations land in a structured, queryable store — not a spreadsheet.' },
  { title: 'Compliance calendar', description: 'Status recomputes daily against the real date: upcoming, at risk, or overdue.' },
  { title: 'Automated alerting', description: 'Email alerts fire for anything newly at-risk, deduped so nothing repeats.' },
  { title: 'Renewal workflow', description: 'A renewal or renegotiation shows up in your calendar weeks before it matters.' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 flex flex-col items-center gap-3 text-center">
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">
            How it works
          </p>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-balance">
            One pipeline, from signed contract to a calendar you can trust
          </h2>
        </div>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map((stage, index) => (
            <li key={stage.title} className="rounded-2xl border bg-card p-6">
              <span className="text-sm font-semibold tabular-nums text-primary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 text-base font-semibold">{stage.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{stage.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
