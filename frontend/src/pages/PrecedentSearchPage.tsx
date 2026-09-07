import { useState } from 'react'
import type { FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'

import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/QueryState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'

function SimilarityBadge({ similarity }: { similarity: number }) {
  const strong = similarity >= 0.7
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
        strong
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {Math.round(similarity * 100)}% match
    </span>
  )
}

export function PrecedentSearchPage() {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')

  const { data, isPending, isError, isFetched } = useQuery({
    queryKey: ['precedent-search', submittedQuery],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/precedents/search', {
        params: { query: { q: submittedQuery } },
      })
      if (error) throw new Error('Search failed.')
      return data
    },
    enabled: submittedQuery.length > 0,
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmittedQuery(query.trim())
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Precedent Search"
        description="Search across every clause your organization has ever ingested — find how similar terms were handled before."
      />

      <form className="flex gap-2" onSubmit={handleSubmit}>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. limitation of liability cap, 90 day termination notice..."
          className="h-10 max-w-xl text-base"
        />
        <Button type="submit" size="lg" disabled={!query.trim()}>
          <Search className="size-4" /> Search
        </Button>
      </form>

      {isPending && submittedQuery ? <LoadingState label="Searching..." /> : null}
      {isError ? <ErrorState message="Search failed. Please try again." /> : null}
      {isFetched && data && data.length === 0 ? (
        <EmptyState
          title="No matching clauses found"
          description="Try a different phrase, or upload more contracts to build up your precedent library."
        />
      ) : null}

      <div className="flex flex-col gap-3">
        {data?.map((result) => (
          <Card key={result.chunk_id}>
            <CardContent className="flex flex-col gap-2 py-4">
              <div className="flex items-center justify-between gap-2">
                <Link
                  to={`/contracts/${result.contract_id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {result.contract_title}
                </Link>
                <SimilarityBadge similarity={result.similarity} />
              </div>
              {result.section_heading ? (
                <p className="text-xs font-medium text-muted-foreground">
                  {result.section_heading}
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground">{result.raw_text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
