import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import type { Appointment, Profile, PaymentPreference } from "@/types";
import { generateConsultationRoomUrl } from "@/lib/consultations/urls";

export interface CreateAppointmentData {
  serviceId: string;
  clientId?: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  totalPriceCents: number;
  paymentPreference?: PaymentPreference;
  notes?: string;
  guestEmail?: string;
  guestFirstName?: string;
  guestLastName?: string;
  guestPhone?: string;
}

export async function createAppointment(
  data: CreateAppointmentData
): Promise<{ appointment?: Appointment; error?: string }> {
  const supabase = createClient();

  try {
    // If guest booking, create or find guest profile first
    let clientId = data.clientId;

    if (!clientId && data.guestEmail) {
      // Check if guest already has a profile
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", data.guestEmail)
        .single();

      if (existingProfile) {
        clientId = existingProfile.id;
      } else {
        // Create guest profile
        const { data: newProfile, error: profileError } = await supabase
          .from("profiles")
          .insert({
            email: data.guestEmail,
            first_name: data.guestFirstName,
            last_name: data.guestLastName,
            phone: data.guestPhone,
            role: "client",
          })
          .select()
          .single();

        if (profileError) {
          return { error: "Failed to create guest profile" };
        }

        clientId = newProfile.id;
      }
    }

    if (!clientId) {
      return { error: "Client ID is required" };
    }

    // Create appointment
    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        client_id: clientId,
        service_id: data.serviceId,
        appointment_date: format(data.appointmentDate, "yyyy-MM-dd"),
        start_time: data.startTime,
        end_time: data.endTime,
        status: "scheduled",
        total_price_cents: data.totalPriceCents,
        payment_preference: data.paymentPreference || "pay_at_appointment",
        payment_status: data.paymentPreference === "pay_now" ? "pending" : "will_pay_later",
        notes: data.notes,
      })
      .select("*, service:services(*), client:profiles(*)")
      .single();

    if (error) {
      console.error("Error creating appointment:", error);
      return { error: error.message };
    }

    // Check if this is a consultation service and create consultation record
    if (appointment.service?.is_consultation) {
      const { data: consultation, error: consultationError } = await supabase
        .from("consultations")
        .insert({
          appointment_id: appointment.id,
          client_id: clientId,
          consultation_type: "video", // Default to video, can be customized later
          consultation_status: "scheduled",
          intake_form_type: "standard",
          room_url: generateConsultationRoomUrl(appointment.id),
        })
        .select()
        .single();

      if (consultationError) {
        console.error("Error creating consultation record:", consultationError);
        // Don't fail the appointment creation, but log the error
      } else if (consultation) {
        // Schedule consultation notifications
        try {
          const response = await fetch("/api/notifications/consultation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              consultationId: consultation.id,
              appointmentId: appointment.id,
            }),
          });

          if (!response.ok) {
            console.error("Failed to schedule consultation notifications");
          }
        } catch (error) {
          console.error("Error scheduling consultation notifications:", error);
        }
      }
    }

    return { appointment };
  } catch (error) {
    console.error("Unexpected error creating appointment:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function getAppointmentsByClient(clientId: string): Promise<Appointment[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select("*, service:services(*), consultation:consultations(*)")
    .eq("client_id", clientId)
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }

  return data || [];
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select("*, service:services(*), client:profiles(*), consultation:consultations(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching appointment:", error);
    return null;
  }

  return data;
}

export async function updateAppointmentStatus(
  id: string,
  status: Appointment["status"]
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("appointments")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating appointment status:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function cancelAppointment(id: string): Promise<{ success: boolean; error?: string }> {
  return updateAppointmentStatus(id, "cancelled");
}

export async function rescheduleAppointment(
  id: string,
  newDate: Date,
  newStartTime: string,
  newEndTime: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("appointments")
    .update({
      appointment_date: format(newDate, "yyyy-MM-dd"),
      start_time: newStartTime,
      end_time: newEndTime,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error rescheduling appointment:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export function generateConfirmationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${timestamp}-${random}`;
}
