import { createClient } from "@/lib/supabase/client";

export async function updateClientProfile(
  clientId: string,
  updates: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    date_of_birth?: string;
  }
): Promise<{ error: string | null }> {
  const supabase = createClient();

  // For now, exclude date_of_birth if it causes issues
  // Remove this after running the migration
  const safeUpdates: any = {
    first_name: updates.first_name,
    last_name: updates.last_name,
    phone: updates.phone,
  };

  // Include date_of_birth now that the column exists
  if (updates.date_of_birth) {
    safeUpdates.date_of_birth = updates.date_of_birth;
  }

  const { error } = await supabase.from("profiles").update(safeUpdates).eq("id", clientId);

  if (error) {
    console.error("Error updating client profile:", error);
    return { error: error.message };
  }

  return { error: null };
}
