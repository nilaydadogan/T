'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { stripePromise } from '@/lib/stripe'
import { authStore } from '@/lib/auth-store'
import { PageTransition } from '@/components/page-transition'

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    try {
      setIsLoading(true)

      if (!authStore.isAuthenticated()) {
        router.push('/auth/sign-in?redirectTo=/checkout')
        return
      }

      // Create a checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: authStore.getUser()?.id,
          email: authStore.getUser()?.email,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId } = await response.json()

      // Redirect to Stripe checkout
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
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Upgrade to Pro</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Get unlimited access to all features
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium mb-2">Pro Plan Includes:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <span>Unlimited AI generations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <span>Advanced customization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <span>Early access to new features</span>
                  </li>
                </ul>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold mb-1">$19/month</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Cancel anytime
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Upgrade Now'}
              </Button>

              <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                <Lock className="w-4 h-4" />
                Secure payment powered by Stripe
              </p>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
} 