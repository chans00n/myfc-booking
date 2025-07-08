import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) {
    return NextResponse.json({ profile: existingProfile });
  }

  // Create profile with better error handling
  const profileData = {
    id: user.id,
    email: user.email!,
    first_name: user.user_metadata?.first_name || "",
    last_name: user.user_metadata?.last_name || "",
    phone: user.user_metadata?.phone || null,
    role: "client" as const,
  };

  console.log("Creating profile with data:", profileData);

  const { data: newProfile, error: createError } = await supabase
    .from("profiles")
    .insert(profileData)
    .select()
    .single();

  if (createError) {
    console.error("Profile creation error:", createError);
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  return NextResponse.json({ profile: newProfile });
}
