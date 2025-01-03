'use client'

import { useEffect } from 'react'
import { authStore } from '@/lib/auth-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Layout mount olduğunda auth durumunu başlat
    const initAuth = async () => {
      await authStore.initialize()
    }
    initAuth()

    // Auth state değişikliklerini dinle
    const handleStorageChange = () => {
      authStore.refreshAuth()
    }

    // Storage değişikliklerini dinle
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return <>{children}</>
} 