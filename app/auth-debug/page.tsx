'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthDebugPage() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          setError(`Session error: ${sessionError.message}`)
          setLoading(false)
          return
        }
        
        setSession(session)
        
        if (session?.user) {
          // Try to fetch profile directly
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (profileError) {
            setError(`Profile error: ${profileError.message}`)
          } else {
            setProfile(profileData)
          }
        }
      } catch (err) {
        setError(`Unexpected error: ${err}`)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return <div className="p-8">Loading auth debug info...</div>
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Auth Debug Page</h1>
      
      {error && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap">{error}</pre>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Session Status</CardTitle>
        </CardHeader>
        <CardContent>
          {session ? (
            <div className="space-y-2">
              <p><strong>User ID:</strong> {session.user.id}</p>
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>Role:</strong> {session.user.user_metadata?.role || 'No role set'}</p>
            </div>
          ) : (
            <p>No active session</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Status</CardTitle>
        </CardHeader>
        <CardContent>
          {profile ? (
            <pre className="whitespace-pre-wrap">{JSON.stringify(profile, null, 2)}</pre>
          ) : (
            <p>No profile found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}