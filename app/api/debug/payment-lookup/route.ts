import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { payment_intent_id } = await req.json();

    // Try exact match
    const { data: exactMatch, error: exactError } = await supabase
      .from("payments")
      .select("*")
      .eq("stripe_payment_intent_id", payment_intent_id)
      .single();

    // Try with LIKE to catch any variations
    const { data: likeMatches, error: likeError } = await supabase
      .from("payments")
      .select("*")
      .like("stripe_payment_intent_id", `%${payment_intent_id.slice(-10)}%`);

    // Get recent payments
    const { data: recentPayments } = await supabase
      .from("payments")
      .select("id, stripe_payment_intent_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      searchedFor: payment_intent_id,
      exactMatch: exactMatch || null,
      exactError: exactError?.message,
      likeMatches: likeMatches || [],
      recentPayments: recentPayments || [],
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
