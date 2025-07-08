import { createClient } from "@/lib/supabase/client";
import type { IntakeForm, IntakeFormData, FormType, FormStatus } from "@/types/intake-forms";

export async function createIntakeForm(
  clientId: string,
  formType: FormType,
  appointmentId?: string
): Promise<{ data: IntakeForm | null; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("intake_forms")
    .insert({
      client_id: clientId,
      appointment_id: appointmentId,
      form_type: formType,
      status: "draft",
      medical_conditions: [],
      surgeries: [],
      injuries: [],
      pain_areas: [],
      current_medications: [],
      allergies: [],
      areas_to_avoid: [],
      preferred_techniques: [],
      consent_agreements: {},
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating intake form:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getIntakeForm(
  formId: string
): Promise<{ data: IntakeForm | null; error: string | null }> {
  const supabase = createClient();

  // Get current user to validate ownership
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: "Authentication required" };
  }

  // First, get the form to check ownership
  const { data, error } = await supabase
    .from("intake_forms")
    .select(
      `
      *,
      client:profiles!intake_forms_client_id_fkey(
        id,
        email,
        first_name,
        last_name,
        phone,
        date_of_birth
      )
    `
    )
    .eq("id", formId)
    .single();

  if (error) {
    console.error("Error fetching intake form:", error);
    return { data: null, error: error.message };
  }

  // Check if user is authorized to view this form
  if (data.client_id !== user.id) {
    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      console.error("Unauthorized access attempt to intake form", {
        formId,
        formOwnerId: data.client_id,
        attemptingUserId: user.id,
      });
      return { data: null, error: "Unauthorized: You can only view your own intake forms" };
    }
  }

  return { data, error: null };
}

export async function getClientIntakeForms(
  clientId: string
): Promise<{ data: IntakeForm[]; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("intake_forms")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching client intake forms:", error);
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
}

export async function getLatestIntakeForm(
  clientId: string,
  formType?: FormType
): Promise<{ data: IntakeForm | null; error: string | null }> {
  const supabase = createClient();

  let query = supabase
    .from("intake_forms")
    .select("*")
    .eq("client_id", clientId)
    .in("status", ["submitted", "reviewed"]);

  if (formType) {
    query = query.eq("form_type", formType);
  }

  const { data, error } = await query.order("submitted_at", { ascending: false }).limit(1);

  if (error) {
    console.error("Error fetching latest intake form:", error);
    return { data: null, error: error.message };
  }

  // Return the first item if exists, otherwise null
  return { data: data && data.length > 0 ? data[0] : null, error: null };
}

