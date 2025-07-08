import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'

export async function GET() {
  return NextResponse.json({
    stripeConfigured: !!stripe,
    hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    environment: process.env.NODE_ENV
  })
}