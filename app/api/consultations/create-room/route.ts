import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { consultationId, clientName, therapistName } = await request.json();

    if (!consultationId || !clientName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create Daily.co room using server-side API key
    const roomName = `consultation-${consultationId}-${Date.now()}`;
    const expTime = Math.floor(Date.now() / 1000) + 30 * 60; // 30 minutes from now

    const roomConfig = {
      name: roomName,
      privacy: "private",
      properties: {
        max_participants: 2,
        enable_recording: false,
        enable_chat: true,
        enable_screenshare: true,
        enable_knocking: true,
        exp: expTime,
        nbf: Math.floor(Date.now() / 1000),
        lang: "en",
        enable_prejoin_ui: true,
        enable_network_ui: true,
      },
    };

    // Log the API key status for debugging
    const apiKey = process.env.DAILY_API_KEY;
    console.log("Daily.co API Key status:", {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      prefix: apiKey?.substring(0, 10) + "...", // Log first 10 chars for verification
    });

    const dailyResponse = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(roomConfig),
    });

    if (!dailyResponse.ok) {
      const error = await dailyResponse.json();
      console.error("Daily.co API error:", {
        status: dailyResponse.status,
        error: error,
        apiKeyUsed: !!apiKey,
      });
      return NextResponse.json(
        { error: "Failed to create video room", details: error },
        { status: dailyResponse.status }
      );
    }

    const room = await dailyResponse.json();

    // Generate tokens for participants
    const [clientTokenResponse, therapistTokenResponse] = await Promise.all([
      // Client token
      fetch("https://api.daily.co/v1/meeting-tokens", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            user_name: clientName,
            is_owner: false,
            enable_screenshare: false,
          },
        }),
      }),
      // Therapist token
      fetch("https://api.daily.co/v1/meeting-tokens", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            user_name: therapistName || "Therapist",
            is_owner: true,
            enable_screenshare: true,
          },
        }),
      }),
    ]);

    if (!clientTokenResponse.ok || !therapistTokenResponse.ok) {
      return NextResponse.json({ error: "Failed to create meeting tokens" }, { status: 500 });
    }

    const clientToken = await clientTokenResponse.json();
    const therapistToken = await therapistTokenResponse.json();

    // Update consultation record with room details
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from("consultations")
      .update({
        daily_room_url: room.url,
        daily_room_name: room.name,
        daily_room_token: therapistToken.token,
      })
      .eq("id", consultationId);

    if (updateError) {
      console.error("Failed to update consultation:", updateError);
    }

    return NextResponse.json({
      roomUrl: room.url,
      roomName: room.name,
      clientToken: clientToken.token,
      therapistToken: therapistToken.token,
    });
  } catch (error) {
    console.error("Error in create-room API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
