const PERSONAS = [
  {
    title: 'Legal ops & in-house counsel',
    description:
      'You own contract risk but are tracking it manually across dozens or hundreds of active agreements.',
  },
  {
    title: 'Procurement & vendor managers',
    description:
      'You need to know a vendor contract is coming up for renewal or renegotiation before it\'s too late to act.',
  },
  {
    title: 'SMBs without a dedicated legal function',
    description:
      'Contract tracking falls to whoever remembers to check — which is precisely how renewal windows get missed.',
  },
]

export function Personas() {
  return (
    <section className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 flex flex-col items-center gap-3 text-center">
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">
            Who it's for
          </p>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-balance">
            Built for the people who actually own contract risk
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PERSONAS.map((persona) => (
            <div key={persona.title} className="rounded-2xl border bg-card p-6">
              <h3 className="text-base font-semibold">{persona.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{persona.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
