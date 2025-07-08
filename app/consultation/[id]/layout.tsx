import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Consultation Room - SOZA Massage',
  description: 'Virtual consultation room for SOZA Massage therapy sessions',
}

export default function ConsultationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}