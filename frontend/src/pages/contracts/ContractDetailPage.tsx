import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import { EmptyState, ErrorState, LoadingState } from '@/components/QueryState'
import { StatusBadge } from '@/components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { apiClient, apiOrigin, getAccessToken } from '@/lib/api-client'
import { CONTRACT_STATUS_LABEL, CONTRACT_STATUS_TONE, categoryLabel } from '@/lib/status'

function useContractFilePreview(contractId: string, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let objectUrl: string | null = null
    let cancelled = false

    async function load() {
      try {
        const response = await fetch(`${apiOrigin}/api/v1/contracts/${contractId}/file`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
        })
        if (!response.ok) throw new Error('Failed to load file')
        const blob = await response.blob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      } catch {
        if (!cancelled) setError(true)
      }
    }

    void load()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [contractId, enabled])

  return { url, error }
}

export function ContractDetailPage() {
  const { contractId } = useParams<{ contractId: string }>()

  const contractQuery = useQuery({
    queryKey: ['contract', contractId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/contracts/{contract_id}', {
        params: { path: { contract_id: contractId! } },
      })
      if (error) throw new Error('Failed to load contract.')
      return data
    },
    enabled: !!contractId,
  })

  const statusQuery = useQuery({
    queryKey: ['contract-status', contractId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/contracts/{contract_id}/status', {
        params: { path: { contract_id: contractId! } },
      })
      if (error) throw new Error('Failed to load extraction status.')
      return data
    },
    enabled: !!contractId,
    refetchInterval: (query) => {
      const job = query.state.data?.latest_extraction_job
      return job && (job.status === 'queued' || job.status === 'running') ? 3000 : false
    },
  })

  const obligationsQuery = useQuery({
    queryKey: ['obligations', { contractId }],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/obligations', {
        params: { query: { contract_id: contractId! } },
      })
      if (error) throw new Error('Failed to load obligations.')
      return data
    },
    enabled: !!contractId,
  })

  const isPdf = contractQuery.data?.original_filename.toLowerCase().endsWith('.pdf') ?? false
  const preview = useContractFilePreview(contractId ?? '', isPdf && !!contractId)

  if (contractQuery.isPending) return <LoadingState label="Loading contract..." />
  if (contractQuery.isError || !contractQuery.data) {
    return <ErrorState message="Could not load this contract." />
  }

  const contract = contractQuery.data

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{contract.title}</h1>
          <p className="text-sm text-muted-foreground">{contract.original_filename}</p>
        </div>
        <StatusBadge
          tone={CONTRACT_STATUS_TONE[contract.status]}
          label={CONTRACT_STATUS_LABEL[contract.status]}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Counterparty</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">
            {contract.counterparty_name ?? '—'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Effective / Expires</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">
            {contract.effective_date ?? '—'} → {contract.original_expiration_date ?? '—'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Governing Law</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">
            {contract.governing_law ?? '—'}
          </CardContent>
        </Card>
      </div>

      {statusQuery.data?.latest_extraction_job ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Extraction status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3 text-sm">
            <Badge variant="outline">{statusQuery.data.latest_extraction_job.status}</Badge>
            {statusQuery.data.latest_extraction_job.llm_provider_used ? (
              <span className="text-muted-foreground">
                via {statusQuery.data.latest_extraction_job.llm_provider_used}
              </span>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Document preview</CardTitle>
          </CardHeader>
          <CardContent>
            {isPdf ? (
              preview.url ? (
                <iframe
                  src={preview.url}
                  title="Contract document"
                  className="h-[600px] w-full rounded-md border"
                />
              ) : preview.error ? (
                <ErrorState message="Could not load the document preview." />
              ) : (
                <LoadingState label="Loading document..." />
              )
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Inline preview isn&apos;t available for DOCX files.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extracted obligations</CardTitle>
          </CardHeader>
          <CardContent>
            {obligationsQuery.isPending ? <LoadingState label="Loading obligations..." /> : null}
            {obligationsQuery.isError ? (
              <ErrorState message="Could not load obligations." />
            ) : null}
            {obligationsQuery.data && obligationsQuery.data.length === 0 ? (
              <EmptyState
                title="No obligations extracted yet"
                description="Extraction may still be in progress, or no obligations were found."
              />
            ) : null}
            <div className="flex flex-col divide-y">
              {obligationsQuery.data?.map((obligation) => (
                <div key={obligation.id} className="flex flex-col gap-1 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {categoryLabel(obligation.category)}
                    </span>
                    <Badge variant={obligation.is_human_reviewed ? 'secondary' : 'outline'}>
                      {obligation.is_human_reviewed ? 'Reviewed' : 'Needs review'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{obligation.description}</p>
                  {obligation.trigger_date ? (
                    <p className="text-xs text-muted-foreground">
                      Trigger date: {obligation.trigger_date}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />
    </div>
  )
}
