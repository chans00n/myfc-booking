import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookingWizard } from '@/components/booking/BookingWizard'
import { BookingProvider } from '@/contexts/BookingContext'
import { AuthProvider } from '@/contexts/AuthContext'

// Mock the auth context
jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    profile: { 
      first_name: 'Test', 
      last_name: 'User',
      email: 'test@example.com',
      phone: '1234567890'
    },
    loading: false,
  }),
}))

describe('Booking Flow Integration Tests', () => {
  const renderBookingWizard = () => {
    return render(
      <AuthProvider>
        <BookingProvider>
          <BookingWizard />
        </BookingProvider>
      </AuthProvider>
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the first step of booking wizard', () => {
    renderBookingWizard()
    
    expect(screen.getByText(/Service/)).toBeInTheDocument()
    expect(screen.getByText(/Choose your massage service/)).toBeInTheDocument()
  })

  it('should navigate through booking steps', async () => {
    const user = userEvent.setup()
    renderBookingWizard()

    // Step 1: Service Selection
    expect(screen.getByText(/Service/)).toBeInTheDocument()
    
    // Mock selecting a service
    const serviceCard = screen.getByText(/Swedish Massage/)
    await user.click(serviceCard)
    
    // Click next
    const nextButton = screen.getByRole('button', { name: /Next/ })
    await user.click(nextButton)

    // Step 2: Date & Time
    await waitFor(() => {
      expect(screen.getByText(/Date & Time/)).toBeInTheDocument()
    })
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    renderBookingWizard()

    // Try to proceed without selecting a service
    const nextButton = screen.getByRole('button', { name: /Next/ })
    await user.click(nextButton)

    // Should not proceed to next step
    expect(screen.getByText(/Service/)).toBeInTheDocument()
  })

  it('should handle form submission errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock API error
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({ error: 'Booking failed' }),
      })
    ) as jest.Mock

    renderBookingWizard()

    // Navigate through all steps (mocked)
    // ... navigation code ...

    // Submit booking
    const submitButton = screen.getByRole('button', { name: /Complete Booking/ })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Booking failed/)).toBeInTheDocument()
    })
  })
})