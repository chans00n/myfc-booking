'use client'

import { useState, useEffect } from 'react'
import { useBooking } from '@/contexts/BookingContext'
import { ServiceSelection } from './steps/ServiceSelection'
import { DateTimeSelection } from './steps/DateTimeSelection'
import { ClientInformation } from './steps/ClientInformation'
import { IntakeFormStep } from './steps/IntakeFormStep'
import { PaymentPreferenceStep } from './steps/PaymentPreferenceStep'
import { PaymentStep } from './steps/PaymentStep'
import { Confirmation } from './steps/Confirmation'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const STEPS = [
  { id: 1, title: 'Service', description: 'Choose your massage service' },
  { id: 2, title: 'Date & Time', description: 'Select appointment time' },
  { id: 3, title: 'Information', description: 'Your contact details' },
  { id: 4, title: 'Health Form', description: 'Health & preferences' },
  { id: 5, title: 'Payment Method', description: 'Choose payment option' },
  { id: 6, title: 'Payment', description: 'Secure payment' },
  { id: 7, title: 'Confirmation', description: 'Booking complete' },
]

export function BookingWizard() {
  const { user, profile } = useAuth()
  const { 
    bookingData, 
    currentStep, 
    setCurrentStep, 
    canProceedToStep,
    resetBooking 
  } = useBooking()
  
  const [isValidStep, setIsValidStep] = useState(false)

  // Reset booking data when component mounts to ensure clean state
  useEffect(() => {
    // Only reset if we're starting fresh (step 1) and have an intakeFormId from a previous session
    if (currentStep === 1 && bookingData.intakeFormId) {
      console.log('Resetting booking context due to stale intake form ID:', bookingData.intakeFormId)
      resetBooking()
    }
  }, [])

  // Removed useEffect that was duplicating client info logic
  // This is now handled in ClientInformation component

  const handleNext = () => {
    if (currentStep < STEPS.length && canProceedToStep(currentStep + 1)) {
      // Skip payment step if not paying online
      if (currentStep === 5 && bookingData.paymentPreference !== 'pay_now') {
        setCurrentStep(7) // Jump to confirmation
      } else {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      // Skip payment step when going back if not paying online
      if (currentStep === 7 && bookingData.paymentPreference !== 'pay_now') {
        setCurrentStep(5) // Jump back to payment preference
      } else {
        setCurrentStep(currentStep - 1)
      }
    }
  }

  const effectiveStep = currentStep === 7 && bookingData.paymentPreference !== 'pay_now' ? 6 : currentStep
  const totalSteps = bookingData.paymentPreference === 'pay_now' ? 7 : 6
  const progress = ((effectiveStep - 1) / (totalSteps - 1)) * 100

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ServiceSelection onValidate={setIsValidStep} />
      case 2:
        return <DateTimeSelection onValidate={setIsValidStep} />
      case 3:
        return <ClientInformation onValidate={setIsValidStep} />
      case 4:
        return <IntakeFormStep onValidate={setIsValidStep} />
      case 5:
        return <PaymentPreferenceStep onValidate={setIsValidStep} />
      case 6:
        return bookingData.paymentPreference === 'pay_now' 
          ? <PaymentStep onValidate={setIsValidStep} />
          : null // This case should be skipped by handleNext
      case 7:
        return <Confirmation />
      default:
        return null
    }
  }

  const currentStepInfo = STEPS[currentStep - 1]

  return (
    <div className="w-full">
      <div className="pb-24 sm:pb-0">
        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 mb-3">
            <h2 className="text-lg sm:text-xl font-semibold">{currentStepInfo.title}</h2>
            <span className="text-sm text-muted-foreground">
              Step {currentStep === 7 && bookingData.paymentPreference !== 'pay_now' ? '6' : currentStep} of {bookingData.paymentPreference === 'pay_now' ? '7' : '6'}
            </span>
          </div>
          <Progress value={progress} className="h-2 sm:h-3" />
          <p className="text-sm text-muted-foreground mt-2">{currentStepInfo.description}</p>
        </div>


        {/* Step Content */}
        <div className="mb-6 sm:mb-8 min-h-[300px]">
          {renderStep()}
        </div>

        {/* Navigation - Desktop */}
        {currentStep < STEPS.length && (
          <div className="hidden sm:flex sm:justify-between gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              size="lg"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!isValidStep}
              size="lg"
            >
              {currentStep === 5 && bookingData.paymentPreference !== 'pay_now' ? 'Complete Booking' : 
               currentStep === 6 ? 'Complete Booking' : 'Next'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Sticky Navigation - Mobile */}
      {currentStep < STEPS.length && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg sm:hidden z-50">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex-1"
              size="lg"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!isValidStep}
              className="flex-1"
              size="lg"
            >
              {currentStep === 5 && bookingData.paymentPreference !== 'pay_now' ? 'Complete' : 
               currentStep === 6 ? 'Complete' : 'Next'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}