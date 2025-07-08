import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Operation timed out")), timeoutMs)
    ),
  ]);
}

export async function ensureProfileExistsWithTimeout(user: User) {
  console.log("ensureProfileExists called for:", user.id);
  const supabase = createClient();

  try {
    // First check if profile exists with timeout
    const { data: existingProfile, error: fetchError } = await withTimeout(
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      5000 // 5 second timeout
    );

    console.log("Existing profile check:", { existingProfile, fetchError });

    // If profile exists, return it
    if (existingProfile) {
      console.log("Profile exists, returning it");
      return existingProfile;
    }

    console.log("Profile does not exist, creating new one...");

    // If profile doesn't exist, create it with upsert
    const { data: newProfile, error: createError } = await withTimeout(
      supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email!,
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          phone: user.user_metadata?.phone || null,
          role: user.user_metadata?.role || "client",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single(),
      5000 // 5 second timeout
    );

    if (createError) {
      console.error("Error creating profile:", createError);
      return null;
    }

    console.log("New profile created:", newProfile);
    return newProfile;
  } catch (error) {
    console.error("Profile operation error:", error);
    return null;
  }
}
