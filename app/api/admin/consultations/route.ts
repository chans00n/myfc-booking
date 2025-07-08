import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const clientId = searchParams.get('clientId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('consultations')
      .select(`
        *,
        appointment:appointments!consultations_appointment_id_fkey(
          id,
          start_time,
          end_time,
          status,
          service:services(
            id,
            name,
            duration_minutes,
            price
          )
        ),
        client:profiles!consultations_client_id_fkey(
          id,
          email,
          first_name,
          last_name,
          phone,
          date_of_birth
        )
      `, { count: 'exact' })

    // Apply filters
    if (status) {
      query = query.eq('consultation_status', status)
    }
    if (type) {
      query = query.eq('consultation_type', type)
    }
    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching consultations:', error)
      return NextResponse.json({ error: 'Failed to fetch consultations' }, { status: 500 })
    }

    return NextResponse.json({
      consultations: data,
      total: count,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error in consultations API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}