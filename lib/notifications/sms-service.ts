import twilio from "twilio";

// Lazy initialization of Twilio client
let twilioClient: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio | null {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    console.log("📱 Initializing Twilio client");
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

export interface SMSData {
  to: string;
  message: string;
}

export async function sendSMS({ to, message }: SMSData) {
  try {
    const client = getTwilioClient();

    // In development without Twilio credentials, just log the SMS
    if (!client || !process.env.TWILIO_PHONE_NUMBER) {
      if (process.env.NODE_ENV === "development") {
        console.log("📱 SMS (Development Mode):");
        console.log("To:", to);
        console.log("Message:", message);
        return { success: true, sid: "dev-" + Date.now() };
      } else {
        console.warn("SMS service not configured. Skipping SMS notification.");
        return { success: false, error: "SMS service not configured" };
      }
    }

    // Send real SMS with Twilio
    console.log("📤 Sending SMS via Twilio to:", to);
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    console.log("✅ SMS sent successfully:", result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return { success: false, error };
  }
}

// Helper function to format phone numbers for Twilio
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Add country code if not present (assuming US)
  if (cleaned.length === 10) {
    return "+1" + cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return "+" + cleaned;
  }

  // Return as-is if already formatted correctly
  return phone;
}
