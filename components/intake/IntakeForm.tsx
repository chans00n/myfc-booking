'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ChevronLeft, ChevronRight, Save, Send } from 'lucide-react'
import { PersonalInfoSection } from './sections/PersonalInfoSection'
import { HealthHistorySection } from './sections/HealthHistorySection'
import { CurrentHealthSection } from './sections/CurrentHealthSection'
import { MassagePreferencesSection } from './sections/MassagePreferencesSection'
import { GoalsSection } from './sections/GoalsSection'
import { ConsentSection } from './sections/ConsentSection'
import { saveDraftIntakeForm, submitIntakeForm } from '@/lib/intake-forms'
import type { IntakeFormData, IntakeForm } from '@/types/intake-forms'

// Form validation schema
const intakeFormSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number is required'),
  dateOfBirth: z.string().optional(),
  
  // Emergency Contact
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(10, 'Emergency contact phone is required'),
  emergencyContactRelationship: z.string().min(1, 'Relationship is required'),
  
  // Health History
  medicalConditions: z.array(z.any()).default([]),
  surgeries: z.array(z.any()).default([]),
  injuries: z.array(z.any()).default([]),
  
  // Current Health
  painAreas: z.array(z.any()).default([]),
  overallPainLevel: z.number().min(0).max(10).default(0),
  currentMedications: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  
  // Lifestyle
  occupation: z.string().default(''),
  exerciseFrequency: z.string().default(''),
  stressLevel: z.number().min(0).max(10).default(5),
  sleepQuality: z.number().min(0).max(10).default(5),
  
  // Massage Experience
  previousMassageExperience: z.boolean().default(false),
  lastMassageDate: z.string().optional(),
  massageFrequency: z.string().optional(),
  pressurePreference: z.enum(['light', 'medium', 'firm', 'deep', 'varies']).default('medium'),
  areasToAvoid: z.array(z.string()).default([]),
  preferredTechniques: z.array(z.string()).default([]),
  
  // Goals
  treatmentGoals: z.string().min(1, 'Please describe your treatment goals'),
  specificConcerns: z.string().default(''),
  
  // Consent
  consentAgreements: z.object({
    informedConsent: z.boolean().refine(val => val === true, 'You must agree to informed consent'),
    liabilityRelease: z.boolean().refine(val => val === true, 'You must agree to liability release'),
    privacyPolicy: z.boolean().refine(val => val === true, 'You must agree to privacy policy'),
    cancellationPolicy: z.boolean().refine(val => val === true, 'You must agree to cancellation policy'),
    photographyConsent: z.boolean().optional(),
    marketingConsent: z.boolean().optional(),
  }),
  signature: z.string().optional(),
  signatureDate: z.string().optional(),
})

const FORM_SECTIONS = [
  { id: 'personal', title: 'Personal Information', description: 'Basic contact information' },
  { id: 'health-history', title: 'Health History', description: 'Medical conditions and history' },
  { id: 'current-health', title: 'Current Health', description: 'Current health status' },
  { id: 'preferences', title: 'Massage Preferences', description: 'Your massage preferences' },
  { id: 'goals', title: 'Treatment Goals', description: 'What you hope to achieve' },
  { id: 'consent', title: 'Consent & Signature', description: 'Review and sign' },
]

interface IntakeFormProps {
  formId: string
  initialData?: IntakeForm
  clientProfile?: any
  clientId?: string
  onComplete?: () => void
}

