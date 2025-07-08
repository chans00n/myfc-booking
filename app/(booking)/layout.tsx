"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { User, LogOut, Calendar, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <img 
              src="/MYFC_logo.png" 
              alt="MYFC Logo" 
              className="h-6 sm:h-6 w-auto dark:hidden"
            />
            <img 
              src="/MYFC_logo_white.png" 
              alt="MYFC Logo" 
              className="h-6 sm:h-6 w-auto hidden dark:block"
            />
          </Link>
          
          {/* Center Navigation */}
          <div className="hidden md:flex md:flex-1 md:justify-center">
            <div className="flex items-center space-x-8">
              <Link 
                href="/services" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Services
              </Link>
              <Link 
                href="/booking" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Book Appointment
              </Link>
              {user && (
                <Link 
                  href="/booking/my-appointments" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  My Appointments
                </Link>
              )}
            </div>
          </div>
          
          {/* Right Side Actions */}
          <div className="hidden md:flex md:items-center md:gap-4">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{profile?.first_name || 'Account'}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.first_name && profile?.last_name 
                          ? `${profile.first_name} ${profile.last_name}`
                          : 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.email || user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/booking/my-appointments" className="cursor-pointer">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>My Appointments</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile Navigation */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </nav>
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}