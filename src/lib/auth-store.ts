import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'

export type { User }

class AuthStore {
  private supabase = createClientComponentClient()
  private user: User | null = null
  private subscription: string | null = null
  private initialized = false
  private persistedAuth = false

  setUser(user: User | null) {
    this.user = user
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user))
      this.persistedAuth = true
    } else {
      localStorage.removeItem('auth_user')
      this.persistedAuth = false
    }
    window.dispatchEvent(new Event('auth-changed'))
  }

  async initialize() {
    if (this.initialized) return

    try {
      const persistedUser = localStorage.getItem('auth_user')
      if (persistedUser) {
        this.persistedAuth = true
      }

      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (session?.user) {
        this.user = session.user
        localStorage.setItem('auth_user', JSON.stringify(session.user))
        await this.fetchSubscriptionStatus()
      } else if (this.persistedAuth) {
        const { data: { session: refreshedSession } } = await this.supabase.auth.refreshSession()
        if (refreshedSession?.user) {
          this.user = refreshedSession.user
          await this.fetchSubscriptionStatus()
        }
      }

      this.supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          this.user = null
          this.subscription = null
          localStorage.removeItem('auth_user')
          this.persistedAuth = false
          window.dispatchEvent(new Event('auth-changed'))
        } else if (session?.user) {
          this.user = session.user
          localStorage.setItem('auth_user', JSON.stringify(session.user))
          await this.fetchSubscriptionStatus()
        }
      })

      this.initialized = true
    } catch (error) {
      console.error('Auth initialization error:', error)
      this.initialized = false
    }
  }

  private async fetchSubscriptionStatus() {
    try {
      const { data, error } = await this.supabase
        .from('user_subscriptions')
        .select('subscription_type')
        .eq('user_id', this.user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error) throw error
      
      this.subscription = data?.subscription_type ?? 'free'
      console.log('Current subscription status:', this.subscription)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      this.subscription = 'free'
    }
  }

  async refreshAuth() {
    try {
      if (!this.persistedAuth) return

      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (session?.user) {
        this.user = session.user
        await this.fetchSubscriptionStatus()
      } else {
        const { data: { session: refreshedSession } } = await this.supabase.auth.refreshSession()
        if (refreshedSession?.user) {
          this.user = refreshedSession.user
          await this.fetchSubscriptionStatus()
        }
      }
    } catch (error) {
      console.error('Auth refresh error:', error)
    }
  }

  isAuthenticated() {
    return !!this.user || this.persistedAuth
  }

  getUser() {
    return this.user
  }

  async signOut() {
    try {
      await this.supabase.auth.signOut()
      this.setUser(null)
      this.subscription = null
      
      localStorage.clear()
      sessionStorage.clear()
      
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
      
      window.location.reload()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  logout() {
    this.signOut()
  }

  isPro() {
    return this.subscription === 'pro'
  }
}

export const authStore = new AuthStore() 