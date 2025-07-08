import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { NotificationService } from "@/lib/notifications/notification-service";

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret or API key for security
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET || "dev-secret";

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();
    const notificationService = new NotificationService();

    // Fetch pending notifications that should be sent now
    const { data: pendingNotifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .limit(50); // Process in batches

    if (error) {
      throw error;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending notifications to process",
      });
    }

    // Update notifications to 'queued' status to prevent duplicate processing
    const notificationIds = pendingNotifications.map((n) => n.id);
    await supabase.from("notifications").update({ status: "queued" }).in("id", notificationIds);

    // Process each notification
    const results = [];
    for (const notification of pendingNotifications) {
      try {
        await notificationService.sendNotification({
          recipientId: notification.recipient_id,
          recipientEmail: notification.recipient_email,
          recipientPhone: notification.recipient_phone,
          type: notification.type,
          appointmentId: notification.appointment_id,
          scheduledFor: new Date(notification.scheduled_for),
          metadata: notification.metadata,
        });

        results.push({
          id: notification.id,
          success: true,
        });
      } catch (error) {
        console.error(`Failed to send notification ${notification.id}:`, error);
        results.push({
          id: notification.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Error processing notifications:", error);
    return NextResponse.json({ error: "Failed to process notifications" }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "notification-processor",
  });
}
