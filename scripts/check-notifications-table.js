const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aolmkeaaytpqqaigekdh.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbG1rZWFheXRwcXFhaWdla2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzQxMjQsImV4cCI6MjA2NzM1MDEyNH0.w8VzXBccmDsiwhkCfCA-8ommeWW1_N-ZjsaQnehbZ3c'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkNotificationsTable() {
  console.log('Checking if notifications table exists...')
  
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('Error:', error)
      if (error.message.includes('relation "public.notifications" does not exist')) {
        console.log('❌ Notifications table does not exist. Please run the migration.')
      }
    } else {
      console.log('✅ Notifications table exists!')
      console.log('Sample query result:', data)
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

checkNotificationsTable()