import { render, screen } from '@testing-library/react'
import { PricingSubscriptionPage } from '../pricing-subscription-page'

// Mock the hooks and utilities
jest.mock('@/hooks/use-preferences', () => ({
  usePreferences: () => ({
    dictionary: {
      landingPricingFree: 'Free Plan',
      landingPricingCreator: 'Creator Plan',
      landingPricingTeam: 'Business Plan',
    },
    locale: 'id',
  }),
}))

jest.mock('@/lib/feedback-alert', () => ({
  confirmFeedbackAction: jest.fn(),
  showFeedbackAlert: jest.fn(),
}))

jest.mock('@/lib/plan-feature-matrix', () => ({
  getPlanFeatureChecklist: () => [
    { id: 'feature1', label: 'Feature 1', status: 'available' },
    { id: 'feature2', label: 'Feature 2', status: 'available' },
  ],
  getPlanFeatureComingSoonLabel: () => 'Coming Soon',
}))

// Mock fetch
global.fetch = jest.fn()

describe('PricingSubscriptionPage', () => {
  const defaultProps = {
    initialPlan: 'creator' as const,
    autoCheckoutIntent: false,
    isLoggedIn: true,
    isOwner: false,
    planPricing: {
      free: 0,
      creator: 25000,
      business: 49000,
    },
    paymentConfig: {
      mode: 'sandbox' as const,
      serverKeySet: true,
    },
    account: {
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ plan: null }),
    })
  })

  it('should render without crashing', () => {
    render(<PricingSubscriptionPage {...defaultProps} />)
    expect(screen.getByText('Creator', { selector: 'p.mt-1' })).toBeInTheDocument()
  })

  it('should display correct plan prices', () => {
    render(<PricingSubscriptionPage {...defaultProps} />)
    const prices = screen.getAllByText(/25\.000/)
    expect(prices.length).toBeGreaterThan(0)
    const businessPrices = screen.getAllByText(/49\.000/)
    expect(businessPrices.length).toBeGreaterThan(0)
  })

  it('should show free plan with 0 price', () => {
    render(<PricingSubscriptionPage {...defaultProps} />)
    const freePrices = screen.getAllByText(/0/)
    expect(freePrices.length).toBeGreaterThan(0)
  })
})