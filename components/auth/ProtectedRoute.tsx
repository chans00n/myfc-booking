"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CreateProfileButton } from "@/components/auth/CreateProfileButton";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "client";
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/auth/signin",
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo);
      } else if (requiredRole && profile && profile.role !== requiredRole) {
        // Only redirect if the user doesn't have the required role
        // For example, if a client tries to access admin pages
        if (requiredRole === "admin" && profile.role === "client") {
          router.push("/booking");
        } else if (requiredRole === "client" && profile.role === "admin") {
          router.push("/dashboard");
        }
      }
    }
  }, [user, profile, loading, requiredRole, router, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // If user exists but profile doesn't, show profile creation prompt
  if (user && !profile && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Complete Your Profile</h2>
          <p className="text-gray-600 mb-6">We need to set up your profile to continue.</p>
          <CreateProfileButton />
        </div>
      </div>
    );
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
