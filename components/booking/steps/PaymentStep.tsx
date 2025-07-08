"use client";

import { useState, useEffect, useRef } from "react";
import { useBooking } from "@/contexts/BookingContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  createAppointment,
  generateConfirmationNumber,
  cancelAppointment,
} from "@/lib/appointments";
import { createClient } from "@/lib/supabase/client";
import { StripePaymentForm } from "@/components/payment/StripePaymentForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface PaymentStepProps {
  onValidate: (isValid: boolean) => void;
}

export function PaymentStep({ onValidate }: PaymentStepProps) {
  const { user } = useAuth();
  const { bookingData, updateBookingData, setCurrentStep } = useBooking();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<{
    clientSecret: string;
    amount: number;
  } | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);
  const [hasCreatedAppointment, setHasCreatedAppointment] = useState(false);

  useEffect(() => {
    onValidate(false); // Payment always starts as invalid
  }, [onValidate]);

  // Create appointment and payment intent when component mounts
  useEffect(() => {
    if (!bookingData.service || !bookingData.date || !bookingData.timeSlot || !user?.id) {
      return;
    }

    // Use refs to ensure this only runs once even with StrictMode
    if (!initializedRef.current && !initializingRef.current) {
      initializingRef.current = true;
      createAppointmentAndPaymentIntent().finally(() => {
        initializedRef.current = true;
      });
    }
  }, [bookingData.service, bookingData.date, bookingData.timeSlot, user?.id]);

  const createAppointmentAndPaymentIntent = async () => {
    if (
      !bookingData.service ||
      !bookingData.date ||
      !bookingData.timeSlot ||
      !bookingData.clientInfo
    ) {
      setError("Missing booking information");
      return;
    }

    // Prevent duplicate creation
    if (hasCreatedAppointment) {
      console.log("Already created appointment, skipping duplicate creation");
      return;
    }

    // Check if we already have an appointment ID in booking data
    if (bookingData.appointmentId) {
      console.log("Appointment already created:", bookingData.appointmentId);
      setAppointmentId(bookingData.appointmentId);

      // Check if we already have a payment intent
      if (bookingData.paymentIntentId && bookingData.paymentClientSecret) {
        setPaymentIntent({
          clientSecret: bookingData.paymentClientSecret,
          amount: bookingData.service.price_cents,
        });
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setHasCreatedAppointment(true);

    try {
      // If this is a reschedule, cancel the old appointment first
      if (bookingData.rescheduleId) {
        console.log("Cancelling old appointment:", bookingData.rescheduleId);
        const { success: cancelSuccess, error: cancelError } = await cancelAppointment(
          bookingData.rescheduleId
        );

        if (!cancelSuccess) {
          console.error("Failed to cancel old appointment:", cancelError);
          // Continue with creating new appointment even if cancel fails
        }
      }

      // First create the appointment
      const { appointment, error: appointmentError } = await createAppointment({
        serviceId: bookingData.service.id,
        clientId: user?.id,
        appointmentDate: bookingData.date,
        startTime: format(bookingData.timeSlot.start, "HH:mm:ss"),
        endTime: format(bookingData.timeSlot.end, "HH:mm:ss"),
        totalPriceCents: bookingData.service.price_cents,
        paymentPreference: "pay_now", // Since we're in PaymentStep, it's always pay_now
        notes: "",
        guestEmail: bookingData.isGuest ? bookingData.clientInfo.email : undefined,
        guestFirstName: bookingData.isGuest ? bookingData.clientInfo.firstName : undefined,
        guestLastName: bookingData.isGuest ? bookingData.clientInfo.lastName : undefined,
        guestPhone: bookingData.isGuest ? bookingData.clientInfo.phone : undefined,
      });

      if (appointmentError || !appointment) {
        setError(appointmentError || "Failed to create appointment");
        return;
      }

      // Link intake form to appointment if one was created
      if (bookingData.intakeFormId && appointment.id) {
        const supabase = createClient();
        await supabase
          .from("intake_forms")
          .update({ appointment_id: appointment.id })
          .eq("id", bookingData.intakeFormId);
      }

      setAppointmentId(appointment.id);
      updateBookingData({ appointmentId: appointment.id });

      // Small delay to ensure appointment is committed to database
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create payment intent via API
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointment_id: appointment.id,
          amount_cents: bookingData.service.price_cents,
          description: `${bookingData.service.name} appointment`,
          metadata: {
            service_name: bookingData.service.name,
            appointment_date: format(bookingData.date, "yyyy-MM-dd"),
            appointment_time: format(bookingData.timeSlot.start, "HH:mm"),
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setError(error.error || "Failed to create payment intent");
        return;
      }

      const paymentData = await response.json();

      if (paymentData) {
        setPaymentIntent({
          clientSecret: paymentData.client_secret,
          amount: paymentData.amount_cents,
        });
        updateBookingData({
          paymentIntentId: paymentData.payment_intent_id,
          paymentClientSecret: paymentData.client_secret,
        });
      }
    } catch (err) {
      console.error("Setup error:", err);
      setError("An error occurred setting up payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    // Payment successful, store confirmation details
    const confirmationNumber = generateConfirmationNumber();

    if (appointmentId) {
      sessionStorage.setItem(
        "lastAppointment",
        JSON.stringify({
          id: appointmentId,
          confirmationNumber,
          paymentIntentId,
        })
      );
    }

    onValidate(true);
    setCurrentStep(6);
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  if (!bookingData.service || !bookingData.date || !bookingData.timeSlot) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Missing booking information
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Payment</h2>
        <p className="text-muted-foreground">Review your booking and complete payment</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium">{bookingData.service.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{format(bookingData.date, "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span className="font-medium">{format(bookingData.timeSlot.start, "h:mm a")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{bookingData.service.duration_minutes} minutes</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>${(bookingData.service.price_cents / 100).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Setting up secure payment...</p>
            </div>
          </CardContent>
        </Card>
      ) : paymentIntent ? (
        <StripePaymentForm
          clientSecret={paymentIntent.clientSecret}
          amount={paymentIntent.amount}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to set up payment. Please refresh the page and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
