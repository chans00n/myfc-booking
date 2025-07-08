import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin access
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

async function importHistoricalPayments() {
  console.log('Starting Stripe payment import...')
  
  try {
    // Fetch all successful payment intents from Stripe
    const paymentIntents = []
    let hasMore = true
    let startingAfter: string | undefined
    
    while (hasMore) {
      const response = await stripe.paymentIntents.list({
        limit: 100,
        starting_after: startingAfter,
        // Only get succeeded payments
        query: 'status:\'succeeded\'',
      })
      
      paymentIntents.push(...response.data)
      hasMore = response.has_more
      if (response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id
      }
    }
    
    console.log(`Found ${paymentIntents.length} successful payments in Stripe`)
    
    // Process each payment intent
    let imported = 0
    let skipped = 0
    
    for (const pi of paymentIntents) {
      // Check if payment already exists
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('stripe_payment_intent_id', pi.id)
        .single()
      
      if (existingPayment) {
        skipped++
        continue
      }
      
      // Get customer email from Stripe
      let clientEmail = null
      if (pi.customer) {
        const customer = await stripe.customers.retrieve(pi.customer as string)
        if (customer && !customer.deleted) {
          clientEmail = (customer as Stripe.Customer).email
        }
      }
      
      // Try to find the client in our database
      let clientId = null
      if (clientEmail) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', clientEmail)
          .single()
        
        if (profile) {
          clientId = profile.id
        }
      }
      
      // Skip if we can't find the client
      if (!clientId) {
        console.log(`Skipping payment ${pi.id} - no matching client found`)
        skipped++
        continue
      }
      
      // Get charge details for receipt URL
      let receiptUrl = null
      if (pi.latest_charge) {
        const charge = await stripe.charges.retrieve(pi.latest_charge as string)
        receiptUrl = charge.receipt_url
      }
      
      // Insert the payment record
      const { error } = await supabase
        .from('payments')
        .insert({
          stripe_payment_intent_id: pi.id,
          stripe_customer_id: pi.customer as string,
          client_id: clientId,
          amount_cents: pi.amount,
          currency: pi.currency,
          status: 'succeeded',
          payment_method_type: pi.payment_method_types[0] || 'card',
          stripe_payment_method_id: pi.payment_method as string,
          receipt_url: receiptUrl,
          receipt_number: `IMPORT-${pi.id.slice(-8).toUpperCase()}`,
          paid_at: new Date(pi.created * 1000).toISOString(),
          created_at: new Date(pi.created * 1000).toISOString(),
          metadata: {
            imported: true,
            import_date: new Date().toISOString(),
            original_metadata: pi.metadata,
          }
        })
      
      if (error) {
        console.error(`Failed to import payment ${pi.id}:`, error)
      } else {
        imported++
        console.log(`Imported payment ${pi.id} for ${clientEmail}`)
      }
    }
    
    console.log(`\nImport complete!`)
    console.log(`- Imported: ${imported} payments`)
    console.log(`- Skipped: ${skipped} payments (already exist or no client match)`)
    
  } catch (error) {
    console.error('Import failed:', error)
  }
}

// Run the import
importHistoricalPayments()