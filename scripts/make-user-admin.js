const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aolmkeaaytpqqaigekdh.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbG1rZWFheXRwcXFhaWdla2RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc3NDEyNCwiZXhwIjoyMDY3MzUwMTI0fQ.7uQRRGfqEfalWV4ECOMl5IM5sMH7PmMEGzmzNhnnSFk'

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function makeUserAdmin() {
  const userId = 'a4e29779-ea55-4f20-aeb2-24d1b39dcc46'
  
  console.log('Making user admin:', userId)
  
  try {
    // First check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (checkError) {
      console.log('Profile not found or error:', checkError.message)
      
      // Try to create the profile
      console.log('Creating new admin profile...')
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: 'chanson@barbellsforboobs.org',
          first_name: 'Chris',
          last_name: 'Hanson',
          phone: '9492955330',
          role: 'admin'
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating profile:', createError)
      } else {
        console.log('✅ Created new admin profile:', newProfile)
      }
    } else {
      console.log('Existing profile:', existingProfile)
      
      // Update existing profile to admin
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId)
        .select()
        .single()
      
      if (updateError) {
        console.error('Error updating profile:', updateError)
      } else {
        console.log('✅ Updated profile to admin:', updatedProfile)
      }
    }
    
    // Verify the change
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .single()
    
    console.log('\nFinal profile status:', finalProfile)
    
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

makeUserAdmin()