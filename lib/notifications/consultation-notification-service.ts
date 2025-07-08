import { createClient } from "@/lib/supabase/server";
import {
  sendConsultationConfirmation,
  sendConsultationReminder,
  sendConsultationFollowup,
  formatAppointmentTime,
} from "./email-service";
import { sendSMS } from "./sms-service";
import { addHours, addMinutes, subHours, subMinutes } from "date-fns";
import { format } from "date-fns";

interface ConsultationNotificationData {
  consultationId: string;
  appointmentId: string;
  clientId: string;
  clientEmail: string;
  clientPhone?: string;
  clientName: string;
  consultationType: "video" | "phone";
  consultationDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  roomUrl?: string;
  therapistName: string;
  businessName: string;
  logoUrl?: string;
}

export async function scheduleConsultationNotifications(data: ConsultationNotificationData) {
  const supabase = createClient();

  try {
    // Get user's notification preferences
    const { data: preferences } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", data.clientId)
      .single();

    // Default preferences if none exist
    const notificationPrefs = preferences || {
      email_enabled: true,
      sms_enabled: true,
      consultation_confirmation: true,
      consultation_24h_reminder: true,
      consultation_1h_reminder: true,
      consultation_15min_reminder: false,
      consultation_followup: true,
    };

    const notifications = [];
    const consultationTime = formatAppointmentTime(data.startTime, data.endTime);
    const consultationDateTime = new Date(data.consultationDate);
    const [startHour, startMinute] = data.startTime.split(":").map(Number);
    consultationDateTime.setHours(startHour, startMinute, 0, 0);

    // 1. Immediate confirmation email
    if (notificationPrefs.consultation_confirmation && notificationPrefs.email_enabled) {
      notifications.push({
        recipient_id: data.clientId,
        recipient_email: data.clientEmail,
        recipient_phone: data.clientPhone,
        type: "consultation_confirmation",
        channel: "email",
        scheduled_for: new Date(),
        status: "pending",
        reference_type: "consultation",
        reference_id: data.consultationId,
        metadata: {
          consultation_id: data.consultationId,
          appointment_id: data.appointmentId,
          consultation_type: data.consultationType,
          room_url: data.roomUrl,
        },
      });
    }

    // 2. 24-hour reminder
    if (notificationPrefs.consultation_24h_reminder && notificationPrefs.email_enabled) {
      const reminder24h = subHours(consultationDateTime, 24);
      if (reminder24h > new Date()) {
        notifications.push({
          recipient_id: data.clientId,
          recipient_email: data.clientEmail,
          recipient_phone: data.clientPhone,
          type: "consultation_24h_reminder",
          channel: "email",
          scheduled_for: reminder24h,
          status: "pending",
          reference_type: "consultation",
          reference_id: data.consultationId,
          metadata: {
            consultation_id: data.consultationId,
            appointment_id: data.appointmentId,
            consultation_type: data.consultationType,
            room_url: data.roomUrl,
            reminder_type: "24hour",
          },
        });
      }
    }

    // 3. 1-hour reminder
    if (notificationPrefs.consultation_1h_reminder && notificationPrefs.email_enabled) {
      const reminder1h = subHours(consultationDateTime, 1);
      if (reminder1h > new Date()) {
        notifications.push({
          recipient_id: data.clientId,
          recipient_email: data.clientEmail,
          recipient_phone: data.clientPhone,
          type: "consultation_1h_reminder",
          channel: "email",
          scheduled_for: reminder1h,
          status: "pending",
          reference_type: "consultation",
          reference_id: data.consultationId,
          metadata: {
            consultation_id: data.consultationId,
            appointment_id: data.appointmentId,
            consultation_type: data.consultationType,
            room_url: data.roomUrl,
            reminder_type: "1hour",
          },
        });
      }
    }

    // 4. 15-minute SMS reminder (optional)
    if (
      notificationPrefs.consultation_15min_reminder &&
      notificationPrefs.sms_enabled &&
      data.clientPhone
    ) {
      const reminder15min = subMinutes(consultationDateTime, 15);
      if (reminder15min > new Date()) {
        notifications.push({
          recipient_id: data.clientId,
          recipient_email: data.clientEmail,
          recipient_phone: data.clientPhone,
          type: "consultation_15min_reminder",
          channel: "sms",
          scheduled_for: reminder15min,
          status: "pending",
          reference_type: "consultation",
          reference_id: data.consultationId,
          metadata: {
            consultation_id: data.consultationId,
            appointment_id: data.appointmentId,
            consultation_type: data.consultationType,
            room_url: data.roomUrl,
            reminder_type: "15min",
          },
        });
      }
    }

    // 5. Post-consultation follow-up (1 hour after end time)
    if (notificationPrefs.consultation_followup && notificationPrefs.email_enabled) {
      const [endHour, endMinute] = data.endTime.split(":").map(Number);
      const consultationEndTime = new Date(data.consultationDate);
      consultationEndTime.setHours(endHour, endMinute, 0, 0);
      const followupTime = addHours(consultationEndTime, 1);

      notifications.push({
        recipient_id: data.clientId,
        recipient_email: data.clientEmail,
        recipient_phone: data.clientPhone,
        type: "consultation_followup",
        channel: "email",
        scheduled_for: followupTime,
        status: "pending",
        reference_type: "consultation",
        reference_id: data.consultationId,
        metadata: {
          consultation_id: data.consultationId,
          appointment_id: data.appointmentId,
          consultation_type: data.consultationType,
          special_offer_title: "First Visit Special - 20% Off",
          special_offer_description:
            "Save 20% on your first massage appointment when you book within 7 days!",
          special_offer_code: "CONSULT20",
        },
      });
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error } = await supabase.from("notifications").insert(notifications);

      if (error) {
        console.error("Error scheduling notifications:", error);
        throw error;
      }
    }

    // Send immediate confirmation
    const immediateNotification = notifications.find((n) => n.type === "consultation_confirmation");
    if (immediateNotification) {
      await sendConsultationNotification(immediateNotification.type, data);

      // Update notification status
      await supabase
        .from("notifications")
        .update({
          status: "sent",
          sent_at: new Date(),
        })
        .eq("reference_id", data.consultationId)
        .eq("type", "consultation_confirmation");
    }

    // Send admin notification
    await sendAdminConsultationNotification(data);

    return { success: true, notificationsScheduled: notifications.length };
  } catch (error) {
    console.error("Error scheduling consultation notifications:", error);
    throw error;
  }
}

