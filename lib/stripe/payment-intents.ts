import { stripe } from "./config";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { CreatePaymentIntentRequest, PaymentIntentResponse } from "@/types/payments";

export async function createPaymentIntent({
  appointment_id,
  amount_cents,
  description,
  metadata = {},
}: CreatePaymentIntentRequest): Promise<{ data?: PaymentIntentResponse; error?: string }> {
  // This function should only be called from server-side code
  if (!stripe) {
    return {
      error: "Stripe is not configured. This function must be called from server-side code.",
    };
  }

  try {
    // Use regular client for reading data
    const supabase = await createClient();
    // Use service client for writing data (bypasses RLS)
    const serviceClient = createServiceClient();

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(
        `
        *,
        client:profiles!appointments_client_id_fkey(
          id,
          email,
          first_name,
          last_name,
          stripe_customer_id
        ),
        service:services(*)
      `
      )
      .eq("id", appointment_id)
      .single();

    if (appointmentError || !appointment) {
      return { error: "Appointment not found" };
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = appointment.client.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe!.customers.create({
        email: appointment.client.email,
        name: `${appointment.client.first_name} ${appointment.client.last_name}`,
        metadata: {
          supabase_user_id: appointment.client.id,
        },
      });

      stripeCustomerId = customer.id;

      // Save Stripe customer ID to profile using service client
      await serviceClient
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", appointment.client.id);
    }

    // Create payment intent
    const paymentIntent = await stripe!.paymentIntents.create({
      amount: amount_cents,
      currency: "usd",
      customer: stripeCustomerId,
      description:
        description || `Payment for ${appointment.service.name} on ${appointment.appointment_date}`,
      metadata: {
        appointment_id,
        client_id: appointment.client.id,
        service_id: appointment.service.id,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create payment record in database using service client
    const { data: paymentRecord, error: paymentError } = await serviceClient
      .from("payments")
      .insert({
        appointment_id,
        client_id: appointment.client.id,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: stripeCustomerId,
        amount_cents,
        currency: "usd",
        status: "pending",
        description: paymentIntent.description,
        metadata: paymentIntent.metadata,
      })
      .select("id")
      .single();

    console.log("Payment record creation:", {
      paymentIntent: paymentIntent.id,
      paymentRecord,
      paymentError,
    });

    if (paymentError) {
      // Cancel the payment intent if we can't save to database
      await stripe!.paymentIntents.cancel(paymentIntent.id);
      console.error("Failed to create payment record:", {
        error: paymentError,
        code: paymentError.code,
        details: paymentError.details,
        hint: paymentError.hint,
        message: paymentError.message,
      });
      return {
        error: `Failed to create payment record: ${paymentError.message} (code: ${paymentError.code})`,
      };
    }

    // Log payment event with the correct payment_id (UUID from payments table)
    if (paymentRecord?.id) {
      await serviceClient.from("payment_events").insert({
        payment_id: paymentRecord.id,
        event_type: "payment_intent.created",
        event_data: {
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          customer: paymentIntent.customer,
          stripe_payment_intent_id: paymentIntent.id,
        },
      });
    }

    return {
      data: {
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret!,
        amount_cents: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return { error: "Failed to create payment intent" };
  }
}

export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<{ success: boolean; error?: string }> {
  if (!stripe) {
    return { success: false, error: "Stripe is not configured" };
  }

  try {
    const serviceClient = createServiceClient();

    // Cancel in Stripe
    await stripe.paymentIntents.cancel(paymentIntentId);

    // Get payment record to get the UUID
    const { data: payment } = await serviceClient
      .from("payments")
      .select("id")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .single();

    // Update payment status in database
    await serviceClient
      .from("payments")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", paymentIntentId);

    // Log event with correct payment_id
    if (payment?.id) {
      await serviceClient.from("payment_events").insert({
        payment_id: payment.id,
        event_type: "payment_intent.canceled",
        event_data: {},
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error canceling payment intent:", error);
    return { success: false, error: "Failed to cancel payment" };
  }
}

export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<{ data?: any; error?: string }> {
  if (!stripe) {
    return { error: "Stripe is not configured" };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return { data: paymentIntent };
  } catch (error) {
    console.error("Error retrieving payment intent:", error);
    return { error: "Failed to retrieve payment intent" };
  }
}
