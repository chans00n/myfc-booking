'use client'

import { AdminSiteHeader } from '@/components/admin-site-header'
import { ConsultationAnalytics } from '@/components/admin/consultations/ConsultationAnalytics'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ConsultationAnalyticsPage() {
  return (
    <>
      <AdminSiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="icon"
                asChild
              >
                <Link href="/dashboard/consultations">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Consultation Analytics</h1>
                <p className="text-muted-foreground">Detailed insights into your consultation performance</p>
              </div>
            </div>

            {/* Analytics Component */}
            <ConsultationAnalytics />
          </div>
        </div>
      </div>
    </>
  )
}