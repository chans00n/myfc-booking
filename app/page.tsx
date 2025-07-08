"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, Heart, Sparkles, ArrowRight, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  const { user, profile, loading } = useAuth();

  const features = [
    {
      icon: Calendar,
      title: "Easy Booking",
      description: "Schedule your appointment in just a few clicks",
    },
    {
      icon: Clock,
      title: "Flexible Hours",
      description: "Available when you need us, with convenient time slots",
    },
    {
      icon: Heart,
      title: "Personalized Care",
      description: "Tailored massage therapy to meet your specific needs",
    },
    {
      icon: Sparkles,
      title: "Professional Service",
      description: "Licensed therapists with years of experience",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="/MYFC_logo.png" alt="MYFC Logo" className="h-6 sm:h-6 w-auto dark:hidden" />
              <img
                src="/MYFC_logo_white.png"
                alt="MYFC Logo"
                className="h-6 sm:h-6 w-auto hidden dark:block"
              />
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              {loading ? (
                <div className="h-10 w-20 bg-muted animate-pulse rounded-md" />
              ) : user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    Welcome, {profile?.first_name || "User"}
                  </span>
                  {profile?.role === "admin" ? (
                    <Link href="/dashboard">
                      <Button size="sm">Dashboard</Button>
                    </Link>
                  ) : (
                    <Link href="/booking">
                      <Button size="sm">My Bookings</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Content */}
          <div className="text-center space-y-8 mb-16">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-3xl lg:text-5xl font-normal tracking-tight">
                Welcome to <span className="text-primary">MYFC</span>
              </h1>
              <p className="text-md sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                Experience therapeutic massage that rejuvenates your body and calms your mind. Book
                your session today and discover the difference.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <>
                  <Link href="/booking">
                    <Button size="lg" className="min-w-[200px]">
                      Book New Appointment
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button size="lg" variant="outline" className="min-w-[200px]">
                      <User className="mr-2 h-5 w-5" />
                      My Profile
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/signup">
                    <Button size="lg" className="min-w-[200px]">
                      Book Your First Session
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button size="lg" variant="outline" className="min-w-[200px]">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="mb-4 inline-flex p-3 rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>

          {/* Info Section */}
          <Card className="p-8 sm:p-12 text-center bg-muted/50">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Feel Your Best?</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our professional massage therapists are here to help you relax, recover, and
              rejuvenate. Whether you need relief from chronic pain or simply want to unwind, we
              have the perfect treatment for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/services">
                <Button variant="outline" size="lg">
                  View Our Services
                </Button>
              </Link>
              {!user && (
                <Link href="/auth/signup">
                  <Button size="lg">Create Account</Button>
                </Link>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
