import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format, subDays, addDays, subHours } from "date-fns";

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

    // Get a service to use
    const { data: services } = await supabase.from("services").select("*").limit(1);

    if (!services || services.length === 0) {
      return NextResponse.json({ error: "No services found" }, { status: 404 });
    }

    const service = services[0];

    // Get a client to use (or use the admin as client for testing)
    const { data: clients } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "client")
      .limit(1);

    const clientId = clients && clients.length > 0 ? clients[0].id : user.id;

    // Create test appointments with various statuses
    const testAppointments = [
      {
        client_id: clientId,
        service_id: service.id,
        appointment_date: format(new Date(), "yyyy-MM-dd"),
        start_time: "14:00:00",
        end_time: "15:00:00",
        status: "scheduled",
        total_price_cents: service.price_cents,
        payment_status: "pending",
        payment_preference: "pay_at_appointment" as const,
        notes: "Test appointment - scheduled today",
        created_at: subHours(new Date(), 2).toISOString(),
        updated_at: subHours(new Date(), 1).toISOString(),
      },
      {
        client_id: clientId,
        service_id: service.id,
        appointment_date: format(subDays(new Date(), 1), "yyyy-MM-dd"),
        start_time: "10:00:00",
        end_time: "11:00:00",
        status: "completed",
        total_price_cents: service.price_cents,
        payment_status: "paid",
        payment_preference: "pay_at_appointment" as const,
        notes: "Test appointment - completed yesterday",
        created_at: subDays(new Date(), 2).toISOString(),
        updated_at: subDays(new Date(), 1).toISOString(),
      },
      {
        client_id: clientId,
        service_id: service.id,
        appointment_date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        start_time: "16:00:00",
        end_time: "17:00:00",
        status: "confirmed",
        total_price_cents: service.price_cents,
        payment_status: "pending",
        payment_preference: "pay_at_appointment" as const,
        notes: "Test appointment - confirmed for tomorrow",
        created_at: subHours(new Date(), 3).toISOString(),
        updated_at: subHours(new Date(), 0.5).toISOString(),
      },
    ];

    // Insert test appointments
    const { data: insertedAppointments, error } = await supabase
      .from("appointments")
      .insert(testAppointments)
      .select();

    if (error) {
      console.error("Error creating test appointments:", error);
      return NextResponse.json({ error: "Failed to create test appointments" }, { status: 500 });
    }

    // Create a test payment for the completed appointment
    if (insertedAppointments && insertedAppointments[1]) {
      await supabase.from("payments").insert({
        appointment_id: insertedAppointments[1].id,
        amount_cents: insertedAppointments[1].total_price_cents,
        status: "succeeded",
        collection_method: "manual",
        created_at: subDays(new Date(), 1).toISOString(),
      });
    }

    return NextResponse.json({
      message: "Test appointments created successfully",
      appointments: insertedAppointments?.length || 0,
    });
  } catch (error) {
    console.error("Error creating test appointments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Delete test appointments
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

    // Delete test appointments
    const { error } = await supabase
      .from("appointments")
      .delete()
      .like("notes", "Test appointment%");

    if (error) {
      console.error("Error deleting test appointments:", error);
      return NextResponse.json({ error: "Failed to delete test appointments" }, { status: 500 });
    }

    return NextResponse.json({ message: "Test appointments deleted successfully" });
  } catch (error) {
    console.error("Error deleting test appointments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
