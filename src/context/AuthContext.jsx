import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const AuthContext = createContext(null)

const DEMO_MODE = !isSupabaseConfigured()

function buildProfile(supaUser, meta) {
  return {
    id: supaUser.id,
    name: meta?.display_name || supaUser.user_metadata?.display_name || supaUser.email?.split('@')[0],
    email: supaUser.email,
    phone: meta?.phone || supaUser.phone || '',
    role: meta?.role || supaUser.user_metadata?.role || 'customer',
    avatar: (meta?.display_name || supaUser.email?.split('@')[0] || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    active: meta?.active ?? true,
    joinDate: supaUser.created_at?.split('T')[0],
    loyaltyPoints: meta?.loyalty_points ?? 0,
    tier: meta?.tier || 'Bronze',
    totalSpent: meta?.total_spent ?? 0,
    venueId: meta?.venue_id || null,
    siteId: meta?.site_id || null,
  }
}

async function fetchProfile(userId, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_profile')
      if (!rpcError && rpcData?.length > 0) return rpcData[0]
      if (rpcError) console.warn('[AuthContext] RPC fallback, trying direct query:', rpcError.message)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!error && data) return data
      if (error) console.warn(`[AuthContext] Profile fetch attempt ${i + 1}:`, error.message)

      if (i < retries - 1) await new Promise(r => setTimeout(r, 500 * (i + 1)))
    } catch (e) {
      console.warn(`[AuthContext] Profile fetch attempt ${i + 1} exception:`, e.message)
      if (i < retries - 1) await new Promise(r => setTimeout(r, 500 * (i + 1)))
    }
  }
  return null
}

export function AuthProvider({ children, allUsers, onUsersChange }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const initDone = useRef(false)
  const loginInProgress = useRef(false)

  useEffect(() => {
    if (initDone.current) return
    initDone.current = true

    if (DEMO_MODE) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setCurrentUser(buildProfile(session.user, profile))
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (loginInProgress.current) return

      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id)
        setCurrentUser(buildProfile(session.user, profile))
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback(async (email, password) => {
    if (DEMO_MODE) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const u = allUsers?.find(x => x.email === email && x.password === password)
          if (u) { setCurrentUser(u); resolve(u) }
          else reject(new Error('Invalid email or password'))
        }, 400)
      })
    }

    loginInProgress.current = true
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message?.includes('Email not confirmed')) {
          notify('Please confirm your email address before signing in.', 'warning', 6000)
        }
        throw error
      }

      const profile = await fetchProfile(data.user.id)
      const user = buildProfile(data.user, profile)
      setCurrentUser(user)
      return user
    } finally {
      setLoading(false)
      setTimeout(() => { loginInProgress.current = false }, 1000)
    }
  }, [allUsers])

  const loginDirect = useCallback((user) => {
    setCurrentUser(user)
  }, [])

  const logout = useCallback(async () => {
    if (!DEMO_MODE) {
      await supabase.auth.signOut()
    }
    setCurrentUser(null)
  }, [])

  const register = useCallback(async (form) => {
    if (DEMO_MODE) {
      const nc = {
        id: Date.now(),
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: 'customer',
        avatar: form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        active: true,
        joinDate: new Date().toISOString().split('T')[0],
        loyaltyPoints: 0,
        tier: 'Bronze',
        totalSpent: 0,
      }
      onUsersChange?.(prev => [...prev, nc])
      setCurrentUser(nc)
      return nc
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          display_name: form.name,
          phone: form.phone,
          role: 'customer',
        },
      },
    })
    if (error) throw error
    const user = buildProfile(data.user, null)
    setCurrentUser(user)
    return user
  }, [onUsersChange])

  const value = {
    currentUser,
    setCurrentUser,
    loading,
    login,
    loginDirect,
    logout,
    register,
    isAuthenticated: !!currentUser,
    isDemoMode: DEMO_MODE,
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ width: 48, height: 48, border: '4px solid rgba(255,255,255,.2)', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 18, fontWeight: 900 }}>SCSTix EPOS</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Loading...</div>
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
