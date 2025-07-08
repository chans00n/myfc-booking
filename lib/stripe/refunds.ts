import { stripe } from './config'
import { createClient } from '@/lib/supabase/client'
import type { RefundPaymentRequest } from '@/types/payments'

export async function refundPayment({
  payment_id,
  amount_cents,
  reason = 'requested_by_customer'
}: RefundPaymentRequest): Promise<{ success: boolean; refund?: any; error?: string }> {
  try {
    const supabase = createClient()
    
    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single()
    
    if (paymentError || !payment) {
      return { success: false, error: 'Payment not found' }
    }
    
    if (!payment.stripe_payment_intent_id) {
      return { success: false, error: 'No Stripe payment intent found' }
    }
    
    if (payment.status !== 'succeeded' && payment.status !== 'partially_refunded') {
      return { success: false, error: 'Payment cannot be refunded in current status' }
    }
    
    // Calculate refund amount
    const refundAmount = amount_cents || payment.amount_cents
    const totalRefunded = payment.refunded_amount_cents + refundAmount
    
    if (totalRefunded > payment.amount_cents) {
      return { 
        success: false, 
        error: `Refund amount exceeds payment amount. Maximum refundable: $${((payment.amount_cents - payment.refunded_amount_cents) / 100).toFixed(2)}` 
      }
    }
    
    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      amount: refundAmount,
      reason: reason as any,
      metadata: {
        payment_id,
        refund_reason: reason
      }
    })
    
    // Update payment record
    const isFullRefund = totalRefunded === payment.amount_cents
    
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: isFullRefund ? 'refunded' : 'partially_refunded',
        refunded_amount_cents: totalRefunded,
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', payment_id)
    
    if (updateError) {
      console.error('Error updating payment record:', updateError)
    }
    
    // Log refund event
    await supabase
      .from('payment_events')
      .insert({
        payment_id,
        event_type: 'refund.created',
        event_data: {
          refund_id: refund.id,
          amount: refundAmount,
          reason,
          full_refund: isFullRefund,
          stripe_refund_id: refund.id
        }
      })
    
    // Update appointment status if fully refunded
    if (isFullRefund && payment.appointment_id) {
      await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          payment_status: 'refunded'
        })
        .eq('id', payment.appointment_id)
    }
    
    return { 
      success: true, 
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        created: refund.created
      }
    }
  } catch (error) {
    console.error('Error processing refund:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to process refund' 
    }
  }
}

export async function getRefundableAmount(
  payment_id: string
): Promise<{ amount_cents: number; error?: string }> {
  try {
    const supabase = createClient()
    
    const { data: payment, error } = await supabase
      .from('payments')
      .select('amount_cents, refunded_amount_cents')
      .eq('id', payment_id)
      .single()
    
    if (error || !payment) {
      return { amount_cents: 0, error: 'Payment not found' }
    }
    
    const refundableAmount = payment.amount_cents - payment.refunded_amount_cents
    return { amount_cents: refundableAmount }
  } catch (error) {
    console.error('Error getting refundable amount:', error)
    return { amount_cents: 0, error: 'Failed to get refundable amount' }
  }
}

export async function listRefunds(
  payment_id: string
): Promise<{ data: any[]; error?: string }> {
  try {
    const supabase = createClient()
    
    // Get payment events that are refunds
    const { data, error } = await supabase
      .from('payment_events')
      .select('*')
      .eq('payment_id', payment_id)
      .in('event_type', ['refund.created', 'charge.refunded'])
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return { data: data || [] }
  } catch (error) {
    console.error('Error listing refunds:', error)
    return { data: [], error: 'Failed to list refunds' }
  }
}