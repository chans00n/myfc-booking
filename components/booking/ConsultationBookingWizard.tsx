"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useBooking } from "@/contexts/BookingContext";
import { ServiceSelectionEnhanced } from "./steps/ServiceSelectionEnhanced";
import { ConsultationTypeSelection } from "./ConsultationTypeSelection";
import { DateTimeSelection } from "./steps/DateTimeSelection";
import { ClientInformation } from "./steps/ClientInformation";
import { ConsultationIntakeForm } from "@/components/forms/ConsultationIntakeForm";
import { IntakeFormStep } from "./steps/IntakeFormStep";
import { PaymentPreferenceStep } from "./steps/PaymentPreferenceStep";
import { PaymentStep } from "./steps/PaymentStep";
import { ConsultationConfirmation } from "./steps/ConsultationConfirmation";
import { Confirmation } from "./steps/Confirmation";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Step {
  id: number;
  title: string;
  description: string;
  forConsultation?: boolean;
  forMassage?: boolean;
}

const ALL_STEPS: Step[] = [
  { id: 1, title: "Service", description: "Choose your service" },
  {
    id: 2,
    title: "Consultation Type",
    description: "How would you like to meet?",
    forConsultation: true,
  },
  { id: 3, title: "Date & Time", description: "Select appointment time" },
  { id: 4, title: "Information", description: "Your contact details" },
  { id: 5, title: "Health Form", description: "Health & preferences" },
  { id: 6, title: "Payment Method", description: "Choose payment option", forMassage: true },
  { id: 7, title: "Payment", description: "Secure payment", forMassage: true },
  { id: 8, title: "Confirmation", description: "Booking complete" },
];

