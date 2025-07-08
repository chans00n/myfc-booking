/**
 * Centralized helper for generating consultation room URLs
 * Uses custom domain if configured, otherwise falls back to Daily.co
 */
export function generateConsultationRoomUrl(appointmentId: string): string {
  // Priority order:
  // 1. NEXT_PUBLIC_VIDEO_ROOM_DOMAIN - Custom video room domain
  // 2. DAILY_DOMAIN - Daily.co custom domain
  // 3. Default Daily.co subdomain
  const domain =
    process.env.NEXT_PUBLIC_VIDEO_ROOM_DOMAIN || process.env.DAILY_DOMAIN || "zionna-soza.daily.co";

  // Remove any protocol if accidentally included
  const cleanDomain = domain.replace(/^https?:\/\//, "");

  return `https://${cleanDomain}/consultation-${appointmentId}`;
}

/**
 * Get the base video domain for display purposes
 */
export function getVideoDomain(): string {
  const domain =
    process.env.NEXT_PUBLIC_VIDEO_ROOM_DOMAIN || process.env.DAILY_DOMAIN || "zionna-soza.daily.co";

  return domain.replace(/^https?:\/\//, "");
}

/**
 * Check if we're using a custom video domain
 */
export function isUsingCustomDomain(): boolean {
  return !!(process.env.NEXT_PUBLIC_VIDEO_ROOM_DOMAIN || process.env.DAILY_DOMAIN);
}
