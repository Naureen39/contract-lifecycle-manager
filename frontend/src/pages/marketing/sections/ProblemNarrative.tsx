export function ProblemNarrative() {
  return (
    <section className="bg-background">
      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-24 md:grid-cols-2 md:gap-16">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">
            The problem
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-balance">
            Organizations sign hundreds of contracts a year. Almost none of them are being
            watched.
          </h2>
          <p className="text-muted-foreground">
            Vendor agreements, NDAs, leases, MSAs, licenses — each one contains obligations
            buried in dense, inconsistently formatted legal prose: renewal notice deadlines,
            payment triggers, SLA commitments, compliance requirements. Today, tracking that
            lives in people's memory, email threads, or a spreadsheet that goes stale the moment
            it's created.
          </p>
          <p className="text-muted-foreground">
            The cost is concrete: auto-renewals nobody wanted, termination windows missed that
            lock a company into another year of unfavorable terms, payment triggers missed that
            damage vendor relationships. It's a data-extraction and monitoring problem wearing a
            legal-process costume.
          </p>
        </div>
        <div className="flex items-center">
          <blockquote className="rounded-2xl border bg-card p-8 text-lg leading-relaxed font-medium text-balance">
            "A renewal that auto-triggers unless someone objects in time. A termination window
            that closes after sixty days. A payment milestone tied to a date nobody put on a
            calendar."
            <footer className="mt-4 text-sm font-normal text-muted-foreground">
              None of that lives anywhere a computer can see it — until now.
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  )
}
