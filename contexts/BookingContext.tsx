"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Service, TimeSlot, PaymentPreference } from "@/types";

export interface BookingData {
  // Step 1
  service?: Service;

  // Consultation-specific
  isConsultation?: boolean;
  consultationType?: "phone" | "video" | "in_person";

  // Step 2
  date?: Date;
  timeSlot?: TimeSlot;

  // Step 3
  clientInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };

  // Step 4
  intakeForm?: {
    healthConditions?: string;
    medications?: string;
    allergies?: string;
    massageExperience?: string;
    pressurePreference?: "light" | "medium" | "firm" | "deep";
    focusAreas?: string;
    avoidAreas?: string;
    goals?: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    signature?: string;
  };

  // Consultation-specific intake
  consultationIntake?: {
    primaryConcerns?: string;
    massageGoals?: string;
    previousMassageExperience?: string;
    preferredPressure?: string;
    bestTimeToCall?: string;
    preferredContactMethod?: "phone" | "video" | "in_person";
    communicationPreferences?: string;
  };

  // Step 5 - Payment Preference
  paymentPreference?: PaymentPreference;

  // Step 6 - Payment (if pay_now selected)
  paymentIntentId?: string;
  paymentClientSecret?: string;

  // Metadata
  isGuest: boolean;
  isNewClient: boolean;
  intakeFormId?: string;
  appointmentId?: string;
  consultationId?: string;
  selectedDate?: string;
  rescheduleId?: string; // ID of appointment being rescheduled
}

interface BookingContextType {
  bookingData: BookingData;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  updateBookingData: (data: Partial<BookingData>) => void;
  resetBooking: () => void;
  canProceedToStep: (step: number) => boolean;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const initialBookingData: BookingData = {
  isGuest: false,
  isNewClient: true,
};

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingData, setBookingData] = useState<BookingData>(initialBookingData);
  const [currentStep, setCurrentStep] = useState(1);

  const updateBookingData = useCallback((data: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));
  }, []);

  const resetBooking = () => {
    setBookingData(initialBookingData);
    setCurrentStep(1);
  };

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 2:
        return !!bookingData.service;
      case 3:
        // Can proceed to date/time selection if service is selected
        return !!bookingData.service;
      case 4:
        // Can proceed to client info if date/time is selected
        return !!bookingData.service && !!bookingData.date && !!bookingData.timeSlot;
      case 5:
        // Payment preference step - always accessible after client info
        return (
          !!bookingData.service &&
          !!bookingData.date &&
          !!bookingData.timeSlot &&
          !!bookingData.clientInfo
        );
      case 6:
        // Payment step - only required if pay_now is selected
        if (bookingData.paymentPreference === "pay_now") {
          return (
            !!bookingData.service &&
            !!bookingData.date &&
            !!bookingData.timeSlot &&
            !!bookingData.clientInfo &&
            !!bookingData.paymentPreference
          );
        }
        // For other payment preferences, can proceed directly to confirmation
        return (
          !!bookingData.service &&
          !!bookingData.date &&
          !!bookingData.timeSlot &&
          !!bookingData.clientInfo &&
          !!bookingData.paymentPreference
        );
      case 7:
        // Confirmation step
        if (bookingData.paymentPreference === "pay_now") {
          return !!bookingData.paymentIntentId;
        }
        return !!bookingData.paymentPreference;
      default:
        return true;
    }
  };

  const value = {
    bookingData,
    currentStep,
    setCurrentStep,
    updateBookingData,
    resetBooking,
    canProceedToStep,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}
