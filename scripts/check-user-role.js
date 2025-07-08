const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing required environment variables.");
  console.error("Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserRole() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error("Usage: node scripts/check-user-role.js <userId>");
    process.exit(1);
  }

  console.log("Checking role for user:", userId);

  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId);

    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Query result:", data);
      if (data && data.length > 0) {
        const profile = data[0];
        console.log("User profile:", profile);
        console.log("Current role:", profile.role);

        if (profile.role !== "admin") {
          console.log("\n❌ User is not an admin. Notifications will not be visible.");
          console.log(
            "To fix, run: UPDATE profiles SET role = 'admin' WHERE id = '" + userId + "';"
          );
        } else {
          console.log("\n✅ User has admin role");
        }
      } else {
        console.log("No profile found for user ID:", userId);
      }
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

checkUserRole();
