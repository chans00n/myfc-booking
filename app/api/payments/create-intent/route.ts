import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPaymentIntent } from '@/lib/stripe/payment-intents'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await req.json()
    const { appointment_id, amount_cents, description, metadata } = body
    
    if (!appointment_id || !amount_cents) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Verify the appointment belongs to the user
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('client_id')
      .eq('id', appointment_id)
      .single()
    
    console.log('Appointment lookup:', {
      appointment_id,
      appointment,
      appointmentError,
      userId: user.id
    })
    
    if (appointmentError || !appointment || appointment.client_id !== user.id) {
      return NextResponse.json(
        { error: `Appointment not found or access denied. Details: ${appointmentError?.message || 'No appointment found'}` },
        { status: 404 }
      )
    }
    
    // Create payment intent
    const result = await createPaymentIntent({
      appointment_id,
      amount_cents,
      description,
      metadata
    })
    
    console.log('Payment intent result:', result)
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}