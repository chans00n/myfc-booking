import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest) {
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
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    // Get status filter from query params
    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status')
    
    // Use service client to access payments table
    const serviceClient = createServiceClient()
    
    let query = serviceClient
      .from('payments')
      .select(`
        *,
        appointment:appointments!payments_appointment_id_fkey(
          *,
          service:services(*),
          client:profiles(*)
        ),
        payment_events(
          id,
          event_type,
          event_data,
          error_code,
          error_message,
          stripe_event_id,
          created_at
        )
      `)
      .order('created_at', { ascending: false })
    
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }
    
    const { data: payments, error } = await query
    
    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(payments || [])
  } catch (error) {
    console.error('Error in payments API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}