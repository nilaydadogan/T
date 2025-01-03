'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface ErrorDisplayProps {
  error: Error | null
  reset?: () => void
}

export function ErrorDisplay({ error, reset }: ErrorDisplayProps) {
  if (!error) return null

  return (
    <div className="min-h-[200px] flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold">Something went wrong!</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
          {reset && (
            <Button variant="outline" onClick={reset}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 