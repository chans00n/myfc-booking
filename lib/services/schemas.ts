import { z } from 'zod'

export const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be less than 500 characters'),
  duration_minutes: z.number()
    .min(15, 'Duration must be at least 15 minutes')
    .max(240, 'Duration must be less than 4 hours')
    .multipleOf(15, 'Duration must be in 15-minute increments'),
  price_cents: z.number()
    .min(1000, 'Price must be at least $10.00')
    .max(100000, 'Price must be less than $1,000.00'),
  is_active: z.boolean().default(true),
})

export const serviceFilterSchema = z.object({
  search: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minDuration: z.number().optional(),
  maxDuration: z.number().optional(),
  isActive: z.boolean().optional(),
})

export type ServiceFormData = z.infer<typeof serviceSchema>
export type ServiceFilterData = z.infer<typeof serviceFilterSchema>

// Helper functions for price formatting
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) {
    return `${mins} min`
  } else if (mins === 0) {
    return `${hours} hr`
  } else {
    return `${hours} hr ${mins} min`
  }
}

export function parsePriceInput(value: string): number {
  // Remove currency symbols and convert to cents
  const cleanValue = value.replace(/[^0-9.]/g, '')
  const dollars = parseFloat(cleanValue) || 0
  return Math.round(dollars * 100)
}