export async function sendConsultationNotification(
  notificationType: string,
  data: ConsultationNotificationData
) {
  const consultationTime = formatAppointmentTime(data.startTime, data.endTime);

  switch (notificationType) {
    case "consultation_confirmation":
      return sendConsultationConfirmation({
        to: data.clientEmail,
        clientName: data.clientName,
        consultationType: data.consultationType,
        consultationDate: data.consultationDate,
        consultationTime,
        duration: data.duration,
        roomUrl: data.roomUrl,
        phoneNumber: data.clientPhone,
        therapistName: data.therapistName,
        businessName: data.businessName,
        logoUrl: data.logoUrl,
      });

    case "consultation_24h_reminder":
      return sendConsultationReminder({
        to: data.clientEmail,
        clientName: data.clientName,
        consultationType: data.consultationType,
        consultationDate: data.consultationDate,
        consultationTime,
        duration: data.duration,
        reminderType: "24hour",
        roomUrl: data.roomUrl,
        phoneNumber: data.clientPhone,
        therapistName: data.therapistName,
        businessName: data.businessName,
        logoUrl: data.logoUrl,
      });

    case "consultation_1h_reminder":
      return sendConsultationReminder({
        to: data.clientEmail,
        clientName: data.clientName,
        consultationType: data.consultationType,
        consultationDate: data.consultationDate,
        consultationTime,
        duration: data.duration,
        reminderType: "1hour",
        roomUrl: data.roomUrl,
        phoneNumber: data.clientPhone,
        therapistName: data.therapistName,
        businessName: data.businessName,
        logoUrl: data.logoUrl,
      });

    case "consultation_15min_reminder":
      if (data.clientPhone) {
        const message =
          data.consultationType === "video"
            ? `Your consultation starts in 15 minutes! Join here: ${data.roomUrl}`
            : `Your consultation starts in 15 minutes! We'll call you at ${data.clientPhone}`;

        return sendSMS({
          to: data.clientPhone,
          message,
        });
      }
      break;

    case "consultation_followup":
      const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/booking`;
      return sendConsultationFollowup({
        to: data.clientEmail,
        clientName: data.clientName,
        consultationType: data.consultationType,
        therapistName: data.therapistName,
        businessName: data.businessName,
        bookingUrl,
        specialOfferTitle: "First Visit Special - 20% Off",
        specialOfferDescription:
          "Save 20% on your first massage appointment when you book within 7 days!",
        specialOfferCode: "CONSULT20",
        logoUrl: data.logoUrl,
      });
  }
}

export async function sendAdminConsultationNotification(data: ConsultationNotificationData) {
  // Send notification to admin about new consultation
  const adminEmail = process.env.NEXT_PUBLIC_THERAPIST_EMAIL;
  if (!adminEmail) return;

  const consultationTime = formatAppointmentTime(data.startTime, data.endTime);
  const subject = `New ${data.consultationType} consultation booked - ${data.clientName}`;

  const text = `
New consultation booked!

Client: ${data.clientName}
Email: ${data.clientEmail}
Phone: ${data.clientPhone || "Not provided"}
Type: ${data.consultationType === "video" ? "Video Consultation" : "Phone Consultation"}
Date: ${format(data.consultationDate, "EEEE, MMMM d, yyyy")}
Time: ${consultationTime}
Duration: ${data.duration} minutes

${data.consultationType === "video" ? `Video Room: ${data.roomUrl}` : ""}

View details: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/consultations/${data.consultationId}
  `.trim();

  try {
    const { sendEmail } = await import("./email-service");
    await sendEmail({
      to: adminEmail,
      subject,
      text,
    });
  } catch (error) {
    console.error("Error sending admin notification:", error);
  }
}

export async function cancelConsultationNotifications(consultationId: string) {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("notifications")
      .update({
        status: "cancelled",
        updated_at: new Date(),
      })
      .eq("reference_id", consultationId)
      .eq("reference_type", "consultation")
      .eq("status", "pending");

    if (error) {
      console.error("Error cancelling consultation notifications:", error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error cancelling notifications:", error);
    throw error;
  }
}
