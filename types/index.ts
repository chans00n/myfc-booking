import { Database } from './database'

// Extract table types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type IntakeForm = Database['public']['Tables']['intake_forms']['Row']
export type Consultation = Database['public']['Tables']['consultations']['Row']

// Extract enum types
export type UserRole = Database['public']['Enums']['user_role']
export type AppointmentStatus = Database['public']['Enums']['appointment_status']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type PaymentPreference = Database['public']['Enums']['payment_preference']
export type PaymentCollectionMethod = Database['public']['Enums']['payment_collection_method']
export type PressurePreference = Database['public']['Enums']['pressure_preference']
export type ServiceType = Database['public']['Enums']['service_type']
export type ConsultationType = Database['public']['Enums']['consultation_type']
export type ConsultationStatus = Database['public']['Enums']['consultation_status']
export type IntakeFormType = Database['public']['Enums']['intake_form_type']
export type ContactMethod = Database['public']['Enums']['contact_method']

// Extended types with relations
export type AppointmentWithRelations = Appointment & {
  service: Service
  client: Profile
  intake_form?: IntakeForm
  consultation?: Consultation
}

export type ProfileWithAppointments = Profile & {
  appointments: AppointmentWithRelations[]
}

export type ConsultationWithRelations = Consultation & {
  appointment: Appointment
  client: Profile
}

// Form types
export type BookingFormData = {
  service_id: string
  appointment_date: string
  start_time: string
  first_name: string
  last_name: string
  email: string
  phone: string
  notes?: string
}

export type IntakeFormData = {
  health_conditions?: string
  medications?: string
  allergies?: string
  massage_experience?: string
  pressure_preference?: PressurePreference
  focus_areas?: string
  avoid_areas?: string
  goals?: string
  emergency_contact_name: string
  emergency_contact_phone: string
  signature: string
}

// Availability types
export interface BusinessHours {
  id: string
  day_of_week: number // 0 = Sunday, 6 = Saturday
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimeBlock {
  id: string
  title: string
  start_datetime: string
  end_datetime: string
  block_type: 'vacation' | 'break' | 'personal' | 'holiday'
  is_recurring: boolean
  recurrence_rule: string | null
  google_event_id: string | null
  created_at: string
  updated_at: string
}

export interface AppointmentSettings {
  id: string
  buffer_time_minutes: number
  advance_booking_days: number
  minimum_notice_hours: number
  cancellation_cutoff_hours: number
  timezone: string
  google_calendar_id: string | null
  google_refresh_token: string | null
  created_at: string
  updated_at: string
}

export interface TimeSlot {
  start: Date
  end: Date
  available: boolean
}