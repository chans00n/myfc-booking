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

async function checkIntakeForm() {
  const userId = process.argv[2];
  const formId = process.argv[3];
  
  if (!userId) {
    console.error("Usage: node scripts/check-intake-form.js <userId> [formId]");
    process.exit(1);
  }

  console.log("Checking intake form and user details...\n");

  try {
    // First, let's find all intake forms for this user
    const { data: userForms, error: userFormError } = await supabase
      .from("intake_forms")
      .select("*")
      .eq("client_id", userId)
      .order("created_at", { ascending: false });

    if (userFormError) {
      console.error("Error fetching user forms:", userFormError);
    } else {
      console.log(`Found ${userForms.length} intake forms for user ${userId}:`);
      userForms.forEach((form) => {
        console.log(`\n- Form ID: ${form.id}`);
        console.log(`  Status: ${form.status}`);
        console.log(`  Type: ${form.form_type}`);
        console.log(`  Submitted: ${form.submitted_at || "Not submitted"}`);
        console.log(`  Created: ${form.created_at}`);
      });
    }

    // Now let's check if we can find the specific form
    const { data: forms, error: formError } = await supabase
      .from("intake_forms")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (formError) {
      console.error("Error fetching form:", formError);
      return;
    }

    if (forms && forms.length > 0) {
      const form = forms[0];
      console.log("Found intake form:");
      console.log("- ID:", form.id);
      console.log("- Client ID:", form.client_id);
      console.log("- Status:", form.status);
      console.log("- Submitted at:", form.submitted_at);
      console.log("- Form type:", form.form_type);

      if (form.client_id !== userId) {
        console.log(`\n❌ Form belongs to different user!`);
        console.log(`Form client_id: ${form.client_id}`);
        console.log(`Your user_id: ${userId}`);
      }

      if (form.submitted_at) {
        console.log(`\n❌ Form already submitted at: ${form.submitted_at}`);
        console.log("Submitted forms cannot be updated per RLS policy");
      }
    } else {
      console.log("No intake form found with ID starting with:", formId);
    }

    // Check current RLS policies
    console.log("\n\nChecking RLS policies for intake_forms...");
    const { data: policies, error: policyError } = await supabase.rpc("pg_policies");

    if (!policyError && policies) {
      const intakePolicies = policies.filter(
        (p) => p.tablename === "intake_forms" && p.cmd === "UPDATE"
      );
      console.log("\nUPDATE policies for intake_forms:");
      intakePolicies.forEach((policy) => {
        console.log(`\nPolicy: ${policy.policyname}`);
        console.log(`Expression: ${policy.qual || policy.with_check}`);
      });
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

checkIntakeForm();