export function ConsultationBookingWizard() {
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const {
    bookingData,
    currentStep,
    setCurrentStep,
    canProceedToStep,
    resetBooking,
    updateBookingData,
  } = useBooking();

  const [isValidStep, setIsValidStep] = useState(false);
  const serviceId = searchParams.get("service");
  const rescheduleId = searchParams.get("reschedule");

  // Remove the confusing dynamic step filtering

  // Reset booking data when component mounts to ensure clean state
  useEffect(() => {
    // Only reset if we have stale data and NOT coming from reschedule
    if (currentStep === 1 && bookingData.intakeFormId && !rescheduleId) {
      console.log(
        "Resetting booking context due to stale intake form ID:",
        bookingData.intakeFormId
      );
      resetBooking();
    }

    // Store rescheduleId in booking context if present
    if (rescheduleId && rescheduleId !== bookingData.rescheduleId) {
      console.log("Setting rescheduleId in booking context:", rescheduleId);
      updateBookingData({ rescheduleId });
    }
  }, [rescheduleId]);

  const handleNext = () => {
    console.log("handleNext called:", {
      currentStep,
      isConsultation: bookingData.isConsultation,
      hasService: !!bookingData.service,
      service: bookingData.service,
    });

    // Simple step progression based on current step and service type
    if (currentStep === 1) {
      // After service selection
      console.log("After service selection, isConsultation:", bookingData.isConsultation);
      if (bookingData.isConsultation) {
        console.log("Going to step 2 (consultation type)");
        setCurrentStep(2); // Go to consultation type
      } else {
        console.log("Going to step 3 (date/time)");
        setCurrentStep(3); // Skip to date/time for regular services
      }
    } else if (currentStep === 2) {
      // After consultation type (only for consultations)
      setCurrentStep(3); // Go to date/time
    } else if (currentStep === 3) {
      // After date/time
      setCurrentStep(4); // Go to client info
    } else if (currentStep === 4) {
      // After client info
      setCurrentStep(5); // Go to intake form
    } else if (currentStep === 5) {
      // After intake form
      if (bookingData.isConsultation) {
        setCurrentStep(8); // Skip to confirmation for consultations
      } else {
        setCurrentStep(6); // Go to payment preference for regular services
      }
    } else if (currentStep === 6) {
      // After payment preference
      if (bookingData.paymentPreference === "pay_now") {
        setCurrentStep(7); // Go to payment
      } else {
        setCurrentStep(8); // Skip to confirmation
      }
    } else if (currentStep === 7) {
      // After payment
      setCurrentStep(8); // Go to confirmation
    }
  };

  const handlePrevious = () => {
    // Simple step regression based on current step and service type
    if (currentStep === 2) {
      // From consultation type back to service
      setCurrentStep(1);
    } else if (currentStep === 3) {
      // From date/time
      if (bookingData.isConsultation) {
        setCurrentStep(2); // Back to consultation type
      } else {
        setCurrentStep(1); // Back to service selection
      }
    } else if (currentStep === 4) {
      // From client info back to date/time
      setCurrentStep(3);
    } else if (currentStep === 5) {
      // From intake form back to client info
      setCurrentStep(4);
    } else if (currentStep === 6) {
      // From payment preference back to intake form
      setCurrentStep(5);
    } else if (currentStep === 7) {
      // From payment back to payment preference
      setCurrentStep(6);
    } else if (currentStep === 8) {
      // From confirmation
      if (bookingData.isConsultation) {
        setCurrentStep(5); // Back to intake form
      } else if (bookingData.paymentPreference === "pay_now") {
        setCurrentStep(7); // Back to payment
      } else {
        setCurrentStep(6); // Back to payment preference
      }
    }
  };

  // Calculate progress based on actual steps
  const getTotalSteps = () => {
    return bookingData.isConsultation ? 5 : 6; // consultations have fewer steps
  };

  const getCurrentStepNumber = () => {
    if (!bookingData.isConsultation && currentStep > 2) {
      return currentStep - 1; // Adjust for skipped consultation type step
    }
    return currentStep;
  };

  const totalSteps = getTotalSteps();
  const currentStepNumber = getCurrentStepNumber();
  const progress = ((currentStepNumber - 1) / (totalSteps - 1)) * 100;

  const renderStep = () => {
    console.log("Rendering step:", currentStep, "isConsultation:", bookingData.isConsultation);
    switch (currentStep) {
      case 1:
        return (
          <ServiceSelectionEnhanced onValidate={setIsValidStep} preSelectedServiceId={serviceId} />
        );
      case 2:
        // Only shown for consultations
        return <ConsultationTypeSelection onValidate={setIsValidStep} />;
      case 3:
        // Date/time selection for all services
        return <DateTimeSelection onValidate={setIsValidStep} />;
      case 4:
        // Client information for all services
        return <ClientInformation onValidate={setIsValidStep} />;
      case 5:
        // Intake form for all services
        return bookingData.isConsultation ? (
          <ConsultationIntakeForm
            onSubmit={() => {
              setIsValidStep(true);
              handleNext();
            }}
          />
        ) : (
          <IntakeFormStep onValidate={setIsValidStep} />
        );
      case 6:
        // Payment preference for regular services only
        return <PaymentPreferenceStep onValidate={setIsValidStep} />;
      case 7:
        // Payment step if pay_now selected
        return <PaymentStep onValidate={setIsValidStep} />;
      case 8:
        return bookingData.isConsultation ? <ConsultationConfirmation /> : <Confirmation />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    const titles = {
      1: { title: "Service", description: "Choose your service" },
      2: { title: "Consultation Type", description: "How would you like to meet?" },
      3: { title: "Date & Time", description: "Select appointment time" },
      4: { title: "Information", description: "Your contact details" },
      5: { title: "Health Form", description: "Health & preferences" },
      6: { title: "Payment Method", description: "Choose payment option" },
      7: { title: "Payment", description: "Secure payment" },
      8: { title: "Confirmation", description: "Booking complete" },
    };
    return titles[currentStep] || { title: "", description: "" };
  };

  const currentStepInfo = getStepTitle();

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{currentStepInfo.title}</h2>
          <p className="text-sm text-muted-foreground">{currentStepInfo.description}</p>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>
            Step {currentStepNumber} of {totalSteps}
          </span>
          <span>{Math.round(progress)}% complete</span>
        </div>
      </div>

      {/* Step content */}
      <div className="mb-8">{renderStep()}</div>

      {/* Navigation */}
      {currentStep !== 8 && (
        <div className="flex justify-between sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-t">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentStep !== 5 || !bookingData.isConsultation ? (
            <Button
              onClick={() => {
                console.log("Next button clicked, current state:", {
                  currentStep,
                  isConsultation: bookingData.isConsultation,
                  service: bookingData.service,
                  isValidStep,
                });
                handleNext();
              }}
              disabled={!isValidStep || (currentStep === 1 && !bookingData.service)}
            >
              {currentStep === 8 ? "Complete Booking" : "Next"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
