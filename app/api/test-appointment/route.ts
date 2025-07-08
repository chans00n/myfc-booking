import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { appointment_id } = await req.json()
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Try to find the appointment
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointment_id)
      .single()
    
    return NextResponse.json({
      appointment_id,
      found: !!appointment,
      appointment,
      error: error?.message,
      userId: user?.id,
      appointmentClientId: appointment?.client_id,
      userMatchesClient: user?.id === appointment?.client_id
    })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}