import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    emailServiceConfigured: !!process.env.RESEND_API_KEY,
    environment: process.env.NODE_ENV,
  });
}
