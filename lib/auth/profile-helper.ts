import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export async function ensureProfileExists(user: User) {
  console.log('ensureProfileExists called for:', user.id)
  const supabase = createClient()
  
  // First check if profile exists
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  
  console.log('Existing profile check:', { existingProfile, fetchError })
  
  // If profile exists, return it
  if (existingProfile) {
    console.log('Profile exists, returning it')
    return existingProfile
  }
  
  // If profile doesn't exist, create it with upsert
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email!,
      first_name: user.user_metadata?.first_name || '',
      last_name: user.user_metadata?.last_name || '',
      phone: user.user_metadata?.phone || null,
      role: user.user_metadata?.role || 'client',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  if (createError) {
    console.error('Error creating profile:', createError)
    
    // Try one more time with minimal data
    const { data: minimalProfile, error: minimalError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        role: 'client',
      })
      .select()
      .single()
    
    if (minimalError) {
      console.error('Error creating minimal profile:', minimalError)
      return null
    }
    
    return minimalProfile
  }
  
  return newProfile
}