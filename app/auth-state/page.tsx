"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthStatePage() {
  const { user, profile, loading, profileLoading, refreshProfile } = useAuth();

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Current Auth State</h1>

      <Card>
        <CardHeader>
          <CardTitle>Loading States</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Auth Loading: {loading ? "Yes" : "No"}</p>
          <p>Profile Loading: {profileLoading ? "Yes" : "No"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <p>
                <strong>ID:</strong> {user.id}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Metadata Role:</strong> {user.user_metadata?.role || "Not set"}
              </p>
            </div>
          ) : (
            <p>No user logged in</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {profile ? (
            <div className="space-y-2">
              <p>
                <strong>ID:</strong> {profile.id}
              </p>
              <p>
                <strong>Email:</strong> {profile.email}
              </p>
              <p>
                <strong>Role:</strong> {profile.role}
              </p>
              <p>
                <strong>Name:</strong> {profile.first_name} {profile.last_name}
              </p>
            </div>
          ) : (
            <p>No profile loaded</p>
          )}
        </CardContent>
      </Card>

      <Button onClick={refreshProfile}>Refresh Profile</Button>
    </div>
  );
}
