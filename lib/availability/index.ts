import { createClient } from "@/lib/supabase/client";
import {
  format,
  startOfDay,
  endOfDay,
  addDays,
  addMinutes,
  isAfter,
  isBefore,
  isWithinInterval,
  getDay,
  parse,
  setHours,
  setMinutes,
} from "date-fns";
import { zonedTimeToUtc, utcToZonedTime } from "date-fns-tz";
import type { BusinessHours, TimeBlock, AppointmentSettings, TimeSlot, Appointment } from "@/types";

export async function getBusinessHours(): Promise<BusinessHours[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("business_hours")
    .select("*")
    .eq("is_active", true)
    .order("day_of_week");

  if (error) {
    console.error("Error fetching business hours:", error);
    return [];
  }

  return data || [];
}

export async function getTimeBlocks(startDate: Date, endDate: Date): Promise<TimeBlock[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("time_blocks")
    .select("*")
    .gte("start_datetime", startDate.toISOString())
    .lte("end_datetime", endDate.toISOString());

  if (error) {
    console.error("Error fetching time blocks:", error);
    return [];
  }

  return data || [];
}

export async function getAppointmentSettings(): Promise<AppointmentSettings | null> {
  const supabase = createClient();

  const { data, error } = await supabase.from("appointment_settings").select("*").single();

  if (error) {
    console.error("Error fetching appointment settings:", error);
    return null;
  }

  return data;
}

export async function getAppointments(startDate: Date, endDate: Date): Promise<Appointment[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select("*, service:services(*)")
    .gte("appointment_date", format(startDate, "yyyy-MM-dd"))
    .lte("appointment_date", format(endDate, "yyyy-MM-dd"))
    .in("status", ["scheduled", "confirmed"]);

  if (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }

  return data || [];
}

export async function getAvailableTimeSlots(
  date: Date,
  serviceDurationMinutes: number
): Promise<TimeSlot[]> {
  const settings = await getAppointmentSettings();
  if (!settings) return [];

  const timezone = settings.timezone || "America/Los_Angeles";

  // Get business hours for this day
  const dayOfWeek = getDay(date);
  const businessHours = await getBusinessHours();
  const todayHours = businessHours.find((h) => h.day_of_week === dayOfWeek);

  if (!todayHours || !todayHours.is_active) {
    return [];
  }

  // Convert business hours to time slots
  const slots: TimeSlot[] = [];
  const startOfWorkDay = parse(todayHours.start_time, "HH:mm:ss", date);
  const endOfWorkDay = parse(todayHours.end_time, "HH:mm:ss", date);

  // Get existing appointments and time blocks
  const appointments = await getAppointments(date, date);
  const timeBlocks = await getTimeBlocks(date, date);

  // Generate time slots
  let currentSlot = startOfWorkDay;

  while (isBefore(addMinutes(currentSlot, serviceDurationMinutes), endOfWorkDay)) {
    const slotEnd = addMinutes(currentSlot, serviceDurationMinutes);

    // Check if slot is available
    let isAvailable = true;

    // Check minimum notice
    const minimumBookingTime = addMinutes(new Date(), settings.minimum_notice_hours * 60);
    if (isBefore(currentSlot, minimumBookingTime)) {
      isAvailable = false;
    }

    // Check advance booking limit
    const maxBookingDate = addDays(new Date(), settings.advance_booking_days);
    if (isAfter(currentSlot, maxBookingDate)) {
      isAvailable = false;
    }

    // Check against existing appointments (including buffer time)
    for (const appointment of appointments) {
      const appointmentStart = parse(
        appointment.start_time,
        "HH:mm:ss",
        parse(appointment.appointment_date, "yyyy-MM-dd", new Date())
      );
      const appointmentEnd = parse(
        appointment.end_time,
        "HH:mm:ss",
        parse(appointment.appointment_date, "yyyy-MM-dd", new Date())
      );

      // Add buffer time
      const bufferedStart = addMinutes(appointmentStart, -settings.buffer_time_minutes);
      const bufferedEnd = addMinutes(appointmentEnd, settings.buffer_time_minutes);

      // Check for overlap
      if (
        isWithinInterval(currentSlot, { start: bufferedStart, end: bufferedEnd }) ||
        isWithinInterval(slotEnd, { start: bufferedStart, end: bufferedEnd }) ||
        (isBefore(currentSlot, bufferedStart) && isAfter(slotEnd, bufferedEnd))
      ) {
        isAvailable = false;
        break;
      }
    }

    // Check against time blocks
    for (const block of timeBlocks) {
      const blockStart = new Date(block.start_datetime);
      const blockEnd = new Date(block.end_datetime);

      if (
        isWithinInterval(currentSlot, { start: blockStart, end: blockEnd }) ||
        isWithinInterval(slotEnd, { start: blockStart, end: blockEnd }) ||
        (isBefore(currentSlot, blockStart) && isAfter(slotEnd, blockEnd))
      ) {
        isAvailable = false;
        break;
      }
    }

    slots.push({
      start: currentSlot,
      end: slotEnd,
      available: isAvailable,
    });

    // Move to next slot
    currentSlot = addMinutes(currentSlot, 30); // 30-minute intervals
  }

  return slots;
}

// Admin functions
export async function updateBusinessHours(
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  isActive: boolean
): Promise<BusinessHours | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("business_hours")
    .upsert({
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error updating business hours:", error);
    return null;
  }

  return data;
}

export async function createTimeBlock(
  title: string,
  startDatetime: Date,
  endDatetime: Date,
  blockType: TimeBlock["block_type"]
): Promise<TimeBlock | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("time_blocks")
    .insert({
      title,
      start_datetime: startDatetime.toISOString(),
      end_datetime: endDatetime.toISOString(),
      block_type: blockType,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating time block:", error);
    return null;
  }

  return data;
}

export async function deleteTimeBlock(id: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase.from("time_blocks").delete().eq("id", id);

  if (error) {
    console.error("Error deleting time block:", error);
    return false;
  }

  return true;
}

export async function updateAppointmentSettings(
  settings: Partial<AppointmentSettings>
): Promise<AppointmentSettings | null> {
  const supabase = createClient();

  // Get existing settings
  const { data: existing } = await supabase.from("appointment_settings").select("*").single();

  const { data, error } = await supabase
    .from("appointment_settings")
    .upsert({
      ...existing,
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error updating appointment settings:", error);
    return null;
  }

  return data;
}
