"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Users,
  Briefcase,
  Settings,
  LogOut,
  FileText,
  DollarSign,
  HelpCircleIcon,
  Bell,
  MessageSquare,
} from "lucide-react";

import { AdminNavGrouped } from "@/components/admin-nav-grouped";
import { AdminNavSecondary } from "@/components/admin-nav-secondary";
import { AdminNavUser } from "@/components/admin-nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AdminAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { signOut, profile } = useAuth();

  const navGroups = [
    {
      label: "Dashboard",
      items: [
        {
          title: "Overview",
          url: "/dashboard",
          icon: LayoutDashboard,
          isActive: pathname === "/dashboard",
        },
      ],
    },
    {
      label: "Scheduling",
      items: [
        {
          title: "Calendar",
          url: "/dashboard/calendar",
          icon: Calendar,
          isActive: pathname === "/dashboard/calendar",
        },
        {
          title: "Appointments",
          url: "/dashboard/appointments",
          icon: CalendarCheck,
          isActive: pathname === "/dashboard/appointments",
        },
        {
          title: "Consultations",
          url: "/dashboard/consultations",
          icon: MessageSquare,
          isActive: pathname === "/dashboard/consultations",
        },
      ],
    },
    {
      label: "Client Management",
      items: [
        {
          title: "Clients",
          url: "/dashboard/clients",
          icon: Users,
          isActive: pathname === "/dashboard/clients",
        },
        {
          title: "Intake Forms",
          url: "/dashboard/intake-forms",
          icon: FileText,
          isActive: pathname === "/dashboard/intake-forms",
        },
      ],
    },
    {
      label: "Business",
      items: [
        {
          title: "Services",
          url: "/dashboard/services",
          icon: Briefcase,
          isActive: pathname === "/dashboard/services",
        },
        {
          title: "Payments",
          url: "/dashboard/payments",
          icon: DollarSign,
          isActive: pathname === "/dashboard/payments",
        },
      ],
    },
  ];

  const navSecondaryItems = [
    {
      title: "Notifications",
      url: "/dashboard/notifications",
      icon: Bell,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
    {
      title: "Help & Support",
      url: "#",
      icon: HelpCircleIcon,
    },
  ];

  const userData = {
    name:
      profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : "Admin",
    email: profile?.email || "",
    avatar: "/avatars/default.svg",
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-2">
              <img src="/MYFC_logo.png" alt="MYFC Logo" className="h-6 w-auto dark:hidden" />
              <img
                src="/MYFC_logo_white.png"
                alt="MYFC Logo"
                className="h-6 w-auto hidden dark:block"
              />
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <AdminNavGrouped groups={navGroups} />
        <AdminNavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <AdminNavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
