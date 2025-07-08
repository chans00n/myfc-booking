'use client'

import { AdminSiteHeader } from "@/components/admin-site-header"
import { IntakeFormManager } from '@/components/admin/IntakeFormManager'

export default function IntakeFormsPage() {
  return (
    <>
      <AdminSiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <IntakeFormManager />
          </div>
        </div>
      </div>
    </>
  )
}