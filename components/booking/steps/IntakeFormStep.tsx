'use client'

import { useState, useEffect } from 'react'
import { useBooking } from '@/contexts/BookingContext'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { IntakeForm } from '@/components/intake/IntakeForm'
import { ReturningClientForm } from '@/components/intake/ReturningClientForm'
import { checkIntakeFormRequired, createIntakeForm, getIntakeForm } from '@/lib/intake-forms'
import type { FormType } from '@/types/intake-forms'

interface IntakeFormStepProps {
  onValidate: (isValid: boolean) => void
}

export function IntakeFormStep({ onValidate }: IntakeFormStepProps) {
  const { bookingData, updateBookingData } = useBooking()
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [formRequired, setFormRequired] = useState(false)
  const [formType, setFormType] = useState<FormType>('new_client')
  const [formId, setFormId] = useState<string | null>(null)
  const [lastFormDate, setLastFormDate] = useState<Date | undefined>()
  const [formCompleted, setFormCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!isInitialized) {
      checkIntakeRequirement()
    }
  }, [user, bookingData.selectedDate, isInitialized])

  const createNewForm = async (userId: string, formType: FormType) => {
    const { data: newForm, error: createError } = await createIntakeForm(
      userId,
      formType
      // appointmentId will be linked later when appointment is created
    )

    if (createError) {
      setError(createError)
    } else if (newForm) {
      setFormId(newForm.id)
      updateBookingData({ intakeFormId: newForm.id })
    } else {
      setError('Failed to create intake form')
    }
  }

  const checkIntakeRequirement = async () => {
    if (!user || !bookingData.selectedDate) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Check if an intake form is required
      const requirement = await checkIntakeFormRequired(
        user.id,
        new Date(bookingData.selectedDate)
      )

      console.log('Intake form requirement check:', {
        userId: user.id,
        appointmentDate: bookingData.selectedDate,
        requirement,
        daysSinceLastForm: requirement.lastFormDate 
          ? Math.floor((new Date(bookingData.selectedDate).getTime() - requirement.lastFormDate.getTime()) / (1000 * 60 * 60 * 24))
          : 'No previous form'
      })
      
      setFormRequired(requirement.required)
      setFormType(requirement.formType)
      setLastFormDate(requirement.lastFormDate)

      if (requirement.required) {
        // Check if we already have a form ID in booking data
        if (bookingData.intakeFormId) {
          console.log('Checking existing intake form:', {
            formId: bookingData.intakeFormId,
            userId: user.id,
            timestamp: new Date().toISOString()
          })
          
          const { data: existingForm } = await getIntakeForm(bookingData.intakeFormId)
          
          // Verify the form belongs to the current user
          if (existingForm && existingForm.client_id === user.id) {
            console.log('Form ownership verified for user:', user.id)
            if (existingForm.status === 'submitted') {
              setFormCompleted(true)
              onValidate(true)
            } else {
              // Use existing draft form
              setFormId(bookingData.intakeFormId)
            }
          } else {
            // Form doesn't belong to user or doesn't exist
            console.warn('Form ownership mismatch or not found:', {
              formId: bookingData.intakeFormId,
              formOwnerId: existingForm?.client_id,
              currentUserId: user.id
            })
            // Clear the invalid ID and create a new form
            updateBookingData({ intakeFormId: null })
            await createNewForm(user.id, requirement.formType)
          }
        } else {
          // Create a new intake form for this booking
          await createNewForm(user.id, requirement.formType)
        }
      } else {
        // No form required
        onValidate(true)
      }
    } catch (err) {
      setError('Failed to check intake form requirement')
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
  }

  const handleFormComplete = () => {
    setFormCompleted(true)
    onValidate(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading intake form requirements...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!formRequired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Intake Form Up to Date
          </CardTitle>
          <CardDescription>
            Your health information is current. No new intake form is required for this appointment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We have your intake form on file from {lastFormDate?.toLocaleDateString()}.
            If you have any updates to your health information, please inform your therapist at the appointment.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (formCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Intake Form Completed
          </CardTitle>
          <CardDescription>
            Thank you for completing your intake form. Your information has been saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Your therapist will review your intake form before your appointment.
              If you need to make any changes, please contact us.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!formId) {
    // If we don't have a form ID but also not loading, try to create one
    if (!loading && formRequired && user) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to create intake form. Please try refreshing the page or contact support.
            <br />
            <small className="text-xs">Debug: formRequired={String(formRequired)}, formType={formType}</small>
          </AlertDescription>
        </Alert>
      )
    }
    
    // Still initializing
    return null
  }

  // Show appropriate form based on client type
  if (formType === 'new_client') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Health Intake Form</h2>
          <p className="text-muted-foreground">
            As a new client, please complete this comprehensive health form to help us provide you with the best care.
          </p>
        </div>

        <IntakeForm
          formId={formId}
          clientProfile={profile}
          clientId={user?.id}
          onComplete={handleFormComplete}
        />
      </div>
    )
  }

  // Returning client form
  return (
    <div className="space-y-6">
      <ReturningClientForm
        formId={formId}
        clientId={user?.id || ''}
        clientProfile={profile}
        lastFormDate={lastFormDate}
        onComplete={handleFormComplete}
      />
    </div>
  )
}