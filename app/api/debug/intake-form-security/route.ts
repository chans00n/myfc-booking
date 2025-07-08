import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { formId } = await req.json();

    if (!formId) {
      return NextResponse.json({ error: "Form ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to fetch the form directly (will be blocked by RLS if not owner)
    const { data: form, error: formError } = await supabase
      .from("intake_forms")
      .select("id, client_id, status, created_at")
      .eq("id", formId)
      .single();

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    // Prepare debug response
    const debugInfo = {
      requestedFormId: formId,
      currentUserId: user.id,
      userEmail: user.email,
      isAdmin,
      formAccessResult: {
        success: !formError,
        error: formError?.message || null,
        formOwnerId: form?.client_id || null,
        isOwner: form?.client_id === user.id,
        formStatus: form?.status || null,
        formCreatedAt: form?.created_at || null,
      },
      rlsCheck: {
        canAccess: !formError,
        reason: formError
          ? "RLS policy blocked access"
          : form?.client_id === user.id
            ? "User is form owner"
            : isAdmin
              ? "User is admin"
              : "Unknown reason",
      },
      timestamp: new Date().toISOString(),
    };

    // Log for monitoring
    console.log("Intake form security check:", debugInfo);

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error("Error in intake form security check:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
