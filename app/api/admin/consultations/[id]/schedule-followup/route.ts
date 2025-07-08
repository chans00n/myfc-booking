import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get consultation details
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .select("client_id")
      .eq("id", params.id)
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
    }

    const body = await request.json();
    const { serviceId, appointmentDate, startTime, notes } = body;

    // Create follow-up appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        client_id: consultation.client_id,
        service_id: serviceId,
        appointment_date: appointmentDate,
        start_time: startTime,
        status: "scheduled",
        notes: notes || `Follow-up appointment from consultation ${params.id}`,
      })
      .select()
      .single();

    if (appointmentError) {
      console.error("Error creating follow-up appointment:", appointmentError);
      return NextResponse.json(
        { error: "Failed to create follow-up appointment" },
        { status: 500 }
      );
    }

    // Update consultation with follow-up reference
    await supabase
      .from("consultations")
      .update({
        consultation_notes: supabase.raw(
          `COALESCE(consultation_notes, '') || E'\\n\\nFollow-up appointment scheduled: ${appointmentDate} at ${startTime}'`
        ),
      })
      .eq("id", params.id);

    return NextResponse.json({
      appointment,
      message: "Follow-up appointment scheduled successfully",
    });
  } catch (error) {
    console.error("Error scheduling follow-up:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
