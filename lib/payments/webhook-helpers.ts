import { createServiceClient } from '@/lib/supabase/service'
import type { PaymentStatus } from '@/types/payments'

export async function updatePaymentStatusWithRetry(
  paymentIntentId: string,
  status: PaymentStatus,
  additionalData?: {
    paid_at?: string
    error_message?: string
    receipt_url?: string
  },
  retries: number = 3,
  delay: number = 1000
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient()
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`Attempting to update payment status (attempt ${attempt}/${retries}):`, {
      paymentIntentId,
      status
    })
    
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      }
      
      // If payment succeeded, generate receipt number
      if (status === 'succeeded' && !additionalData?.receipt_url) {
        const { data: receiptData } = await supabase
          .rpc('generate_receipt_number')
          .single()
        
        if (receiptData) {
          updateData.receipt_number = receiptData
        }
      }
      
      const { data: updatedPayment, error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('stripe_payment_intent_id', paymentIntentId)
        .select('id, appointment_id')
        .single()
      
      if (error) {
        console.log(`Update attempt ${attempt} failed:`, error)
        
        // If it's the last attempt, throw the error
        if (attempt === retries) {
          throw error
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
        continue
      }
      
      // Success! Log payment event
      if (updatedPayment) {
        await supabase
          .from('payment_events')
          .insert({
            payment_id: updatedPayment.id,
            event_type: `payment.${status}`,
            event_data: {
              ...additionalData,
              stripe_payment_intent_id: paymentIntentId
            }
          })
        
        // Update appointment payment status if succeeded
        if (status === 'succeeded' && updatedPayment.appointment_id) {
          await supabase
            .from('appointments')
            .update({ 
              payment_status: 'paid',
              status: 'confirmed' 
            })
            .eq('id', updatedPayment.appointment_id)
        }
      }
      
      console.log(`Payment status updated successfully on attempt ${attempt}`)
      return { success: true }
    } catch (error) {
      if (attempt === retries) {
        console.error('All retry attempts failed:', error)
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to update payment status' 
        }
      }
    }
  }
  
  return { success: false, error: 'Failed to update payment status after all retries' }
}