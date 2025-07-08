"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminAppSidebar } from "@/components/admin-app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="admin">
      <SidebarProvider>
        <AdminAppSidebar />
        <SidebarInset>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}