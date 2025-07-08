'use client'

import { useAuth } from '@/contexts/AuthContext'
import { CreateProfileButton } from '@/components/auth/CreateProfileButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function ProfileCheckPage() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>Profile Status Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Authentication Status:</h3>
            <p className="text-sm text-gray-600">
              {user ? `Logged in as: ${user.email}` : 'Not logged in'}
            </p>
            {user && (
              <p className="text-xs text-gray-500 mt-1">
                User ID: {user.id}
              </p>
            )}
          </div>

          <div>
            <h3 className="font-semibold">Profile Status:</h3>
            {profile ? (
              <div className="text-sm text-gray-600 space-y-1">
                <p>✅ Profile exists</p>
                <p>Name: {profile.first_name} {profile.last_name}</p>
                <p>Email: {profile.email}</p>
                <p>Role: {profile.role}</p>
                <p>Phone: {profile.phone || 'Not set'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-600">❌ No profile found</p>
                {user && <CreateProfileButton />}
              </div>
            )}
          </div>

          <div className="pt-4 space-y-2">
            {user && profile ? (
              <>
                <Link href={profile.role === 'admin' ? '/dashboard' : '/booking'}>
                  <Button className="w-full">
                    Go to {profile.role === 'admin' ? 'Dashboard' : 'Booking'}
                  </Button>
                </Link>
                <Link href="/services">
                  <Button variant="outline" className="w-full">
                    View Services
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/auth/signin">
                <Button className="w-full">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {user && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-sm mb-2">User Metadata:</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(user.user_metadata, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}