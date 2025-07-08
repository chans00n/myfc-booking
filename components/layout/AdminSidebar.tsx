"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Users,
  Briefcase,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  DollarSign,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const sidebarItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarCheck },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/services", label: "Services", icon: Briefcase },
  { href: "/dashboard/intake-forms", label: "Intake Forms", icon: FileText },
  { href: "/dashboard/payments", label: "Payments", icon: DollarSign },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface AdminSidebarProps {
  children?: React.ReactNode;
}

export function AdminSidebar({ children }: AdminSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { signOut, profile } = useAuth();

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center justify-between px-6 lg:h-20">
        <img src="/MYFC_logo.png" alt="MYFC Logo" className="h-8 w-auto dark:hidden" />
        <img src="/MYFC_logo_white.png" alt="MYFC Logo" className="h-8 w-auto hidden dark:block" />
        <div className="hidden lg:block">
          <ThemeToggle />
        </div>
      </div>
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1 py-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-secondary/50 hover:text-secondary-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Signed in as:</p>
          <p className="text-sm font-medium truncate">{profile?.email}</p>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b z-40 flex items-center justify-between px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <img src="/soza-logo.png" alt="SOZA Logo" className="h-6 w-auto" />

        <ThemeToggle />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex h-full w-64 flex-col border-r bg-card">
        <SidebarContent />
      </aside>

      {children}
    </>
  );
}
