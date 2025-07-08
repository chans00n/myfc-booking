import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addDays, format } from "date-fns";
import { generateConsultationRoomUrl } from "@/lib/consultations/urls";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create a consultation service
    let { data: consultationService } = await supabase
      .from("services")
      .select("*")
      .eq("is_consultation", true)
      .single();

    if (!consultationService) {
      // Create a consultation service
      const { data: newService, error: serviceError } = await supabase
        .from("services")
        .insert({
          name: "Free Consultation",
          description: "30-minute free consultation to discuss your wellness goals",
          duration_minutes: 30,
          price_cents: 0,
          is_active: true,
          is_consultation: true,
        })
        .select()
        .single();

      if (serviceError) {
        return NextResponse.json(
          { error: "Failed to create consultation service" },
          { status: 500 }
        );
      }

      consultationService = newService;
    }

    // Create test appointment for tomorrow at 2 PM
    const tomorrow = addDays(new Date(), 1);
    const appointmentDate = format(tomorrow, "yyyy-MM-dd");

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        client_id: user.id,
        service_id: consultationService.id,
        appointment_date: appointmentDate,
        start_time: "14:00:00",
        end_time: "14:30:00",
        status: "scheduled",
        total_price_cents: 0,
        payment_status: "not_required",
        notes: "Test consultation for notification system",
      })
      .select()
      .single();

    if (appointmentError) {
      return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
    }

    // Create consultation record
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .insert({
        appointment_id: appointment.id,
        client_id: user.id,
        consultation_type: "video",
        consultation_status: "scheduled",
        intake_form_type: "standard",
        room_url: generateConsultationRoomUrl(appointment.id),
        notes: "Test consultation created via API",
      })
      .select()
      .single();

    if (consultationError) {
      return NextResponse.json({ error: "Failed to create consultation" }, { status: 500 });
    }

    // Trigger notification scheduling
    const notificationResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/consultation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify({
          consultationId: consultation.id,
          appointmentId: appointment.id,
        }),
      }
    );

    const notificationResult = await notificationResponse.json();

    // Check what notifications were created
    const { data: scheduledNotifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("reference_id", consultation.id)
      .order("scheduled_for", { ascending: true });

    return NextResponse.json({
      success: true,
      consultation: {
        id: consultation.id,
        appointment_id: appointment.id,
        date: appointmentDate,
        time: "2:00 PM - 2:30 PM",
        room_url: consultation.room_url,
      },
      notifications: {
        result: notificationResult,
        scheduled: scheduledNotifications?.map((n) => ({
          type: n.type,
          scheduled_for: n.scheduled_for,
          status: n.status,
        })),
      },
    });
  } catch (error) {
    console.error("Error creating test consultation:", error);
    return NextResponse.json({ error: "Failed to create test consultation" }, { status: 500 });
  }
}
