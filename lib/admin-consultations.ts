import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export interface ConsultationFilters {
  status?: string
  type?: string
  clientId?: string
  startDate?: Date
  endDate?: Date
}

export async function getAdminConsultations(filters?: ConsultationFilters) {
  const supabase = createClient()
  
  let query = supabase
    .from('consultations')
    .select(`
      *,
      appointment:appointments!consultations_appointment_id_fkey(
        id,
        start_time,
        end_time,
        status,
        service:services(name, duration_minutes)
      ),
      client:profiles!consultations_client_id_fkey(
        id,
        email,
        first_name,
        last_name,
        phone
      )
    `)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('consultation_status', filters.status)
  }
  if (filters?.type) {
    query = query.eq('consultation_type', filters.type)
  }
  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId)
  }
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString())
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString())
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching consultations:', error)
    throw error
  }

  return data
}

export async function startConsultation(consultationId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('consultations')
    .update({
      consultation_status: 'in_progress',
      started_at: new Date().toISOString()
    })
    .eq('id', consultationId)
    .select()
    .single()

  if (error) {
    console.error('Error starting consultation:', error)
    throw error
  }

  return data
}

export async function completeConsultation(
  consultationId: string,
  notes?: string
) {
  const supabase = createClient()
  
  const updates: any = {
    consultation_status: 'completed',
    completed_at: new Date().toISOString()
  }

  if (notes) {
    updates.consultation_notes = notes
  }

  const { data, error } = await supabase
    .from('consultations')
    .update(updates)
    .eq('id', consultationId)
    .select()
    .single()

  if (error) {
    console.error('Error completing consultation:', error)
    throw error
  }

  return data
}

export async function cancelConsultation(
  consultationId: string,
  reason?: string
) {
  const supabase = createClient()
  
  const updates: any = {
    consultation_status: 'cancelled'
  }

  if (reason) {
    updates.consultation_notes = `Cancelled: ${reason}`
  }

  const { data, error } = await supabase
    .from('consultations')
    .update(updates)
    .eq('id', consultationId)
    .select()
    .single()

  if (error) {
    console.error('Error cancelling consultation:', error)
    throw error
  }

  return data
}

export async function markConsultationNoShow(consultationId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('consultations')
    .update({
      consultation_status: 'no_show'
    })
    .eq('id', consultationId)
    .select()
    .single()

  if (error) {
    console.error('Error marking consultation as no-show:', error)
    throw error
  }

  return data
}

export async function updateConsultationNotes(
  consultationId: string,
  notes: string
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('consultations')
    .update({
      consultation_notes: notes
    })
    .eq('id', consultationId)
    .select()
    .single()

  if (error) {
    console.error('Error updating consultation notes:', error)
    throw error
  }

  return data
}

export async function getConsultationAnalytics(days: number = 30) {
  const response = await fetch(`/api/admin/consultations/analytics?days=${days}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch consultation analytics')
  }

  return response.json()
}

export async function scheduleFollowUpAppointment(
  consultationId: string,
  serviceId: string,
  appointmentDate: string,
  startTime: string,
  notes?: string
) {
  const response = await fetch(`/api/admin/consultations/${consultationId}/schedule-followup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      serviceId,
      appointmentDate,
      startTime,
      notes
    })
  })

  if (!response.ok) {
    throw new Error('Failed to schedule follow-up appointment')
  }

  return response.json()
}

export function formatConsultationType(type: string): string {
  const types: Record<string, string> = {
    video: 'Video Call',
    phone: 'Phone Call',
    in_person: 'In Person'
  }
  return types[type] || type
}

export function getConsultationStatusColor(status: string): string {
  const colors: Record<string, string> = {
    scheduled: 'text-blue-600',
    in_progress: 'text-yellow-600',
    completed: 'text-green-600',
    cancelled: 'text-red-600',
    no_show: 'text-gray-600'
  }
  return colors[status] || 'text-gray-600'
}