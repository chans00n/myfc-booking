import { createClient } from "@/lib/supabase/client";
import type { Payment, PaymentStatus } from "@/types/payments";

export async function updatePaymentStatus(
  paymentIntentId: string,
  status: PaymentStatus,
  additionalData?: {
    paid_at?: string;
    error_message?: string;
    receipt_url?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  console.log("Updating payment status:", {
    paymentIntentId,
    status,
    additionalData,
  });

  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData,
    };

    // If payment succeeded, generate receipt number
    if (status === "succeeded" && !additionalData?.receipt_url) {
      const { data: receiptData } = await supabase.rpc("generate_receipt_number").single();

      if (receiptData) {
        updateData.receipt_number = receiptData;
      }
    }

    const { data: updatedPayment, error } = await supabase
      .from("payments")
      .update(updateData)
      .eq("stripe_payment_intent_id", paymentIntentId)
      .select("id, appointment_id")
      .single();

    console.log("Update result:", { updatedPayment, error });

    if (error) {
      console.error("Error updating payment:", error);
      throw error;
    }

    // Log payment event with the correct payment ID
    if (updatedPayment) {
      await supabase.from("payment_events").insert({
        payment_id: updatedPayment.id,
        event_type: `payment.${status}`,
        event_data: additionalData || {},
      });
    }

    // Update appointment payment status if succeeded
    if (status === "succeeded" && updatedPayment?.appointment_id) {
      await supabase
        .from("appointments")
        .update({ payment_status: "paid" })
        .eq("id", updatedPayment.appointment_id);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating payment status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update payment status",
    };
  }
}

export async function getPaymentByIntent(
  paymentIntentId: string
): Promise<{ data?: Payment; error?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        appointment:appointments!payments_appointment_id_fkey(
          *,
          service:services(*),
          client:profiles(*)
        )
      `
      )
      .eq("stripe_payment_intent_id", paymentIntentId)
      .single();

    if (error) throw error;

    return { data };
  } catch (error) {
    console.error("Error fetching payment:", error);
    return { error: "Failed to fetch payment" };
  }
}

export async function getPaymentsByClient(
  clientId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: PaymentStatus;
  }
): Promise<{ data: Payment[]; error?: string }> {
  const supabase = createClient();

  try {
    let query = supabase
      .from("payments")
      .select(
        `
        *,
        appointment:appointments!payments_appointment_id_fkey(
          *,
          service:services(*)
        )
      `
      )
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [] };
  } catch (error) {
    console.error("Error fetching client payments:", error);
    return { data: [], error: "Failed to fetch payments" };
  }
}

export async function getPaymentEvents(
  paymentId: string
): Promise<{ data: any[]; error?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("payment_events")
      .select("*")
      .eq("payment_id", paymentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { data: data || [] };
  } catch (error) {
    console.error("Error fetching payment events:", error);
    return { data: [], error: "Failed to fetch payment events" };
  }
}
