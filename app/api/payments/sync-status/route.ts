import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'
import { updatePaymentStatus } from '@/lib/payments'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
    }
    
    const { payment_id } = await req.json()
    
    // Get payment from database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('stripe_payment_intent_id')
      .eq('id', payment_id)
      .single()
    
    if (paymentError || !payment?.stripe_payment_intent_id) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }
    
    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id)
    
    // Map Stripe status to our status
    let status: any = 'pending'
    let additionalData: any = {}
    
    switch (paymentIntent.status) {
      case 'succeeded':
        status = 'succeeded'
        additionalData.paid_at = new Date(paymentIntent.created * 1000).toISOString()
        // Get receipt URL from charges
        if (paymentIntent.charges?.data[0]?.receipt_url) {
          additionalData.receipt_url = paymentIntent.charges.data[0].receipt_url
        }
        break
      case 'canceled':
        status = 'canceled'
        break
      case 'processing':
        status = 'processing'
        break
      case 'requires_payment_method':
      case 'requires_action':
        status = 'pending'
        break
      default:
        status = 'failed'
    }
    
    // Update payment status
    const { success, error } = await updatePaymentStatus(
      payment.stripe_payment_intent_id,
      status,
      additionalData
    )
    
    if (!success) {
      return NextResponse.json({ error: error || 'Failed to update status' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      status,
      stripe_status: paymentIntent.status 
    })
  } catch (error) {
    console.error('Error syncing payment status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}