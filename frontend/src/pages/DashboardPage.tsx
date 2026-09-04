import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CalendarClock, Clock, DollarSign } from 'lucide-react'

import { ErrorState, LoadingState } from '@/components/QueryState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function DashboardPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/dashboard/summary')
      if (error) throw new Error('Failed to load dashboard summary.')
      return data
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          A live view of your organization&apos;s obligation compliance.
        </p>
      </div>

      {isPending ? <LoadingState label="Loading dashboard..." /> : null}
      {isError ? <ErrorState message="Could not load the dashboard summary." /> : null}

      {data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                At Risk
              </CardTitle>
              <AlertTriangle className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{data.at_risk_count}</p>
              <p className="text-xs text-muted-foreground">obligations need attention soon</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue
              </CardTitle>
              <Clock className="size-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{data.overdue_count}</p>
              <p className="text-xs text-muted-foreground">past their trigger date</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming This Month
              </CardTitle>
              <CalendarClock className="size-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">
                {data.upcoming_this_month_count}
              </p>
              <p className="text-xs text-muted-foreground">due before month end</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Active Value
              </CardTitle>
              <DollarSign className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {Object.keys(data.total_active_contract_value).length === 0 ? (
                <p className="text-3xl font-semibold tabular-nums">—</p>
              ) : (
                Object.entries(data.total_active_contract_value).map(([currency, amount]) => (
                  <p key={currency} className="text-3xl font-semibold tabular-nums">
                    {formatCurrency(amount, currency)}
                  </p>
                ))
              )}
              <p className="text-xs text-muted-foreground">across active contracts</p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
