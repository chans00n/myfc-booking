'use client'

import { AdminSiteHeader } from "@/components/admin-site-header"
import { PaymentManager } from '@/components/admin/PaymentManager'

export default function PaymentsPage() {
  return (
    <>
      <AdminSiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <PaymentManager />
          </div>
        </div>
      </div>
    </>
  )
}