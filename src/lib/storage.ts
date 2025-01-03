import type { GeneratedAsset } from '@/types/user'
import { authStore } from '@/lib/auth-store'

const STORAGE_KEY = 'generated_assets'

export const storage = {
  addAsset: (asset: GeneratedAsset) => {
    if (typeof window === 'undefined') return

    const userId = authStore.getUser()?.id
    if (!userId) return

    const userKey = `${STORAGE_KEY}_${userId}`
    const assets = storage.getAssets()
    localStorage.setItem(userKey, JSON.stringify([...assets, asset]))
  },

  getAssets: () => {
    if (typeof window === 'undefined') return []

    const userId = authStore.getUser()?.id
    if (!userId) return []

    const userKey = `${STORAGE_KEY}_${userId}`
    const assets = localStorage.getItem(userKey)
    return assets ? JSON.parse(assets) : []
  },

  removeAsset: (assetId: string) => {
    if (typeof window === 'undefined') return

    const userId = authStore.getUser()?.id
    if (!userId) return

    const userKey = `${STORAGE_KEY}_${userId}`
    const assets = storage.getAssets()
    localStorage.setItem(
      userKey,
      JSON.stringify(assets.filter((asset: GeneratedAsset) => asset.id !== assetId))
    )
  },

  clearAssets: () => {
    if (typeof window === 'undefined') return

    const userId = authStore.getUser()?.id
    if (!userId) return

    const userKey = `${STORAGE_KEY}_${userId}`
    localStorage.removeItem(userKey)
  }
} 