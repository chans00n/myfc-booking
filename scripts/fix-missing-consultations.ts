import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixMissingConsultations() {
  console.log('Starting to fix missing consultation records...')

  try {
    // Find all appointments with consultation services that don't have consultation records
    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        client_id,
        appointment_date,
        status,
        service:services!inner(
          id,
          name,
          is_consultation
        )
      `)
      .eq('service.is_consultation', true)
      .not('id', 'in', `(SELECT appointment_id FROM consultations)`)

    if (fetchError) {
      console.error('Error fetching appointments:', fetchError)
      return
    }

    console.log(`Found ${appointments?.length || 0} appointments without consultation records`)

    if (!appointments || appointments.length === 0) {
      console.log('No missing consultation records found')
      return
    }

    // Create consultation records for each appointment
    const consultationRecords = appointments.map(appointment => ({
      appointment_id: appointment.id,
      client_id: appointment.client_id,
      consultation_type: 'video', // Default to video
      consultation_status: appointment.status === 'completed' ? 'completed' : 
                           appointment.status === 'cancelled' ? 'cancelled' : 
                           appointment.status === 'no_show' ? 'no_show' : 'scheduled',
      intake_form_type: 'standard',
      created_at: appointment.appointment_date + 'T00:00:00Z' // Use appointment date as creation date
    }))

    const { data: insertedConsultations, error: insertError } = await supabase
      .from('consultations')
      .insert(consultationRecords)
      .select()

    if (insertError) {
      console.error('Error inserting consultation records:', insertError)
      return
    }

    console.log(`Successfully created ${insertedConsultations?.length || 0} consultation records`)

    // Log details
    insertedConsultations?.forEach(consultation => {
      console.log(`- Created consultation ${consultation.id} for appointment ${consultation.appointment_id}`)
    })

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the script
fixMissingConsultations()
  .then(() => {
    console.log('Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })