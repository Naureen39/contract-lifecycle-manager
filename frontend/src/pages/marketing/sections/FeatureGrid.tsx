import {
  BarChart3,
  Calendar,
  FileSearch,
  FileText,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: ShieldCheck,
    title: 'Multi-tenant auth & RBAC',
    description:
      'JWT access/refresh tokens with rotation, role-based access control, and an audit trail on every state-changing action.',
  },
  {
    icon: FileText,
    title: 'Real document ingestion',
    description:
      'Authenticated upload with file-type validation, PDF/DOCX parsing, and a regex pre-filter that flags obligation-bearing text before anything expensive runs.',
  },
  {
    icon: BarChart3,
    title: 'Dual-provider LLM extraction',
    description:
      'Groq primary, Gemini fallback, quota-aware provider selection, schema-validated output, and a human-review queue for anything low-confidence.',
  },
  {
    icon: Calendar,
    title: 'Live compliance calendar',
    description:
      'Obligation status recomputes daily from the real date, with deduped email alerts for anything newly at-risk or overdue.',
  },
  {
    icon: FileSearch,
    title: 'Precedent search',
    description:
      'Search over every clause ever ingested across your organization — find how a term was negotiated before.',
  },
  {
    icon: MessageSquare,
    title: 'Grounded chat assistant',
    description:
      'Hybrid retrieval with a cross-encoder reranker; every citation is backend-verified against a faithfulness guardrail before it reaches you.',
  },
]

export function FeatureGrid() {
  return (
    <section id="product" className="bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 flex flex-col items-center gap-3 text-center">
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">Product</p>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-balance">
            The full contract lifecycle, not a single clause-classification demo
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border bg-card p-6">
              <span className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
