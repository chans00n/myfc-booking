import { formatPrice, formatDuration } from '@/lib/services/schemas'

describe('Service utility functions', () => {
  describe('formatPrice', () => {
    it('should format price in cents to dollars', () => {
      expect(formatPrice(1000)).toBe('$10.00')
      expect(formatPrice(9500)).toBe('$95.00')
      expect(formatPrice(15050)).toBe('$150.50')
    })

    it('should handle zero price', () => {
      expect(formatPrice(0)).toBe('$0.00')
    })

    it('should handle large prices', () => {
      expect(formatPrice(100000)).toBe('$1,000.00')
    })
  })

  describe('formatDuration', () => {
    it('should format duration in minutes', () => {
      expect(formatDuration(60)).toBe('60 min')
      expect(formatDuration(90)).toBe('90 min')
      expect(formatDuration(120)).toBe('120 min')
    })

    it('should handle single minute', () => {
      expect(formatDuration(1)).toBe('1 min')
    })

    it('should handle zero minutes', () => {
      expect(formatDuration(0)).toBe('0 min')
    })
  })
})