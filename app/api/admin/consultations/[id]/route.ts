import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Fetch consultation details
    const { data, error } = await supabase
      .from("consultations")
      .select(
        `
        *,
        appointment:appointments!consultations_appointment_id_fkey(
          id,
          start_time,
          end_time,
          status,
          service:services(
            id,
            name,
            duration_minutes,
            price,
            description
          )
        ),
        client:profiles!consultations_client_id_fkey(
          id,
          email,
          first_name,
          last_name,
          phone,
          date_of_birth,
          created_at
        )
      `
      )
      .eq("id", params.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
      }
      console.error("Error fetching consultation:", error);
      return NextResponse.json({ error: "Failed to fetch consultation" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in consultation detail API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const body = await request.json();
    const allowedFields = [
      "consultation_status",
      "consultation_notes",
      "client_goals",
      "health_overview",
      "started_at",
      "completed_at",
    ];

    // Filter only allowed fields
    const updates: any = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    // Update consultation
    const { data, error } = await supabase
      .from("consultations")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating consultation:", error);
      return NextResponse.json({ error: "Failed to update consultation" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in consultation update API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
