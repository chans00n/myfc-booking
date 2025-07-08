"use client";

import { useState } from "react";
import { PaymentElement, Elements, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { STRIPE_CONFIG } from "@/lib/stripe/config";
import { useToast } from "@/hooks/use-toast";

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

function PaymentForm({ clientSecret, amount, onSuccess, onError }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmation`,
        },
        redirect: "if_required",
      });

      if (submitError) {
        setError(submitError.message || "Payment failed");
        onError?.(submitError.message || "Payment failed");
        toast({
          title: "Payment failed",
          description: submitError.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast({
          title: "Payment successful",
          description: "Your payment has been processed successfully.",
        });
        onSuccess?.(paymentIntent.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Enter your payment information to complete your booking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-lg font-semibold">Total Amount: ${(amount / 100).toFixed(2)}</div>

          <PaymentElement
            options={{
              layout: "tabs",
              wallets: {
                applePay: "auto",
                googlePay: "auto",
              },
            }}
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Button type="submit" disabled={!stripe || isProcessing} className="w-full" size="lg">
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing payment...
          </>
        ) : (
          `Pay $${(amount / 100).toFixed(2)}`
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        <p>Your payment information is secure and encrypted.</p>
        <p className="mt-1">Powered by Stripe</p>
      </div>
    </form>
  );
}

export function StripePaymentForm(props: StripePaymentFormProps) {
  const options = {
    clientSecret: props.clientSecret,
    appearance: STRIPE_CONFIG.appearance,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} />
    </Elements>
  );
}
