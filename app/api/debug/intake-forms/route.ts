import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all intake forms for the user
    const { data: forms, error: formsError } = await supabase
      .from("intake_forms")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    // Get only submitted/reviewed forms
    const { data: submittedForms, error: submittedError } = await supabase
      .from("intake_forms")
      .select("*")
      .eq("client_id", user.id)
      .in("status", ["submitted", "reviewed"])
      .order("submitted_at", { ascending: false });

    return NextResponse.json({
      userId: user.id,
      totalForms: forms?.length || 0,
      submittedForms: submittedForms?.length || 0,
      forms: forms || [],
      latestSubmitted: submittedForms?.[0] || null,
      formStatuses: forms?.map((f) => ({
        id: f.id,
        status: f.status,
        submitted_at: f.submitted_at,
        created_at: f.created_at,
      })),
    });
  } catch (error) {
    console.error("Error debugging intake forms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
