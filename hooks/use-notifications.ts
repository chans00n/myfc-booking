import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NotificationService } from "@/lib/notifications/notification-service";
import { toast } from "sonner";

export function useNotifications() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const notificationService = new NotificationService();

  const scheduleAppointmentNotifications = async (appointmentId: string) => {
    setLoading(true);
    try {
      const result = await notificationService.scheduleAppointmentNotifications(appointmentId);
      if (result.success) {
        console.log(`Scheduled ${result.scheduled} notifications for appointment ${appointmentId}`);
      }
      return result;
    } catch (error) {
      console.error("Error scheduling notifications:", error);
      toast.error("Failed to schedule notifications");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointmentNotifications = async (appointmentId: string) => {
    setLoading(true);
    try {
      const result = await notificationService.cancelAppointmentNotifications(appointmentId);
      if (result.success) {
        console.log(`Cancelled notifications for appointment ${appointmentId}`);
      }
      return result;
    } catch (error) {
      console.error("Error cancelling notifications:", error);
      toast.error("Failed to cancel notifications");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async (to: string, type: "booking" | "reminder" | "cancellation") => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to, type }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send test email");
      }

      const result = await response.json();
      toast.success("Test email sent successfully");
      return result;
    } catch (error) {
      console.error("Error sending test email:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send test email");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getNotificationHistory = async (appointmentId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (appointmentId) {
        query = query.eq("appointment_id", appointmentId);
      }

      console.log("Executing notifications query...");
      const { data, error } = await query;

      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }

      console.log("Query result:", data);
      return data;
    } catch (error) {
      console.error("Error fetching notification history:", error);
      toast.error("Failed to load notification history");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    scheduleAppointmentNotifications,
    cancelAppointmentNotifications,
    sendTestEmail,
    getNotificationHistory,
  };
}
