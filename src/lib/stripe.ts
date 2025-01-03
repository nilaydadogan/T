import { loadStripe } from '@stripe/stripe-js'

// Make sure to add publishable key as NEXT_PUBLIC_ prefix
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!) 