import { authStore } from '@/lib/auth-store'

const isBrowser = typeof window !== 'undefined'

const STORAGE_KEYS = {
  AI_GENERATIONS: 'ai_generations_count',
  MANUAL_GENERATIONS: 'manual_generations_count'
}

export const userLimits = {
  MAX_FREE_GENERATIONS: 1, // 1 AI generation for free users
  MAX_FREE_MANUAL: 3,     // 3 manual generations for free users

  getGenerationCount: () => {
    if (!isBrowser) return 0
    return parseInt(localStorage.getItem(STORAGE_KEYS.AI_GENERATIONS) || '0')
  },

  getManualCount: () => {
    if (!isBrowser) return 0
    return parseInt(localStorage.getItem(STORAGE_KEYS.MANUAL_GENERATIONS) || '0')
  },

  incrementGenerationCount: () => {
    if (!isBrowser || authStore.isPro()) return // Don't increment for pro users
    const current = userLimits.getGenerationCount()
    localStorage.setItem(STORAGE_KEYS.AI_GENERATIONS, (current + 1).toString())
  },

  incrementManualCount: () => {
    if (!isBrowser || authStore.isPro()) return // Don't increment for pro users
    const current = userLimits.getManualCount()
    localStorage.setItem(STORAGE_KEYS.MANUAL_GENERATIONS, (current + 1).toString())
  },

  canUseAIGeneration: () => {
    if (!isBrowser) return false
    const isPro = authStore.isPro()
    console.log('Checking AI generation permission:', { isPro })
    if (isPro) return true
    const count = userLimits.getGenerationCount()
    console.log('Current generation count:', count)
    return count < userLimits.MAX_FREE_GENERATIONS
  },

  canUseManualCreation: () => {
    if (!isBrowser) return false
    if (authStore.isPro()) return true // Always allow pro users
    return userLimits.getManualCount() < userLimits.MAX_FREE_MANUAL
  },

  shouldShowUpgrade: () => {
    if (!isBrowser) return false
    if (!authStore.isAuthenticated()) return false
    if (authStore.isPro()) return false
    
    // Show upgrade if user has reached either limit
    return userLimits.getGenerationCount() >= userLimits.MAX_FREE_GENERATIONS ||
           userLimits.getManualCount() >= userLimits.MAX_FREE_MANUAL
  }
} 