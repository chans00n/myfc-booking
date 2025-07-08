import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scheduleConsultationNotifications } from "@/lib/notifications/consultation-notification-service";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { consultationId, appointmentId } = await request.json();

    if (!consultationId || !appointmentId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Fetch consultation details
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .select(
        `
        *,
        appointment:appointments!consultations_appointment_id_fkey(
          *,
          client:profiles!appointments_client_id_fkey(*),
          service:services!appointments_service_id_fkey(*)
        )
      `
      )
      .eq("id", consultationId)
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
    }

    // Get business details
    const therapistName = process.env.THERAPIST_NAME || "Your Therapist";
    const businessName = process.env.BUSINESS_NAME || "Massage Therapy";
    const logoUrl = process.env.LOGO_URL;

    // Schedule notifications
    const result = await scheduleConsultationNotifications({
      consultationId: consultation.id,
      appointmentId: consultation.appointment_id,
      clientId: consultation.appointment.client_id,
      clientEmail: consultation.appointment.client.email,
      clientPhone: consultation.appointment.client.phone,
      clientName: `${consultation.appointment.client.first_name} ${consultation.appointment.client.last_name}`,
      consultationType: consultation.consultation_type,
      consultationDate: new Date(consultation.appointment.appointment_date),
      startTime: consultation.appointment.start_time,
      endTime: consultation.appointment.end_time,
      duration: consultation.appointment.service.duration_minutes,
      roomUrl: consultation.room_url,
      therapistName,
      businessName,
      logoUrl,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error scheduling consultation notifications:", error);
    return NextResponse.json({ error: "Failed to schedule notifications" }, { status: 500 });
  }
}

// Process consultation notifications
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for scheduled processing
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Get pending consultation notifications
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("status", "pending")
      .in("type", [
        "consultation_24h_reminder",
        "consultation_1h_reminder",
        "consultation_15min_reminder",
        "consultation_followup",
      ])
      .lte("scheduled_for", new Date().toISOString())
      .limit(10);

    if (error) {
      throw error;
    }

    const results = [];

    for (const notification of notifications || []) {
      try {
        // Get consultation details
        const { data: consultation } = await supabase
          .from("consultations")
          .select(
            `
            *,
            appointment:appointments!consultations_appointment_id_fkey(
              *,
              client:profiles!appointments_client_id_fkey(*),
              service:services!appointments_service_id_fkey(*)
            )
          `
          )
          .eq("id", notification.reference_id)
          .single();

        if (!consultation) {
          throw new Error("Consultation not found");
        }

        const therapistName = process.env.THERAPIST_NAME || "Your Therapist";
        const businessName = process.env.BUSINESS_NAME || "Massage Therapy";
        const logoUrl = process.env.LOGO_URL;

        // Import the service dynamically
        const { sendConsultationNotification } = await import(
          "@/lib/notifications/consultation-notification-service"
        );

        await sendConsultationNotification(notification.type, {
          consultationId: consultation.id,
          appointmentId: consultation.appointment_id,
          clientId: consultation.appointment.client_id,
          clientEmail: consultation.appointment.client.email,
          clientPhone: consultation.appointment.client.phone,
          clientName: `${consultation.appointment.client.first_name} ${consultation.appointment.client.last_name}`,
          consultationType: consultation.consultation_type,
          consultationDate: new Date(consultation.appointment.appointment_date),
          startTime: consultation.appointment.start_time,
          endTime: consultation.appointment.end_time,
          duration: consultation.appointment.service.duration_minutes,
          roomUrl: consultation.room_url,
          therapistName,
          businessName,
          logoUrl,
        });

        // Update notification status
        await supabase
          .from("notifications")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", notification.id);

        results.push({
          id: notification.id,
          type: notification.type,
          status: "sent",
        });
      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);

        // Update notification as failed
        await supabase
          .from("notifications")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
            retry_count: (notification.retry_count || 0) + 1,
          })
          .eq("id", notification.id);

        results.push({
          id: notification.id,
          type: notification.type,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Error processing consultation notifications:", error);
    return NextResponse.json({ error: "Failed to process notifications" }, { status: 500 });
  }
}
