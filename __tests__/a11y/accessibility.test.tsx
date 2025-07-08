import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import Home from '@/app/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false,
  }),
}))

describe('Accessibility Tests', () => {
  it('should have no accessibility violations on home page', async () => {
    const { container } = render(<Home />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have proper ARIA labels on buttons', async () => {
    const { container } = render(
      <Button aria-label="Submit form">Submit</Button>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have sufficient color contrast', async () => {
    const { container } = render(
      <Card className="p-4">
        <p className="text-foreground bg-background">
          This text should have sufficient contrast
        </p>
      </Card>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have proper heading hierarchy', async () => {
    const { container } = render(
      <div>
        <h1>Main Title</h1>
        <h2>Subtitle</h2>
        <h3>Section Title</h3>
      </div>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have accessible form elements', async () => {
    const { container } = render(
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required />
        
        <label htmlFor="password">Password</label>
        <input id="password" type="password" required />
        
        <button type="submit">Sign In</button>
      </form>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})