export async function updateIntakeForm(
  formId: string,
  updates: Partial<IntakeFormData>
): Promise<{ data: IntakeForm | null; error: string | null }> {
  const supabase = createClient();

  // Get current user to validate ownership
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: "Authentication required" };
  }

  // First check if the user owns this form
  const { data: existingForm, error: fetchError } = await supabase
    .from("intake_forms")
    .select("client_id, status")
    .eq("id", formId)
    .single();

  if (fetchError || !existingForm) {
    return { data: null, error: "Intake form not found" };
  }

  // Verify ownership
  if (existingForm.client_id !== user.id) {
    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      console.error("Unauthorized update attempt to intake form", {
        formId,
        formOwnerId: existingForm.client_id,
        attemptingUserId: user.id,
      });
      return { data: null, error: "Unauthorized: You can only update your own intake forms" };
    }
  }

  // Transform the data to match database schema
  const dbUpdates: any = {
    updated_at: new Date().toISOString(),
  };

  // Map fields to database columns
  if (updates.emergencyContactName !== undefined) {
    dbUpdates.emergency_contact_name = updates.emergencyContactName;
  }
  if (updates.emergencyContactPhone !== undefined) {
    dbUpdates.emergency_contact_phone = updates.emergencyContactPhone;
  }
  if (updates.emergencyContactRelationship !== undefined) {
    dbUpdates.emergency_contact_relationship = updates.emergencyContactRelationship;
  }
  if (updates.medicalConditions !== undefined) {
    dbUpdates.medical_conditions = updates.medicalConditions;
  }
  if (updates.surgeries !== undefined) {
    dbUpdates.surgeries = updates.surgeries;
  }
  if (updates.injuries !== undefined) {
    dbUpdates.injuries = updates.injuries;
  }
  if (updates.painAreas !== undefined) {
    dbUpdates.pain_areas = updates.painAreas;
  }
  if (updates.overallPainLevel !== undefined) {
    dbUpdates.pain_level = updates.overallPainLevel;
  }
  if (updates.currentMedications !== undefined) {
    dbUpdates.current_medications = updates.currentMedications;
  }
  if (updates.allergies !== undefined) {
    dbUpdates.allergies = updates.allergies;
  }
  if (updates.previousMassageExperience !== undefined) {
    dbUpdates.previous_massage_experience = updates.previousMassageExperience;
  }
  if (updates.massageFrequency !== undefined) {
    dbUpdates.massage_frequency = updates.massageFrequency;
  }
  if (updates.pressurePreference !== undefined) {
    dbUpdates.pressure_preference = updates.pressurePreference;
  }
  if (updates.areasToAvoid !== undefined) {
    dbUpdates.areas_to_avoid = updates.areasToAvoid;
  }
  if (updates.preferredTechniques !== undefined) {
    dbUpdates.preferred_techniques = updates.preferredTechniques;
  }
  if (updates.treatmentGoals !== undefined) {
    dbUpdates.treatment_goals = updates.treatmentGoals;
  }
  if (updates.specificConcerns !== undefined) {
    dbUpdates.specific_concerns = updates.specificConcerns;
  }
  if (updates.consentAgreements !== undefined) {
    dbUpdates.consent_agreements = updates.consentAgreements;
  }
  if (updates.signature !== undefined) {
    dbUpdates.consent_signature = updates.signature;
  }
  if (updates.signatureDate !== undefined) {
    dbUpdates.consent_date = updates.signatureDate;
  }

  const { data, error } = await supabase
    .from("intake_forms")
    .update(dbUpdates)
    .eq("id", formId)
    .select()
    .single();

  if (error) {
    console.error("Error updating intake form:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function submitIntakeForm(
  formId: string,
  signature: string
): Promise<{ data: IntakeForm | null; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("intake_forms")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      consent_signature: signature,
      consent_date: new Date().toISOString(),
    })
    .eq("id", formId)
    .select(
      `
      *,
      client:profiles!intake_forms_client_id_fkey(
        id,
        email,
        first_name,
        last_name,
        phone,
        date_of_birth
      )
    `
    )
    .single();

  if (error) {
    console.error("Error submitting intake form:", error);
    // Return more detailed error information
    return {
      data: null,
      error: error.message || "Failed to submit intake form",
      errorDetails: error,
    };
  }

  // Send email notifications (in production, this would be handled by a backend service)
  if (data && data.client) {
    const { sendIntakeFormSubmittedNotification, sendIntakeFormToTherapist } = await import(
      "@/lib/email/intake-form-notifications"
    );
    const client = data.client as any;
    const clientName = `${client.first_name} ${client.last_name}`;

    // Send confirmation to client
    await sendIntakeFormSubmittedNotification(data, client.email, clientName);

    // Send notification to therapist (in production, get therapist email from settings)
    const therapistEmail = process.env.NEXT_PUBLIC_THERAPIST_EMAIL || "therapist@soza.com";
    await sendIntakeFormToTherapist(data, therapistEmail, clientName, new Date());
  }

  return { data, error: null };
}

export async function saveDraftIntakeForm(
  formId: string,
  formData: Partial<IntakeFormData>
): Promise<{ error: string | null }> {
  const { error } = await updateIntakeForm(formId, formData);
  return { error };
}

// Check if client needs to fill out an intake form
export async function checkIntakeFormRequired(
  clientId: string,
  appointmentDate: Date
): Promise<{ required: boolean; formType: FormType; lastFormDate?: Date }> {
  const { data: latestForm } = await getLatestIntakeForm(clientId);

  if (!latestForm) {
    // No previous form, need new client form
    return { required: true, formType: "new_client" };
  }

  const lastFormDate = new Date(latestForm.submitted_at!);
  const daysSinceLastForm = Math.floor(
    (appointmentDate.getTime() - lastFormDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If more than 365 days (1 year), require returning client form
  if (daysSinceLastForm > 365) {
    return {
      required: true,
      formType: "returning_client",
      lastFormDate,
    };
  }

  // If more than 180 days (6 months), suggest quick update
  if (daysSinceLastForm > 180) {
    return {
      required: true,
      formType: "quick_update",
      lastFormDate,
    };
  }

  // No form required if less than 6 months
  return { required: false, formType: "quick_update", lastFormDate };
}

// Admin functions
export async function getFormsForReview(
  status?: FormStatus
): Promise<{ data: IntakeForm[]; error: string | null }> {
  const supabase = createClient();

  let query = supabase
    .from("intake_forms")
    .select(
      `
      *,
      client:profiles!intake_forms_client_id_fkey(
        id,
        email,
        first_name,
        last_name,
        phone,
        date_of_birth
      )
    `
    )
    .order("submitted_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching forms for review:", error);
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
}

export async function markFormAsReviewed(
  formId: string,
  reviewerId: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("intake_forms")
    .update({
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq("id", formId);

  if (error) {
    console.error("Error marking form as reviewed:", error);
    return { error: error.message };
  }

  return { error: null };
}
