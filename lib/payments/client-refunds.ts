import type { RefundPaymentRequest } from '@/types/payments'

export async function refundPayment({
  payment_id,
  amount_cents,
  reason = 'requested_by_customer'
}: RefundPaymentRequest): Promise<{ success: boolean; refund?: any; error?: string }> {
  try {
    const response = await fetch('/api/payments/refund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_id,
        amount_cents,
        reason
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to process refund' }
    }
    
    return { success: true, refund: data.refund }
  } catch (error) {
    console.error('Error processing refund:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to process refund' 
    }
  }
}