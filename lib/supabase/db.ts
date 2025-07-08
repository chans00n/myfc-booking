import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  Service,
  Appointment,
  IntakeForm,
  AppointmentWithRelations,
  BookingFormData,
  IntakeFormData,
  AppointmentStatus,
} from "@/types";

// Profile functions
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return null;
  }

  return data;
}

// Service functions
export async function getServices(activeOnly = true): Promise<Service[]> {
  const supabase = await createClient();
  let query = supabase.from("services").select("*");

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.order("name");

  if (error) {
    console.error("Error fetching services:", error);
    return [];
  }

  return data || [];
}

export async function getService(serviceId: string): Promise<Service | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("services").select("*").eq("id", serviceId).single();

  if (error) {
    console.error("Error fetching service:", error);
    return null;
  }

  return data;
}

// Appointment functions
export async function createAppointment(
  userId: string,
  bookingData: BookingFormData
): Promise<Appointment | null> {
  const supabase = await createClient();

  // First, get the service to calculate end time and price
  const service = await getService(bookingData.service_id);
  if (!service) return null;

  // Calculate end time
  const startTime = new Date(`2000-01-01 ${bookingData.start_time}`);
  const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);
  const endTimeString = endTime.toTimeString().slice(0, 8);

  // Check for conflicts
  const { data: hasConflict } = await supabase.rpc("check_appointment_conflict", {
    p_service_id: bookingData.service_id,
    p_appointment_date: bookingData.appointment_date,
    p_start_time: bookingData.start_time,
    p_end_time: endTimeString,
  });

  if (hasConflict) {
    console.error("Appointment time conflict");
    return null;
  }

  // Create appointment
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      client_id: userId,
      service_id: bookingData.service_id,
      appointment_date: bookingData.appointment_date,
      start_time: bookingData.start_time,
      end_time: endTimeString,
      total_price_cents: service.price_cents,
      notes: bookingData.notes,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating appointment:", error);
    return null;
  }

  return data;
}

export async function getAppointments(
  userId: string,
  isAdmin = false
): Promise<AppointmentWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select(
      `
      *,
      service:services(*),
      client:profiles(*),
      intake_form:intake_forms(*)
    `
    )
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (!isAdmin) {
    query = query.eq("client_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }

  return (data as AppointmentWithRelations[]) || [];
}

export async function getAppointment(
  appointmentId: string
): Promise<AppointmentWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      service:services(*),
      client:profiles(*),
      intake_form:intake_forms(*)
    `
    )
    .eq("id", appointmentId)
    .single();

  if (error) {
    console.error("Error fetching appointment:", error);
    return null;
  }

  return data as AppointmentWithRelations;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<Appointment | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .select()
    .single();

  if (error) {
    console.error("Error updating appointment status:", error);
    return null;
  }

  return data;
}

export async function cancelAppointment(appointmentId: string): Promise<boolean> {
  const appointment = await updateAppointmentStatus(appointmentId, "cancelled");
  return appointment !== null;
}

// Intake form functions
export async function createIntakeForm(
  userId: string,
  appointmentId: string,
  formData: IntakeFormData
): Promise<IntakeForm | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("intake_forms")
    .insert({
      client_id: userId,
      appointment_id: appointmentId,
      ...formData,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating intake form:", error);
    return null;
  }

  return data;
}

export async function getIntakeForm(appointmentId: string): Promise<IntakeForm | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("intake_forms")
    .select("*")
    .eq("appointment_id", appointmentId)
    .single();

  if (error && error.code !== "PGRST116") {
    // Not found is OK
    console.error("Error fetching intake form:", error);
    return null;
  }

  return data;
}

// Availability functions
export async function getAvailableSlots(
  serviceId: string,
  date: string
): Promise<{ start_time: string; end_time: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_available_slots", {
    p_service_id: serviceId,
    p_date: date,
  });

  if (error) {
    console.error("Error fetching available slots:", error);
    return [];
  }

  return data || [];
}

// Admin functions
export async function getAllClients(): Promise<Profile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching clients:", error);
    return [];
  }

  return data || [];
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Get today's appointments
  const { data: todayAppointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("appointment_date", today)
    .in("status", ["scheduled", "confirmed"]);

  // Get this week's revenue
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const { data: weekAppointments } = await supabase
    .from("appointments")
    .select("total_price_cents")
    .gte("appointment_date", startOfWeek.toISOString().split("T")[0])
    .eq("payment_status", "paid");

  const weeklyRevenue = weekAppointments?.reduce((sum, apt) => sum + apt.total_price_cents, 0) || 0;

  // Get total active clients
  const { count: activeClients } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "client");

  return {
    todayAppointments: todayAppointments?.length || 0,
    weeklyRevenue: weeklyRevenue / 100, // Convert cents to dollars
    activeClients: activeClients || 0,
  };
}
