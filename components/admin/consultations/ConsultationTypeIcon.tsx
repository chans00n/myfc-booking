import { Video, Phone, Users, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConsultationTypeIconProps {
  type: 'phone' | 'video' | 'in_person'
  className?: string
}

export function ConsultationTypeIcon({ type, className }: ConsultationTypeIconProps) {
  const Icon = {
    video: Video,
    phone: Phone,
    in_person: Users
  }[type] || MessageSquare

  return <Icon className={cn('h-4 w-4', className)} />
}