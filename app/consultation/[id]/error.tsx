'use client'

import { ConsultationError } from '@/components/consultation/ConsultationError'

export default function ConsultationErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ConsultationError error={error} reset={reset} />
}