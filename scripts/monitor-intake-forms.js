const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Need service key to bypass RLS
)

async function monitorIntakeForms() {
  console.log('Starting intake form monitoring...\n')
  
  // Get the specific form that was reported
  const reportedFormId = '8202e27f-bb79-4d24-a793-a65460fa2e44'
  
  // Fetch the form details
  const { data: form, error: formError } = await supabase
    .from('intake_forms')
    .select(`
      *,
      client:profiles!intake_forms_client_id_fkey(
        id,
        email,
        first_name,
        last_name
      ),
      appointment:appointments(
        id,
        appointment_date,
        status
      )
    `)
    .eq('id', reportedFormId)
    .single()
  
  if (formError) {
    console.error('Error fetching form:', formError)
    return
  }
  
  console.log('Form Details:')
  console.log('-------------')
  console.log('Form ID:', form.id)
  console.log('Client ID:', form.client_id)
  console.log('Client Email:', form.client?.email)
  console.log('Client Name:', `${form.client?.first_name} ${form.client?.last_name}`)
  console.log('Form Type:', form.form_type)
  console.log('Status:', form.status)
  console.log('Created:', new Date(form.created_at).toLocaleString())
  console.log('Submitted:', form.submitted_at ? new Date(form.submitted_at).toLocaleString() : 'Not submitted')
  console.log('Appointment ID:', form.appointment_id || 'No appointment linked')
  
  if (form.appointment) {
    console.log('\nLinked Appointment:')
    console.log('------------------')
    console.log('Appointment Date:', new Date(form.appointment.appointment_date).toLocaleDateString())
    console.log('Appointment Status:', form.appointment.status)
  }
  
  // Check for any other forms with similar patterns
  console.log('\n\nChecking for other forms by this client...')
  const { data: clientForms, error: clientError } = await supabase
    .from('intake_forms')
    .select('id, status, created_at, submitted_at')
    .eq('client_id', form.client_id)
    .order('created_at', { ascending: false })
  
  if (!clientError && clientForms) {
    console.log(`Found ${clientForms.length} forms for this client:`)
    clientForms.forEach((f, index) => {
      console.log(`${index + 1}. ${f.id} - Status: ${f.status}, Created: ${new Date(f.created_at).toLocaleDateString()}`)
    })
  }
  
  // Check recent intake forms to see if there's a pattern
  console.log('\n\nRecent intake forms (last 24 hours):')
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  const { data: recentForms, error: recentError } = await supabase
    .from('intake_forms')
    .select(`
      id,
      client_id,
      status,
      created_at,
      client:profiles!intake_forms_client_id_fkey(email)
    `)
    .gte('created_at', yesterday.toISOString())
    .order('created_at', { ascending: false })
  
  if (!recentError && recentForms) {
    console.log(`Found ${recentForms.length} forms created in the last 24 hours:`)
    recentForms.forEach((f, index) => {
      console.log(`${index + 1}. ${f.id}`)
      console.log(`   Client: ${f.client?.email}`)
      console.log(`   Status: ${f.status}`)
      console.log(`   Created: ${new Date(f.created_at).toLocaleString()}`)
      console.log('')
    })
  }
  
  // Check for any duplicate form IDs being used by different clients
  console.log('\nChecking for any access anomalies...')
  
  // This would need to be done through application logs
  console.log('Note: To detect unauthorized access attempts, check application logs for:')
  console.log('- "Unauthorized access attempt to intake form"')
  console.log('- "Form ownership mismatch"')
  console.log('- Error messages from getIntakeForm function')
}

monitorIntakeForms().catch(console.error)