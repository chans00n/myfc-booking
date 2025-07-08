import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Daily.co
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.includes(process.env.DAILY_API_KEY!)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { room_name, participant } = body;

    // Initialize Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Find the consultation by room name
    const { data: consultation } = await supabase
      .from("consultations")
      .select("*")
      .eq("daily_room_name", room_name)
      .single();

    if (!consultation) {
      return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
    }

    // Update consultation status if it's the first participant
    if (consultation.consultation_status === "scheduled") {
      await supabase
        .from("consultations")
        .update({
          consultation_status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .eq("id", consultation.id);
    }

    // Log participant join event
    console.log(`Participant ${participant.user_name} joined consultation ${consultation.id}`);

    return NextResponse.json({
      success: true,
      message: "Participant joined successfully",
    });
  } catch (error) {
    console.error("Error in Daily.co join hook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
