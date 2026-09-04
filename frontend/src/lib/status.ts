import type { components } from './api-schema'

type ContractStatus = components['schemas']['ContractStatus']
type ObligationStatus = components['schemas']['ObligationStatus']
type AlertStatus = components['schemas']['AlertStatus']
type ExtractionJobStatus = components['schemas']['ExtractionJobStatus']

export type BadgeTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success'

export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  processing: 'Processing',
  needs_review: 'Needs Review',
  active: 'Active',
  expired: 'Expired',
  terminated: 'Terminated',
  error: 'Error',
}

export const CONTRACT_STATUS_TONE: Record<ContractStatus, BadgeTone> = {
  processing: 'info',
  needs_review: 'warning',
  active: 'success',
  expired: 'neutral',
  terminated: 'neutral',
  error: 'danger',
}

export const OBLIGATION_STATUS_LABEL: Record<ObligationStatus, string> = {
  upcoming: 'Upcoming',
  at_risk: 'At Risk',
  overdue: 'Overdue',
  resolved: 'Resolved',
  waived: 'Waived',
}

export const OBLIGATION_STATUS_TONE: Record<ObligationStatus, BadgeTone> = {
  upcoming: 'info',
  at_risk: 'warning',
  overdue: 'danger',
  resolved: 'success',
  waived: 'neutral',
}

export const ALERT_STATUS_LABEL: Record<AlertStatus, string> = {
  pending: 'Pending',
  sent: 'Sent',
  failed: 'Failed',
  cancelled: 'Dismissed',
}

export const ALERT_STATUS_TONE: Record<AlertStatus, BadgeTone> = {
  pending: 'info',
  sent: 'success',
  failed: 'danger',
  cancelled: 'neutral',
}

export const EXTRACTION_JOB_STATUS_LABEL: Record<ExtractionJobStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  succeeded: 'Succeeded',
  failed: 'Failed',
}

export const EXTRACTION_JOB_STATUS_TONE: Record<ExtractionJobStatus, BadgeTone> = {
  queued: 'neutral',
  running: 'info',
  succeeded: 'success',
  failed: 'danger',
}

export function categoryLabel(category: string): string {
  return category
    .toLowerCase()
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}
