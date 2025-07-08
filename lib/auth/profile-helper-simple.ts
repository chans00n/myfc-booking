import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

export async function getProfile(userId: string): Promise<Profile | null> {
  console.log('getProfile called for:', userId)
  const supabase = createClient()
  
  try {
    // Add a timeout to prevent infinite waiting
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), 10000) // 10 seconds
    })
    
    const result = await Promise.race([profilePromise, timeoutPromise]) as any
    
    if (result.error) {
      console.error('Error fetching profile:', result.error)
      return null
    }
    
    console.log('Profile fetched:', result.data)
    return result.data
  } catch (error) {
    console.error('Unexpected error fetching profile:', error)
    return null
  }
}