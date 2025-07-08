// Email service configuration status
export function isEmailServiceConfigured(): boolean {
  // In production, we need a real API key
  if (process.env.NODE_ENV === "production") {
    return !!process.env.RESEND_API_KEY;
  }

  // In development, we can work without it
  return true;
}

// Get email configuration status for client
export function getEmailServiceStatus() {
  return {
    configured: isEmailServiceConfigured(),
    isDevelopment: process.env.NODE_ENV === "development",
    hasApiKey: !!process.env.RESEND_API_KEY,
  };
}
