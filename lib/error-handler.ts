import { toast } from 'sonner'

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  fallbackMessage?: string
}

export function handleError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): string {
  const {
    showToast = true,
    logError = true,
    fallbackMessage = 'An unexpected error occurred'
  } = options

  let message = fallbackMessage
  let code: string | undefined
  let details: any

  if (error instanceof AppError) {
    message = error.message
    code = error.code
    details = error.details
  } else if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = String(error.message)
  }

  // Log error in development
  if (logError && process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message,
      code,
      details,
      originalError: error
    })
  }

  // Show toast notification
  if (showToast) {
    toast.error(message)
  }

  return message
}

// Common error messages
export const ErrorMessages = {
  // Auth errors
  AUTH_REQUIRED: 'Please sign in to continue',
  AUTH_FAILED: 'Authentication failed. Please try again',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_NOT_VERIFIED: 'Please verify your email address',
  
  // Form errors
  FORM_VALIDATION_FAILED: 'Please check the form and try again',
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  
  // Booking errors
  BOOKING_FAILED: 'Failed to create booking. Please try again',
  NO_AVAILABILITY: 'No available time slots for the selected date',
  BOOKING_CONFLICT: 'This time slot is no longer available',
  
  // Payment errors
  PAYMENT_FAILED: 'Payment failed. Please try again',
  CARD_DECLINED: 'Your card was declined',
  INSUFFICIENT_FUNDS: 'Insufficient funds',
  
  // Network errors
  NETWORK_ERROR: 'Network error. Please check your connection',
  SERVER_ERROR: 'Server error. Please try again later',
  TIMEOUT_ERROR: 'Request timed out. Please try again',
  
  // Generic errors
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again',
  NOT_FOUND: 'The requested resource was not found',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'Access forbidden',
}

// Error code mapping
export function getErrorMessage(code: string): string {
  const errorMap: Record<string, string> = {
    // Supabase auth errors
    'invalid_credentials': ErrorMessages.INVALID_CREDENTIALS,
    'email_not_confirmed': ErrorMessages.EMAIL_NOT_VERIFIED,
    'user_not_found': ErrorMessages.INVALID_CREDENTIALS,
    
    // Custom app errors
    'auth_required': ErrorMessages.AUTH_REQUIRED,
    'booking_conflict': ErrorMessages.BOOKING_CONFLICT,
    'payment_failed': ErrorMessages.PAYMENT_FAILED,
    
    // HTTP errors
    '400': ErrorMessages.FORM_VALIDATION_FAILED,
    '401': ErrorMessages.UNAUTHORIZED,
    '403': ErrorMessages.FORBIDDEN,
    '404': ErrorMessages.NOT_FOUND,
    '500': ErrorMessages.SERVER_ERROR,
  }

  return errorMap[code] || ErrorMessages.SOMETHING_WENT_WRONG
}