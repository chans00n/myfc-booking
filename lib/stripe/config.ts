import Stripe from "stripe";

// Server-side Stripe instance - only initialize on server
let stripe: Stripe | null = null;

if (typeof window === "undefined" && process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-11-20.acacia",
    typescript: true,
  });
}

export { stripe };

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  currency: "usd",
  paymentMethods: ["card"],
  appearance: {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#22c55e",
      colorBackground: "#ffffff",
      colorText: "#1f2937",
      colorDanger: "#ef4444",
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: "0.5rem",
    },
  },
};

// Stripe webhook secret for verifying webhook signatures
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
