import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addDays, subDays, addHours, format } from "date-fns";
import { generateConsultationRoomUrl } from "@/lib/consultations/urls";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the consultation service
    const { data: consultationService } = await supabase
      .from("services")
      .select("*")
      .eq("is_consultation", true)
      .limit(1)
      .single();

    if (!consultationService) {
      return NextResponse.json({ error: "No consultation service found" }, { status: 404 });
    }

    // Get some clients to use for test data
    const { data: clients } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "client")
      .limit(5);

    if (!clients || clients.length === 0) {
      return NextResponse.json({ error: "No clients found" }, { status: 404 });
    }

    const testAppointments = [];
    const testConsultations = [];

    // Create appointments for the past week, today, and next week
    const dates = [
      { date: subDays(new Date(), 7), status: "completed", consultationStatus: "completed" },
      { date: subDays(new Date(), 5), status: "completed", consultationStatus: "completed" },
      { date: subDays(new Date(), 3), status: "cancelled", consultationStatus: "cancelled" },
      { date: subDays(new Date(), 2), status: "completed", consultationStatus: "completed" },
      { date: subDays(new Date(), 1), status: "no_show", consultationStatus: "no_show" },
      { date: new Date(), status: "scheduled", consultationStatus: "scheduled" },
      { date: new Date(), status: "confirmed", consultationStatus: "scheduled" },
      { date: addDays(new Date(), 1), status: "scheduled", consultationStatus: "scheduled" },
      { date: addDays(new Date(), 3), status: "scheduled", consultationStatus: "scheduled" },
      { date: addDays(new Date(), 5), status: "scheduled", consultationStatus: "scheduled" },
      { date: addDays(new Date(), 7), status: "scheduled", consultationStatus: "scheduled" },
    ];

    // Create appointments
    for (let i = 0; i < dates.length; i++) {
      const client = clients[i % clients.length];
      const dateInfo = dates[i];
      const startHour = 9 + (i % 8); // Vary start times between 9 AM and 5 PM

      const appointment = {
        client_id: client.id,
        service_id: consultationService.id,
        appointment_date: format(dateInfo.date, "yyyy-MM-dd"),
        start_time: `${startHour.toString().padStart(2, "0")}:00:00`,
        end_time: `${(startHour + 1).toString().padStart(2, "0")}:00:00`,
        status: dateInfo.status,
        total_price_cents: consultationService.price * 100,
        payment_status: dateInfo.status === "completed" ? "paid" : "pending",
        payment_preference: "pay_at_appointment" as const,
        notes: `Test consultation for ${client.first_name} ${client.last_name}`,
      };

      testAppointments.push(appointment);
    }

    // Insert appointments
    const { data: insertedAppointments, error: appointmentError } = await supabase
      .from("appointments")
      .insert(testAppointments)
      .select();

    if (appointmentError) {
      console.error("Error creating appointments:", appointmentError);
      return NextResponse.json({ error: "Failed to create appointments" }, { status: 500 });
    }

    // Create consultation records
    for (let i = 0; i < insertedAppointments.length; i++) {
      const appointment = insertedAppointments[i];
      const dateInfo = dates[i];

      const consultation = {
        appointment_id: appointment.id,
        client_id: appointment.client_id,
        consultation_type: ["video", "phone", "in_person"][i % 3] as
          | "video"
          | "phone"
          | "in_person",
        consultation_status: dateInfo.consultationStatus,
        intake_form_type: "standard",
        client_goals: `Test goals for consultation ${i + 1}: Weight loss, improved fitness, better nutrition`,
        health_overview: `Test health overview ${i + 1}: Generally healthy, some minor concerns`,
        consultation_notes:
          dateInfo.status === "completed"
            ? `Test consultation completed successfully. Client is motivated and ready to start their fitness journey.`
            : null,
        started_at:
          dateInfo.status === "completed"
            ? addHours(
                new Date(appointment.appointment_date + " " + appointment.start_time),
                0
              ).toISOString()
            : null,
        completed_at:
          dateInfo.status === "completed"
            ? addHours(
                new Date(appointment.appointment_date + " " + appointment.start_time),
                1
              ).toISOString()
            : null,
      };

      if (consultation.consultation_type === "video") {
        consultation["daily_room_name"] = `test-room-${appointment.id.slice(0, 8)}`;
        consultation["daily_room_url"] = generateConsultationRoomUrl(appointment.id);
      }

      testConsultations.push(consultation);
    }

    // Insert consultations
    const { data: insertedConsultations, error: consultationError } = await supabase
      .from("consultations")
      .insert(testConsultations)
      .select();

    if (consultationError) {
      console.error("Error creating consultations:", consultationError);
      return NextResponse.json({ error: "Failed to create consultations" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Test data created successfully",
      appointments: insertedAppointments.length,
      consultations: insertedConsultations?.length || 0,
    });
  } catch (error) {
    console.error("Error creating test data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Delete test data
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete consultations with test notes
    const { error: consultationError } = await supabase
      .from("consultations")
      .delete()
      .or("client_goals.like.%Test goals%,health_overview.like.%Test health overview%");

    if (consultationError) {
      console.error("Error deleting test consultations:", consultationError);
    }

    // Delete appointments with test notes
    const { error: appointmentError } = await supabase
      .from("appointments")
      .delete()
      .like("notes", "Test consultation for%");

    if (appointmentError) {
      console.error("Error deleting test appointments:", appointmentError);
    }

    return NextResponse.json({ message: "Test data deleted successfully" });
  } catch (error) {
    console.error("Error deleting test data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
