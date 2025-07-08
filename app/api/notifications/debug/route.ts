import { NextResponse } from 'next/server'

export async function GET() {
  // Only show debug info in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasResendKey: !!process.env.RESEND_API_KEY,
    resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
    resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 7) || 'not set',
    smtpFrom: process.env.SMTP_FROM || 'not set',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'not set',
  })
}