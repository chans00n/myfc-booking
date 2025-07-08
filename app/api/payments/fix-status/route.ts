import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/config";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get all pending payments
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .eq("status", "pending");

    if (paymentsError || !payments) {
      return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }

    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const results = [];

    for (const payment of payments) {
      if (!payment.stripe_payment_intent_id) continue;

      try {
        // Try to retrieve from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(
          payment.stripe_payment_intent_id
        );

        // Update payment status based on Stripe status
        let status = "pending";
        let updateData: any = {
          status: "pending",
          updated_at: new Date().toISOString(),
        };

        if (paymentIntent.status === "succeeded") {
          status = "succeeded";
          updateData = {
            status: "succeeded",
            paid_at: new Date(paymentIntent.created * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Get receipt URL from charges
          if (paymentIntent.charges?.data[0]?.receipt_url) {
            updateData.receipt_url = paymentIntent.charges.data[0].receipt_url;
          }

          // Generate receipt number
          const { data: receiptData } = await supabase.rpc("generate_receipt_number").single();

          if (receiptData) {
            updateData.receipt_number = receiptData;
          }
        } else if (paymentIntent.status === "canceled") {
          status = "canceled";
          updateData.status = "canceled";
        }

        // Update the payment
        const { error: updateError } = await supabase
          .from("payments")
          .update(updateData)
          .eq("id", payment.id);

        if (!updateError && status === "succeeded" && payment.appointment_id) {
          // Update appointment status
          await supabase
            .from("appointments")
            .update({ payment_status: "paid", status: "confirmed" })
            .eq("id", payment.appointment_id);
        }

        results.push({
          payment_id: payment.id,
          stripe_id: payment.stripe_payment_intent_id,
          old_status: payment.status,
          new_status: status,
          error: updateError?.message,
        });
      } catch (error: any) {
        // If not found, try with O replaced with 0
        if (
          error.type === "StripeInvalidRequestError" &&
          payment.stripe_payment_intent_id.includes("O")
        ) {
          const correctedId = payment.stripe_payment_intent_id.replace(/O/g, "0");

          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(correctedId);

            // Update the payment with corrected ID
            await supabase
              .from("payments")
              .update({
                stripe_payment_intent_id: correctedId,
                updated_at: new Date().toISOString(),
              })
              .eq("id", payment.id);

            results.push({
              payment_id: payment.id,
              stripe_id: payment.stripe_payment_intent_id,
              corrected_id: correctedId,
              message: "Fixed payment intent ID",
              stripe_status: paymentIntent.status,
            });
          } catch (innerError) {
            results.push({
              payment_id: payment.id,
              stripe_id: payment.stripe_payment_intent_id,
              error: "Payment intent not found in Stripe",
            });
          }
        } else {
          results.push({
            payment_id: payment.id,
            stripe_id: payment.stripe_payment_intent_id,
            error: error.message || "Failed to retrieve from Stripe",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Error fixing payment statuses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
