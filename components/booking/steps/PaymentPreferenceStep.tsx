"use client";

import { useState, useEffect } from "react";
import { useBooking } from "@/contexts/BookingContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, DollarSign, Clock, Info } from "lucide-react";
import type { PaymentPreference } from "@/types";

interface PaymentPreferenceStepProps {
  onValidate: (isValid: boolean) => void;
}

export function PaymentPreferenceStep({ onValidate }: PaymentPreferenceStepProps) {
  const { bookingData, updateBookingData } = useBooking();
  const [preference, setPreference] = useState<PaymentPreference>(
    bookingData.paymentPreference || "pay_at_appointment"
  );

  useEffect(() => {
    updateBookingData({ paymentPreference: preference });
    onValidate(true); // Payment preference is always valid once selected
  }, [preference, updateBookingData, onValidate]);

  const handlePreferenceChange = (value: string) => {
    setPreference(value as PaymentPreference);
  };

  const servicePrice = bookingData.service
    ? `$${(bookingData.service.price_cents / 100).toFixed(2)}`
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Payment Method</h2>
        <p className="text-muted-foreground">Choose how you'd like to pay for your appointment</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Payment Preference</CardTitle>
          <CardDescription>
            Service: {bookingData.service?.name} - {servicePrice}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={preference} onValueChange={handlePreferenceChange}>
            <div className="space-y-4">
              {/* Pay at Appointment - Default Option */}
              <label
                htmlFor="pay_at_appointment"
                className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem
                  value="pay_at_appointment"
                  id="pay_at_appointment"
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <Label
                      htmlFor="pay_at_appointment"
                      className="text-base font-medium cursor-pointer"
                    >
                      Pay at Appointment (Recommended)
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pay when you arrive for your appointment. We accept cash, card, or check.
                  </p>
                </div>
              </label>

              {/* Pay Cash */}
              <label
                htmlFor="pay_cash"
                className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem value="pay_cash" id="pay_cash" className="mt-1" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <Label htmlFor="pay_cash" className="text-base font-medium cursor-pointer">
                      Pay Cash at Appointment
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bring cash to pay at your appointment. Please bring exact change if possible.
                  </p>
                </div>
              </label>

              {/* Pay Now Online */}
              <label
                htmlFor="pay_now"
                className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem value="pay_now" id="pay_now" className="mt-1" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <Label htmlFor="pay_now" className="text-base font-medium cursor-pointer">
                      Pay Now Online
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Secure payment through Stripe. Pay now to confirm your appointment immediately.
                  </p>
                </div>
              </label>
            </div>
          </RadioGroup>

          {preference === "pay_now" && (
            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertDescription>
                You'll be redirected to secure payment on the next step. Your appointment will be
                confirmed immediately after payment.
              </AlertDescription>
            </Alert>
          )}

          {preference === "pay_cash" && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Please bring {servicePrice} in cash to your appointment. We appreciate exact change
                when possible.
              </AlertDescription>
            </Alert>
          )}

          {preference === "pay_at_appointment" && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Payment of {servicePrice} will be collected when you arrive. We accept cash, credit
                card, or check.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
