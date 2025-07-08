import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConsultationRoom } from "@/components/consultation/ConsultationRoom";
import { ConsultationWithRelations } from "@/types";

interface ConsultationPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    token?: string;
    role?: string;
  }>;
}

export default async function ConsultationPage({ params, searchParams }: ConsultationPageProps) {
  const { id } = await params;
  const { token, role } = await searchParams;
  const supabase = await createClient();

  // Get consultation details
  const { data: consultation, error } = await supabase
    .from("consultations")
    .select(
      `
      *,
      appointment:appointments!consultations_appointment_id_fkey (
        *,
        service:services!appointments_service_id_fkey (*),
        client:profiles!appointments_client_id_fkey (*)
      ),
      client:profiles!consultations_client_id_fkey (*)
    `
    )
    .eq("id", id)
    .single();

  if (error || !consultation) {
    console.error("Error fetching consultation:", error);
    notFound();
  }

  // Check if user has access to this consultation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Check if user is the client or admin
  const isClient = user.id === consultation.client_id;
  const isAdmin = user.user_metadata?.role === "admin";

  if (!isClient && !isAdmin) {
    notFound();
  }

  // Check consultation status
  if (consultation.consultation_status === "cancelled") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Consultation Cancelled</h1>
          <p className="text-muted-foreground">This consultation has been cancelled.</p>
        </div>
      </div>
    );
  }

  // Check if consultation has already been completed
  if (consultation.consultation_status === "completed") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Consultation Completed</h1>
          <p className="text-muted-foreground">This consultation has already been completed.</p>
        </div>
      </div>
    );
  }

  // Get intake form if available
  const { data: intakeForm } = await supabase
    .from("intake_forms")
    .select("*")
    .eq("appointment_id", consultation.appointment_id)
    .single();

  // Override isAdmin if role=admin is passed in searchParams
  const effectiveIsAdmin = role === "admin" || isAdmin;

  return (
    <ConsultationRoom
      consultation={consultation as ConsultationWithRelations}
      intakeForm={intakeForm}
      isAdmin={effectiveIsAdmin}
      userToken={token}
    />
  );
}
