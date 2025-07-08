import { Badge } from '@/components/ui/badge'

interface ConsultationStatusBadgeProps {
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
}

export function ConsultationStatusBadge({ status }: ConsultationStatusBadgeProps) {
  const statusConfig = {
    scheduled: { variant: 'secondary' as const, label: 'Scheduled' },
    in_progress: { variant: 'default' as const, label: 'In Progress' },
    completed: { variant: 'success' as const, label: 'Completed' },
    cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
    no_show: { variant: 'destructive' as const, label: 'No Show' }
  }

  const config = statusConfig[status] || statusConfig.scheduled

  return <Badge variant={config.variant}>{config.label}</Badge>
}