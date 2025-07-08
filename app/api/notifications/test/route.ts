import { NextRequest, NextResponse } from "next/server";
import {
  sendBookingConfirmation,
  sendAppointmentReminder,
  sendCancellationConfirmation,
} from "@/lib/notifications/email-service";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    console.log("Test email endpoint called");
    console.log("Environment check - RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
    console.log("Environment check - SMTP_FROM:", process.env.SMTP_FROM);

    const { to, type } = await request.json();
    console.log("Test email request:", { to, type });

    if (!to || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const testData = {
      clientName: "Test Client",
      appointmentDate: new Date(),
      appointmentTime: "2:00 PM - 3:00 PM",
      serviceName: "Test Service",
      duration: 60,
      therapistName: "Your Therapist",
      location: "Main Office",
      confirmationNumber: "TEST123",
    };

    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    // Check authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log("Authenticated user:", user?.id, user?.email);
    console.log("Auth error:", authError);

    // Create a notification record for tracking
    const notificationType =
      type === "booking"
        ? "booking_confirmation"
        : type === "reminder"
          ? "appointment_reminder_24h"
          : "cancellation_confirmation";

    const notificationRecord = {
      recipient_id: user?.id || null, // Use authenticated user's ID for test emails
      recipient_email: to,
      type: notificationType,
      channel: "email",
      status: "pending",
      scheduled_for: new Date().toISOString(),
      appointment_id: null, // Test emails don't have a real appointment
      subject: `Test ${type} email`,
      content: JSON.stringify(testData),
      metadata: { isTest: true, testType: type },
    };

    // Insert notification record
    console.log("Creating notification record:", notificationRecord);
    const { data: notification, error: insertError } = await supabase
      .from("notifications")
      .insert([notificationRecord])
      .select()
      .single();

    if (insertError) {
      console.error("Error creating notification record:", insertError);
      console.error("Full error details:", JSON.stringify(insertError, null, 2));
    } else {
      console.log("Notification record created:", notification);
    }

    let result;
    let emailError = null;

    try {
      switch (type) {
        case "booking":
          result = await sendBookingConfirmation({
            to,
            ...testData,
            needsIntakeForm: true,
            intakeFormUrl: `${process.env.NEXT_PUBLIC_APP_URL}/intake-form`,
          });
          break;

        case "reminder":
          result = await sendAppointmentReminder({
            to,
            ...testData,
            reminderType: "24h",
            hasIntakeForm: false,
            intakeFormUrl: `${process.env.NEXT_PUBLIC_APP_URL}/intake-form`,
          });
          break;

        case "cancellation":
          result = await sendCancellationConfirmation({
            to,
            ...testData,
            cancellationReason: "Test cancellation",
            refundAmount: 100,
          });
          break;

        default:
          return NextResponse.json({ error: "Invalid type" }, { status: 400 });
      }

      // Update notification status to sent
      if (notification) {
        await supabase
          .from("notifications")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", notification.id);
      }
    } catch (error) {
      emailError = error;
      // Update notification status to failed
      if (notification) {
        await supabase
          .from("notifications")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", notification.id);
      }
    }

    if (emailError) {
      throw emailError;
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send test email" },
      { status: 500 }
    );
  }
}
