export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled"
  | "partially_refunded"
  | "refunded";

export type PaymentMethodType = "card" | "bank_transfer" | "cash";

export interface Payment {
  id: string;
  appointment_id: string;
  client_id: string;

  // Stripe information
  stripe_payment_intent_id?: string;
  stripe_payment_method_id?: string;
  stripe_customer_id?: string;

  // Payment details
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  payment_method_type: PaymentMethodType;
  payment_method_last4?: string;

  // Additional info
  description?: string;
  metadata?: Record<string, any>;
  error_message?: string;

  // Receipt
  receipt_url?: string;
  receipt_number?: string;

  // Refund tracking
  refunded_amount_cents: number;
  refund_reason?: string;
  refunded_at?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
  paid_at?: string;

  // Relations
  appointment?: any;
  client?: any;
  payment_events?: PaymentEvent[];
}

export interface PaymentEvent {
  id: string;
  payment_id: string;
  event_type: string;
  event_data: Record<string, any>;
  stripe_event_id?: string;
  error_code?: string;
  error_message?: string;
  created_at: string;
}

export interface CreatePaymentIntentRequest {
  appointment_id: string;
  amount_cents: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentIntentResponse {
  payment_intent_id: string;
  client_secret: string;
  amount_cents: number;
  currency: string;
}

export interface ProcessPaymentRequest {
  payment_intent_id: string;
  payment_method_id: string;
}

export interface RefundPaymentRequest {
  payment_id: string;
  amount_cents?: number; // Optional for partial refunds
  reason?: string;
}
