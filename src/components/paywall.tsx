'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function Paywall() {
  const router = useRouter()

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

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select the perfect plan for your needs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card 
            key={plan.name}
            className={`p-6 space-y-4 ${
              plan.highlight 
                ? 'border-2 border-violet-500 dark:border-violet-400' 
                : ''
            }`}
          >
            {plan.highlight && (
              <div className="text-center text-sm font-medium text-violet-500 dark:text-violet-400 -mt-2 mb-4">
                RECOMMENDED
              </div>
            )}
            <div className="text-center space-y-2">
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

            <ul className="space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <CheckIcon className="w-5 h-5 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className={`w-full ${
                plan.highlight
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                  : ''
              }`}
              variant={plan.buttonVariant}
              onClick={() => {
                if (plan.name === 'Free') {
                  router.push('/auth/sign-up')
                } else {
                  router.push('/checkout')
                }
              }}
            >
              {plan.buttonText}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
} 