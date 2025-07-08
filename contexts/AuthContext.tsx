'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProfile } from '@/lib/auth/profile-helper-simple'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const fetchProfile = async (user: User) => {
    console.log('fetchProfile called for user:', user.id)
    setProfileLoading(true)
    try {
      const profile = await getProfile(user.id)
      console.log('Profile result:', profile)
      
      if (profile) {
        setProfile(profile)
      } else {
        console.log('No profile found, setting to null')
        setProfile(null)
      }
    } catch (err) {
      console.error('Unexpected error with profile:', err)
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user)
    }
  }

  useEffect(() => {
    let mounted = true

    // Check active sessions and sets the user
    const initializeAuth = async () => {
      console.log('initializeAuth started')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session:', session)
        
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false) // Set loading to false immediately after getting session
          
          if (session?.user) {
            console.log('User found, fetching profile in background...')
            // Fetch profile in the background without blocking
            fetchProfile(session.user).then(() => {
              console.log('Profile fetch completed')
            }).catch((err) => {
              console.error('Profile fetch error:', err)
            })
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          console.log('Setting loading to false due to error')
          setLoading(false)
        }
      }
    }

    console.log('useEffect running, calling initializeAuth')
    initializeAuth()

    // Listen for changes on auth state (signed in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (session?.user) {
          // Fetch profile in the background
          fetchProfile(session.user).catch((err) => {
            console.error('Profile fetch error in auth state change:', err)
          })
        } else {
          setProfile(null)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/')
  }

  const value = {
    user,
    profile,
    loading,
    profileLoading,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}