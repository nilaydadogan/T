import { GeneratedAsset } from '@/types/user'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { authStore } from '@/lib/auth-store'
import { useEffect } from 'react'

class Storage {
  private assets: GeneratedAsset[] = []
  private initialized = false
  private supabase = createClientComponentClient()

  async initialize() {
    console.log('🔄 Starting storage initialization...')
    
    if (!authStore.isAuthenticated()) {
      console.warn('⚠️ Cannot initialize storage: User not authenticated')
      return
    }

    const userId = authStore.getUser()?.id
    if (!userId) {
      console.warn('⚠️ Cannot initialize storage: No user ID found')
      return
    }

    console.log('🔄 Initializing storage for user:', userId)

    try {
      // Get user's assets from Supabase
      const { data: assets, error } = await this.supabase
        .from('assets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error loading assets:', error)
        throw error
      }

      this.assets = assets || []
      console.log('✅ Loaded assets:', this.assets.length)
      console.log('📋 Current assets in storage:', this.assets.length)
    } catch (error) {
      console.error('❌ Storage initialization error:', error)
      this.assets = []
    }
  }

  async addAsset(asset: GeneratedAsset) {
    const user = authStore.getUser()
    if (!user) {
      console.warn('⚠️ No user found when adding asset')
      return
    }

    try {
      // Get current session to verify authentication
      const { data: { session } } = await this.supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      console.log('Current session:', session)
      console.log('➕ Adding asset to Supabase:', {
        id: asset.id,
        type: asset.type,
        name: asset.name,
        size: asset.size
      })

      const { data, error } = await this.supabase
        .from('assets')
        .insert([{
          id: asset.id,
          user_id: user.id,
          type: asset.type,
          name: asset.name,
          url: asset.url,
          size: asset.size,
          created_at: new Date(asset.createdAt).toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase insert error:', error)
        throw error
      }

      console.log('✅ Asset added successfully:', data)
      this.assets.unshift(asset)
    } catch (error) {
      console.error('❌ Failed to add asset:', error)
      throw error
    }
  }

  async removeAsset(assetId: string) {
    const user = authStore.getUser()
    if (!user) return

    try {
      // Supabase'den asset'i sil
      const { error } = await this.supabase
        .from('assets')
        .delete()
        .eq('id', assetId)
        .eq('user_id', user.id)

      if (error) throw error

      this.assets = this.assets.filter(a => a.id !== assetId)
    } catch (error) {
      console.error('Failed to remove asset:', error)
      throw error
    }
  }

  getAssets(): GeneratedAsset[] {
    console.log('📋 Current assets in storage:', this.assets.length)
    return [...this.assets]
  }
}

export const storage = new Storage() 