import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      // Create profile for OAuth users
      try {
        // Extract user details from OAuth provider
        const firstName =
          user.user_metadata?.full_name?.split(" ")[0] || user.user_metadata?.given_name || "";
        const lastName =
          user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ||
          user.user_metadata?.family_name ||
          "";

        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .single();

        if (existingProfile) {
          // Profile exists - update without changing role
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              email: user.email!,
              first_name: firstName,
              last_name: lastName,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (profileError) {
            console.error("Error updating profile after OAuth:", profileError);
          }
        } else {
          // Profile doesn't exist - create with default client role
          const { error: profileError } = await supabase.from("profiles").insert({
            id: user.id,
            email: user.email!,
            first_name: firstName,
            last_name: lastName,
            role: "client",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (profileError) {
            console.error("Error creating profile after OAuth:", profileError);
          }
        }
      } catch (err) {
        console.error("Error in OAuth profile creation:", err);
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/booking`);
}
