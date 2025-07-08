export async function emailReceipt(
  paymentId: string,
  recipientEmail?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // For now, just log it - in production, you'd call an API endpoint
    console.log('Email receipt requested for payment:', paymentId)
    console.log('Recipient:', recipientEmail || 'Client email')
    
    // In a real implementation, this would call an API endpoint that sends the email
    // For MVP, we'll just simulate success
    return { success: true }
  } catch (error) {
    console.error('Error emailing receipt:', error)
    return { success: false, error: 'Failed to email receipt' }
  }
}