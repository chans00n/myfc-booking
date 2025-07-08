"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Menu,
  Calendar,
  Package,
  Home,
  User as UserIcon,
  LogOut,
  Settings,
  CreditCard,
} from "lucide-react";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();

  const handleLinkClick = () => {
    setOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  const mainNavItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/services", label: "Services", icon: Package },
    { href: "/booking", label: "Book Appointment", icon: Calendar },
    ...(user
      ? [{ href: "/booking/my-appointments", label: "My Appointments", icon: Calendar }]
      : []),
  ];

  const accountNavItems = user ? [{ href: "/profile", label: "My Profile", icon: UserIcon }] : [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <div className="flex h-full flex-col">
          <SheetHeader className="px-6 py-4">
            <SheetTitle className="text-left">
              <img src="/MYFC_logo.png" alt="MYFC Logo" className="h-6 w-auto dark:hidden" />
              <img
                src="/MYFC_logo_white.png"
                alt="MYFC Logo"
                className="h-6 w-auto hidden dark:block"
              />
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 px-2">
            <div className="flex flex-col gap-1 py-2">
              {/* Main Navigation */}
              <div className="px-3 py-2">
                <nav className="grid gap-1">
                  {mainNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link key={item.href} href={item.href} onClick={handleLinkClick}>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className="w-full justify-start h-auto"
                        >
                          <span className="text-xl font-medium">{item.label}</span>
                        </Button>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Account Section */}
              {user && accountNavItems.length > 0 && (
                <>
                  <div className="my-2 h-px bg-border" />
                  <div className="px-3 py-2">
                    <h2 className="mb-2 text-xs font-medium text-muted-foreground">Account</h2>
                    <nav className="grid gap-1">
                      {accountNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link key={item.href} href={item.href} onClick={handleLinkClick}>
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              className="w-full justify-start"
                            >
                              <Icon className="mr-2 h-4 w-4" />
                              {item.label}
                            </Button>
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t px-6 py-4">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{profile?.first_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email || user.email}</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/auth/signin" onClick={handleLinkClick}>
                  <Button variant="default" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup" onClick={handleLinkClick}>
                  <Button variant="outline" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
