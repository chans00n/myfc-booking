const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing required environment variables.");
  console.error("Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNotificationsTable() {
  console.log("Checking if notifications table exists...");

  try {
    const { data, error } = await supabase.from("notifications").select("id").limit(1);

    if (error) {
      console.error("Error:", error);
      if (error.message.includes('relation "public.notifications" does not exist')) {
        console.log("❌ Notifications table does not exist. Please run the migration.");
      }
    } else {
      console.log("✅ Notifications table exists!");
      console.log("Sample query result:", data);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

checkNotificationsTable();
