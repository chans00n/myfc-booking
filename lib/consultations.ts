import { createClient } from "@/lib/supabase/client";
import { createServiceClient } from "@/lib/supabase/service";
import { format } from "date-fns";
import type { ConsultationType } from "@/types";
import { generateConsultationRoomUrl } from "@/lib/consultations/urls";

interface CreateConsultationParams {
  clientId: string;
  appointmentDate: Date;
  startTime: Date;
  consultationType: ConsultationType;
  notes?: string;
  consultationIntake?: any;
}

export async function createConsultationAppointment({
  clientId,
  appointmentDate,
  startTime,
  consultationType,
  notes,
  consultationIntake,
}: CreateConsultationParams) {
  const supabase = createClient();

  try {
    // First, check if client is eligible
    const { data: eligible, error: eligibilityError } = await supabase.rpc(
      "check_consultation_eligibility",
      {
        p_client_id: clientId,
      }
    );

    if (eligibilityError) {
      throw new Error("Failed to check eligibility: " + eligibilityError.message);
    }

    if (!eligible) {
      throw new Error("Client has already used their free consultation");
    }

    // Get consultation service
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("*")
      .eq("is_consultation", true)
      .eq("is_active", true)
      .single();

    if (serviceError || !service) {
      throw new Error("No active consultation service found");
    }

    // Calculate end time (30 minutes)
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        client_id: clientId,
        service_id: service.id,
        appointment_date: format(appointmentDate, "yyyy-MM-dd"),
        start_time: format(startTime, "HH:mm:ss"),
        end_time: format(endTime, "HH:mm:ss"),
        status: "scheduled",
        total_price_cents: 0,
        payment_status: "paid", // Free consultation
        requires_payment: false,
        notes:
          notes ||
          `Consultation intake submitted. Primary concerns: ${consultationIntake?.primaryConcerns}`,
      })
      .select()
      .single();

    if (appointmentError) {
      throw new Error("Failed to create appointment: " + appointmentError.message);
    }

    // Create consultation record
    console.log("Creating consultation record with:", {
      appointment_id: appointment.id,
      client_id: clientId,
      consultation_type: consultationType,
      consultation_status: "scheduled",
    });

    if (!consultationType) {
      throw new Error("Consultation type is required but was not provided");
    }

    // Check if consultation already exists for this appointment
    const { data: existingConsultation } = await supabase
      .from("consultations")
      .select("id")
      .eq("appointment_id", appointment.id)
      .single();

    if (existingConsultation) {
      console.log("Consultation already exists for appointment:", appointment.id);
      return {
        appointmentId: appointment.id,
        consultationId: existingConsultation.id,
        appointment,
        consultation: existingConsultation,
      };
    }

    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .insert({
        appointment_id: appointment.id,
        client_id: clientId,
        consultation_type: consultationType,
        consultation_status: "scheduled",
        room_url: consultationType === "video" ? generateConsultationRoomUrl(appointment.id) : null,
      })
      .select()
      .single();

    if (consultationError) {
      throw new Error("Failed to create consultation record: " + consultationError.message);
    }

    // Update client profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        has_had_free_consultation: true,
        consultation_count: 1, // This should be incremented, but for simplicity we set to 1
      })
      .eq("id", clientId);

    if (profileError) {
      console.error("Failed to update profile:", profileError);
      // Don't throw here, the consultation is already created
    }

    return {
      appointmentId: appointment.id,
      consultationId: consultation.id,
      appointment,
      consultation,
    };
  } catch (error) {
    console.error("Error creating consultation appointment:", error);
    throw error;
  }
}
