'use client'

import { useEffect } from 'react'
import { authStore } from '@/lib/auth-store'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    authStore.initialize()
  }, [])

  return children
} 