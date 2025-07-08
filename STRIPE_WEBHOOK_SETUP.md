# Stripe Webhook Setup Instructions

To ensure payment statuses are properly updated, you need to configure the Stripe webhook:

## 1. Go to Stripe Dashboard

- Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
- Navigate to Developers → Webhooks

## 2. Add Endpoint

Click "Add endpoint" and configure:

- **Endpoint URL**: `http://localhost:3000/api/stripe/webhook` (for local testing)
- For production: `https://yourdomain.com/api/stripe/webhook`

## 3. Select Events to Listen For

Select these events:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `payment_intent.processing`
- `charge.refunded`

## 4. Copy Webhook Secret

After creating the webhook:

1. Click on the webhook endpoint
2. Click "Reveal" under Signing secret
3. Copy the secret (starts with `whsec_`)
4. Update your `.env.local` file with this secret

## 5. For Local Testing

Use Stripe CLI for local webhook testing:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI will show you a webhook signing secret for testing - use this in your `.env.local` file.
