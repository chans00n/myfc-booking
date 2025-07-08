import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { stripe } from "@/lib/stripe/config";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { payment_id, amount_cents, reason = "requested_by_customer" } = body;

    // Use service client to bypass RLS for payments table
    const serviceClient = createServiceClient();

    // Get payment details
    const { data: payment, error: paymentError } = await serviceClient
      .from("payments")
      .select("*")
      .eq("id", payment_id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (!payment.stripe_payment_intent_id) {
      return NextResponse.json({ error: "No Stripe payment intent found" }, { status: 400 });
    }

    // Calculate refund amount
    const refundAmount = amount_cents || payment.amount_cents;
    const totalRefunded = payment.refunded_amount_cents + refundAmount;

    if (totalRefunded > payment.amount_cents) {
      return NextResponse.json(
        {
          error: `Refund amount exceeds payment amount. Maximum refundable: $${((payment.amount_cents - payment.refunded_amount_cents) / 100).toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      amount: refundAmount,
      reason: reason as any,
      metadata: {
        payment_id,
        refund_reason: reason,
      },
    });

    // Update payment record
    const isFullRefund = totalRefunded === payment.amount_cents;

    await serviceClient
      .from("payments")
      .update({
        status: isFullRefund ? "refunded" : "partially_refunded",
        refunded_amount_cents: totalRefunded,
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment_id);

    // Log refund event
    await serviceClient.from("payment_events").insert({
      payment_id,
      event_type: "refund.created",
      event_data: {
        refund_id: refund.id,
        amount: refundAmount,
        reason,
        full_refund: isFullRefund,
        stripe_refund_id: refund.id,
      },
    });

    // Update appointment status if fully refunded
    if (isFullRefund && payment.appointment_id) {
      await serviceClient
        .from("appointments")
        .update({
          status: "cancelled",
          payment_status: "refunded",
        })
        .eq("id", payment.appointment_id);
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        created: refund.created,
      },
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
