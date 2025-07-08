const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables.");
  console.error("Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeUserAdmin() {
  const userId = process.argv[2];
  const email = process.argv[3];
  const firstName = process.argv[4];
  const lastName = process.argv[5];
  const phone = process.argv[6];

  if (!userId || !email) {
    console.error("Usage: node scripts/make-user-admin.js <userId> <email> [firstName] [lastName] [phone]");
    process.exit(1);
  }

  console.log("Making user admin:", userId);

  try {
    // First check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (checkError) {
      console.log("Profile not found or error:", checkError.message);

      // Try to create the profile
      console.log("Creating new admin profile...");
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: email,
          first_name: firstName || "Admin",
          last_name: lastName || "User",
          phone: phone || "",
          role: "admin",
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating profile:", createError);
      } else {
        console.log("✅ Created new admin profile:", newProfile);
      }
    } else {
      console.log("Existing profile:", existingProfile);

      // Update existing profile to admin
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating profile:", updateError);
      } else {
        console.log("✅ Updated profile to admin:", updatedProfile);
      }
    }

    // Verify the change
    const { data: finalProfile } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("id", userId)
      .single();

    console.log("\nFinal profile status:", finalProfile);
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

makeUserAdmin();
