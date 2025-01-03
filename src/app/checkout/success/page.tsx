'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { authStore } from '@/lib/auth-store'
import { supabase } from '@/lib/supabase'

export default function SuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const updateSubscriptionStatus = async () => {
      try {
        // Fetch latest subscription status
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('subscription_type')
          .eq('user_id', authStore.getUser()?.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Force refresh auth store with new subscription status
        await authStore.initialize()
      } catch (error) {
        console.error('Error updating subscription status:', error)
      }
    }

    updateSubscriptionStatus()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="p-6 max-w-md w-full text-center space-y-4">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold">Payment Successful!</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Thank you for upgrading to Pro. Your account has been updated.
        </p>
        <Button
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500"
          onClick={() => router.push('/')}
        >
          Start Creating
        </Button>
      </Card>
    </div>
  )
} 