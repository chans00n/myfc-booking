import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/config";
import { updatePaymentStatusWithRetry } from "@/lib/payments/webhook-helpers";
import { createServiceClient } from "@/lib/supabase/service";
import type Stripe from "stripe";

// Stripe webhook events we handle
const relevantEvents = new Set([
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
  "payment_intent.processing",
  "payment_intent.requires_action",
  "charge.refunded",
  "charge.dispute.created",
]);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the event
  if (relevantEvents.has(event.type)) {
    const supabase = createServiceClient();

    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;

          // Update payment status with retry mechanism
          await updatePaymentStatusWithRetry(
            paymentIntent.id,
            "succeeded",
            {
              paid_at: new Date().toISOString(),
              receipt_url: paymentIntent.charges?.data[0]?.receipt_url || undefined,
            },
            5,
            2000
          ); // 5 retries with 2 second delay

          // Update appointment status
          const { data: payment } = await supabase
            .from("payments")
            .select("appointment_id")
            .eq("stripe_payment_intent_id", paymentIntent.id)
            .single();

          if (payment?.appointment_id) {
            await supabase
              .from("appointments")
              .update({
                payment_status: "paid",
                status: "confirmed",
              })
              .eq("id", payment.appointment_id);
          }

          // Log webhook event - get the payment record first to get the UUID
          if (payment?.appointment_id) {
            const { data: paymentRecord } = await supabase
              .from("payments")
              .select("id")
              .eq("stripe_payment_intent_id", paymentIntent.id)
              .single();

            if (paymentRecord?.id) {
              await supabase.from("payment_events").insert({
                payment_id: paymentRecord.id,
                event_type: event.type,
                stripe_event_id: event.id,
                event_data: {
                  amount: paymentIntent.amount,
                  currency: paymentIntent.currency,
                  payment_method: paymentIntent.payment_method,
                },
              });
            }
          }

          break;
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const lastError = paymentIntent.last_payment_error;

          await updatePaymentStatusWithRetry(paymentIntent.id, "failed", {
            error_message: lastError?.message,
          });

          // Log webhook event with error - get the payment record first
          const { data: paymentRecord } = await supabase
            .from("payments")
            .select("id")
            .eq("stripe_payment_intent_id", paymentIntent.id)
            .single();

          if (paymentRecord?.id) {
            await supabase.from("payment_events").insert({
              payment_id: paymentRecord.id,
              event_type: event.type,
              stripe_event_id: event.id,
              event_data: {
                error: lastError,
              },
              error_code: lastError?.code,
              error_message: lastError?.message,
            });
          }

          break;
        }

        case "payment_intent.canceled": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;

          await updatePaymentStatusWithRetry(paymentIntent.id, "canceled");

          // Update appointment status
          const { data: payment } = await supabase
            .from("payments")
            .select("appointment_id")
            .eq("stripe_payment_intent_id", paymentIntent.id)
            .single();

          if (payment?.appointment_id) {
            await supabase
              .from("appointments")
              .update({
                status: "cancelled",
                payment_status: "cancelled",
              })
              .eq("id", payment.appointment_id);
          }

          break;
        }

        case "payment_intent.processing": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await updatePaymentStatusWithRetry(paymentIntent.id, "processing");
          break;
        }

        case "charge.refunded": {
          const charge = event.data.object as Stripe.Charge;
          const paymentIntentId = charge.payment_intent as string;

          // Update payment with refund information
          const refundAmount = charge.amount_refunded;
          const isFullRefund = charge.amount === charge.amount_refunded;

          await supabase
            .from("payments")
            .update({
              status: isFullRefund ? "refunded" : "partially_refunded",
              refunded_amount_cents: refundAmount,
              refunded_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_payment_intent_id", paymentIntentId);

          // Log refund event - get the payment record first
          const { data: paymentRecord } = await supabase
            .from("payments")
            .select("id")
            .eq("stripe_payment_intent_id", paymentIntentId)
            .single();

          if (paymentRecord?.id) {
            await supabase.from("payment_events").insert({
              payment_id: paymentRecord.id,
              event_type: event.type,
              stripe_event_id: event.id,
              event_data: {
                refund_amount: refundAmount,
                full_refund: isFullRefund,
                charge_id: charge.id,
              },
            });
          }

          break;
        }

        case "charge.dispute.created": {
          const dispute = event.data.object as Stripe.Dispute;
          const chargeId = dispute.charge as string;

          // Get charge to find payment intent
          const charge = await stripe.charges.retrieve(chargeId);
          const paymentIntentId = charge.payment_intent as string;

          // Log dispute event - get the payment record first
          const { data: paymentRecord } = await supabase
            .from("payments")
            .select("id")
            .eq("stripe_payment_intent_id", paymentIntentId)
            .single();

          if (paymentRecord?.id) {
            await supabase.from("payment_events").insert({
              payment_id: paymentRecord.id,
              event_type: event.type,
              stripe_event_id: event.id,
              event_data: {
                dispute_id: dispute.id,
                amount: dispute.amount,
                reason: dispute.reason,
                status: dispute.status,
              },
            });
          }

          break;
        }
      }

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      // Return success to avoid Stripe retrying
      return NextResponse.json({ received: true, error: "Processing failed" });
    }
  }

  // Return a response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}
