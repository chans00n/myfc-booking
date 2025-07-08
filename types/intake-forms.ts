export type FormType = 'new_client' | 'returning_client' | 'quick_update'
export type FormStatus = 'draft' | 'completed' | 'submitted' | 'reviewed'
export type PressurePreference = 'light' | 'medium' | 'firm' | 'deep' | 'varies'

export interface MedicalCondition {
  condition: string
  yearDiagnosed?: string
  currentlyTreated: boolean
  notes?: string
}

export interface Surgery {
  procedure: string
  year?: string
  complications?: string
}

export interface Injury {
  description: string
  date?: string
  currentlyAffects: boolean
  notes?: string
}

export interface PainArea {
  area: string
  painLevel: number // 1-10
  description?: string
}

export interface ConsentAgreements {
  informedConsent: boolean
  liabilityRelease: boolean
  privacyPolicy: boolean
  cancellationPolicy: boolean
  photographyConsent?: boolean
  marketingConsent?: boolean
}

export interface IntakeForm {
  id: string
  client_id: string
  appointment_id?: string
  form_type: FormType
  status: FormStatus
  
  // Personal Information
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  
  // Health History
  medical_conditions: MedicalCondition[]
  surgeries: Surgery[]
  injuries: Injury[]
  
  // Legacy fields (from existing table)
  health_conditions?: string
  medications?: string
  massage_experience?: string
  focus_areas?: string
  avoid_areas?: string
  goals?: string
  
  // Current Health
  pain_areas: PainArea[]
  pain_level?: number
  current_medications: string[]
  allergies: string[]
  
  // Massage Preferences
  previous_massage_experience: boolean
  massage_frequency?: string
  pressure_preference?: PressurePreference
  areas_to_avoid: string[]
  preferred_techniques: string[]
  
  // Goals and Concerns
  treatment_goals?: string
  specific_concerns?: string
  
  // Consent
  consent_signature?: string
  consent_date?: string
  consent_agreements: ConsentAgreements
  
  // Metadata
  created_at: string
  updated_at: string
  submitted_at?: string
  reviewed_at?: string
  reviewed_by?: string
  
  // Relations
  client?: any
  appointment?: any
}

export interface IntakeFormResponse {
  id: string
  form_id: string
  question_key: string
  question_text: string
  response_type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'signature'
  response_value: any
  created_at: string
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  conditional?: {
    dependsOn: string
    condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
    value: any
  }
}

export interface FormField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'signature' | 'pain_scale'
  required?: boolean
  placeholder?: string
  helperText?: string
  options?: { value: string; label: string }[]
  validation?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: string
    message?: string
  }
  conditional?: {
    dependsOn: string
    condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
    value: any
  }
}

export interface IntakeFormTemplate {
  id: string
  name: string
  form_type: FormType
  sections: FormSection[]
  is_active: boolean
  created_at: string
  updated_at: string
}

// Form validation schemas
export interface IntakeFormData {
  // Personal Information (auto-filled from profile)
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  
  // Emergency Contact
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  
  // Health History
  medicalConditions: MedicalCondition[]
  surgeries: Surgery[]
  injuries: Injury[]
  
  // Current Health
  painAreas: PainArea[]
  overallPainLevel: number
  currentMedications: string[]
  allergies: string[]
  
  // Lifestyle
  occupation: string
  exerciseFrequency: string
  stressLevel: number
  sleepQuality: number
  
  // Massage Experience
  previousMassageExperience: boolean
  lastMassageDate?: string
  massageFrequency?: string
  pressurePreference: PressurePreference
  areasToAvoid: string[]
  preferredTechniques: string[]
  
  // Goals
  treatmentGoals: string
  specificConcerns: string
  
  // Consent
  consentAgreements: ConsentAgreements
  signature?: string
  signatureDate?: string
}