'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { authStore } from '@/lib/auth-store'
import { PageTransition } from '@/components/page-transition'
import { stripePromise } from '@/lib/stripe'
import { useToast } from '@/components/ui/use-toast'

export default function PricingPage() {
  const router = useRouter()
  const { toast } = useToast()

  const plans = [
    {
      name: 'Free',
      price: '0',
      period: '',
      features: ['1 AI generation', 'Basic features', 'Standard support'],
      buttonText: 'Get Started',
      buttonVariant: 'outline' as const,
      description: 'Try it out'
    },
    {
      name: 'Monthly',
      price: '7.99',
      period: '/month',
      features: [
        'Unlimited AI generations',
        'Priority support',
        'Advanced customization',
        'Early access to features'
      ],
      buttonText: 'Subscribe Monthly',
      buttonVariant: 'default' as const,
      description: 'Most flexible'
    },
    {
      name: 'Yearly',
      price: '50',
      period: '/year',
      features: [
        'Everything in Monthly',
        'Save 48% ($45.88)',
        'Priority support',
        'Best value'
      ],
      buttonText: 'Subscribe Yearly',
      buttonVariant: 'default' as const,
      description: '⭐️ Best Value',
      highlight: true
    }
  ]

  const handlePlanSelect = async (planName: string) => {
    try {
      if (!authStore.isAuthenticated()) {
        router.push('/auth/sign-in?redirectTo=/pricing')
        return
      }

      if (planName === 'Free') {
        router.push('/studio')
        return
      }

      // Direkt Stripe checkout başlat
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: authStore.getUser()?.id,
          email: authStore.getUser()?.email,
          planType: planName.toLowerCase() // 'monthly' veya 'yearly'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId } = await response.json()

      // Stripe checkout'a yönlendir
      const stripe = await stripePromise
      const { error } = await stripe!.redirectToCheckout({ sessionId })

      if (error) {
        throw error
      }

    } catch (error) {
      console.error('Checkout error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
      })
    }
  }

  return (
    <PageTransition>
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col p-6">
        <div className="flex-1 flex flex-col justify-center max-w-6xl mx-auto w-full">
          <div className="text-center space-y-3 mb-8">
            <h1 className="text-3xl font-bold">Simple, Transparent Pricing</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Choose the perfect plan for your needs. Upgrade or downgrade at any time.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 w-full">
            {plans.map((plan) => (
              <Card 
                key={plan.name}
                className={`p-6 space-y-4 ${
                  plan.highlight 
                    ? 'border-2 border-violet-500 dark:border-violet-400 shadow-lg' 
                    : ''
                }`}
              >
                {plan.highlight && (
                  <div className="text-center text-sm font-medium text-violet-500 dark:text-violet-400 -mt-2 mb-2">
                    RECOMMENDED
                  </div>
                )}
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {plan.description}
                  </p>
                  <div className="text-3xl font-bold">
                    ${plan.price}
                    <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600'
                      : ''
                  }`}
                  variant={plan.buttonVariant}
                  onClick={() => handlePlanSelect(plan.name)}
                >
                  {plan.buttonText}
                </Button>
              </Card>
            ))}
          </div>

          <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-6">
            All plans include access to our core features. Premium plans offer unlimited 
            generations and advanced features.
          </p>
        </div>
      </div>
    </PageTransition>
  )
} 