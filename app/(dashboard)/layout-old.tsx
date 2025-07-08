"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="relative flex min-h-screen flex-col">
        <div className="flex flex-1">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
            <div className="container p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
