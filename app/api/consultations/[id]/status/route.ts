import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json()

    if (!['in_progress', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Check if user has access to this consultation
    const { data: consultation } = await supabase
      .from('consultations')
      .select('client_id')
      .eq('id', params.id)
      .single()

    if (!consultation) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
    }

    const isClient = user.id === consultation.client_id
    const isAdmin = user.user_metadata?.role === 'admin'

    if (!isClient && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update consultation status
    const updates: any = {
      consultation_status: status,
      updated_at: new Date().toISOString()
    }

    if (status === 'in_progress') {
      updates.started_at = new Date().toISOString()
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('consultations')
      .update(updates)
      .eq('id', params.id)

    if (error) {
      console.error('Error updating consultation status:', error)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    // If completed, also update the appointment status
    if (status === 'completed') {
      const { data: consultationData } = await supabase
        .from('consultations')
        .select('appointment_id')
        .eq('id', params.id)
        .single()

      if (consultationData?.appointment_id) {
        await supabase
          .from('appointments')
          .update({ status: 'completed' })
          .eq('id', consultationData.appointment_id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in consultation status update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}