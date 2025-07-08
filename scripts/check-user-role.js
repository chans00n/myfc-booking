const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aolmkeaaytpqqaigekdh.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbG1rZWFheXRwcXFhaWdla2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzQxMjQsImV4cCI6MjA2NzM1MDEyNH0.w8VzXBccmDsiwhkCfCA-8ommeWW1_N-ZjsaQnehbZ3c'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUserRole() {
  const userId = 'a4e29779-ea55-4f20-aeb2-24d1b39dcc46' // Your user ID from the logs
  
  console.log('Checking role for user:', userId)
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
    
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Query result:', data)
      if (data && data.length > 0) {
        const profile = data[0]
        console.log('User profile:', profile)
        console.log('Current role:', profile.role)
        
        if (profile.role !== 'admin') {
          console.log('\n❌ User is not an admin. Notifications will not be visible.')
          console.log('To fix, run: UPDATE profiles SET role = \'admin\' WHERE id = \'' + userId + '\';')
        } else {
          console.log('\n✅ User has admin role')
        }
      } else {
        console.log('No profile found for user ID:', userId)
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

checkUserRole()