export function IntakeForm({ formId, initialData, clientProfile, clientId, onComplete }: IntakeFormProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  

  const form = useForm<IntakeFormData>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: {
      firstName: clientProfile?.first_name || '',
      lastName: clientProfile?.last_name || '',
      email: clientProfile?.email || '',
      phone: clientProfile?.phone || '',
      dateOfBirth: clientProfile?.date_of_birth || '',
      emergencyContactName: initialData?.emergency_contact_name || '',
      emergencyContactPhone: initialData?.emergency_contact_phone || '',
      emergencyContactRelationship: initialData?.emergency_contact_relationship || '',
      medicalConditions: initialData?.medical_conditions || [],
      surgeries: initialData?.surgeries || [],
      injuries: initialData?.injuries || [],
      painAreas: initialData?.pain_areas || [],
      overallPainLevel: initialData?.pain_level || 0,
      currentMedications: initialData?.current_medications || [],
      allergies: initialData?.allergies || [],
      occupation: '',
      exerciseFrequency: '',
      stressLevel: 5,
      sleepQuality: 5,
      previousMassageExperience: initialData?.previous_massage_experience || false,
      massageFrequency: initialData?.massage_frequency || '',
      pressurePreference: initialData?.pressure_preference || 'medium',
      areasToAvoid: initialData?.areas_to_avoid || [],
      preferredTechniques: initialData?.preferred_techniques || [],
      treatmentGoals: initialData?.treatment_goals || '',
      specificConcerns: initialData?.specific_concerns || '',
      consentAgreements: initialData?.consent_agreements || {
        informedConsent: false,
        liabilityRelease: false,
        privacyPolicy: false,
        cancellationPolicy: false,
        photographyConsent: false,
        marketingConsent: false,
      },
    }
  })

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (form.formState.isDirty && !isSaving) {
        await handleSaveDraft()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, []) // Empty dependency array - we don't want to restart the interval

  const handleSaveDraft = async () => {
    setIsSaving(true)
    const formData = form.getValues()
    
    const { error } = await saveDraftIntakeForm(formId, formData)
    
    if (error) {
      toast({
        title: 'Error saving draft',
        description: error,
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Draft saved',
        description: 'Your progress has been saved'
      })
    }
    
    setIsSaving(false)
  }

  const handleSubmit = async (data: IntakeFormData) => {
    if (!data.signature) {
      toast({
        title: 'Signature required',
        description: 'Please provide your signature to submit the form',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    
    // Update client profile with personal information
    const profileId = clientId || clientProfile?.id || initialData?.client_id
    if (profileId) {
      const { updateClientProfile } = await import('@/lib/profiles/update-profile')
      const { error: profileError } = await updateClientProfile(profileId, {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        date_of_birth: data.dateOfBirth
      })
      
      if (profileError) {
      } else {
      }
    } else {
    }
    
    // Save all form data first
    const { error: saveError } = await saveDraftIntakeForm(formId, data)
    
    if (saveError) {
      toast({
        title: 'Error saving form',
        description: saveError,
        variant: 'destructive'
      })
      setIsSubmitting(false)
      return
    }
    
    // Then submit with signature
    const result = await submitIntakeForm(formId, data.signature)
    
    if (result.error) {
      console.error('Intake form submission error:', result)
      toast({
        title: 'Error submitting form',
        description: result.error || 'An unknown error occurred. Please try again.',
        variant: 'destructive'
      })
      // Log additional error details for debugging
      if ((result as any).errorDetails) {
        console.error('Error details:', (result as any).errorDetails)
      }
    } else {
      toast({
        title: 'Form submitted successfully',
        description: 'Thank you for completing the intake form'
      })
      onComplete?.()
    }
    
    setIsSubmitting(false)
  }

  const nextSection = async () => {
    // Define which fields to validate for each section
    const sectionFields: Record<number, (keyof IntakeFormData)[]> = {
      0: ['firstName', 'lastName', 'email', 'phone', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelationship'],
      1: [], // Health history has optional fields
      2: [], // Current health has optional fields  
      3: [], // Massage preferences has optional fields
      4: ['treatmentGoals'], // Goals section requires treatment goals
      5: [] // Consent validation is handled differently
    }

    const fieldsToValidate = sectionFields[currentSection] || []
    let isValid = true
    
    if (fieldsToValidate.length > 0) {
      isValid = await form.trigger(fieldsToValidate as any)
      if (!isValid) {
        // Show a toast to inform the user
        toast({
          title: 'Please complete all required fields',
          description: 'Check the form for any errors',
          variant: 'destructive'
        })
        return
      }
    }
    
    if (currentSection < FORM_SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1)
      window.scrollTo(0, 0)
    }
  }

  const previousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
      window.scrollTo(0, 0)
    }
  }

  const progress = ((currentSection + 1) / FORM_SECTIONS.length) * 100
  const currentSectionInfo = FORM_SECTIONS[currentSection]

  const renderSection = () => {
    switch (currentSection) {
      case 0:
        return <PersonalInfoSection form={form} />
      case 1:
        return <HealthHistorySection form={form} />
      case 2:
        return <CurrentHealthSection form={form} />
      case 3:
        return <MassagePreferencesSection form={form} />
      case 4:
        return <GoalsSection form={form} />
      case 5:
        return <ConsentSection form={form} />
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold">{currentSectionInfo.title}</h2>
          <span className="text-sm text-muted-foreground">
            Section {currentSection + 1} of {FORM_SECTIONS.length}
          </span>
        </div>
        <p className="text-muted-foreground mb-4">{currentSectionInfo.description}</p>
        <Progress value={progress} className="h-2" />
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="min-h-[400px]">
          {renderSection()}
        </div>

        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={previousSection}
              disabled={currentSection === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentSection < FORM_SECTIONS.length - 1 && (
              <Button
                type="button"
                onClick={() => {
                  nextSection()
                }}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            
            {currentSection === FORM_SECTIONS.length - 1 && (
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}