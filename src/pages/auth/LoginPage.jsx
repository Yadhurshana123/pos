import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui'
import { notify } from '@/components/shared'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export function LoginPage() {
  const { t } = useTheme()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setErr('')
    const parsed = loginSchema.safeParse({ email, password: pass })
    if (!parsed.success) {
      const firstError = parsed.error?.issues?.[0]?.message
      notify(firstError || 'Validation failed', 'error')
      setErr(firstError || 'Validation failed')
      return
    }
    setLoading(true)
    try {
      await login(email, pass)
      navigate('/venue-confirm')
    } catch (e) {
      setErr(e.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: t.bg }}>
      <div style={{ flex: 1, background: `linear-gradient(160deg,${t.accent} 0%,#7f1d1d 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative', overflow: 'hidden' }} className="hide-mobile">
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'relative', textAlign: 'center', color: '#fff', maxWidth: 360 }}>
          <div style={{ fontSize: 80, marginBottom: 16, width: 80, height: 80, background: 'rgba(255,255,255,0.15)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff' }}>S</div>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1, marginBottom: 10 }}>SCSTix EPOS</div>
          <div style={{ fontSize: 16, opacity: 0.8, lineHeight: 1.6 }}>Merchandise point of sale. Sign in to manage your store or account.</div>
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 460, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px,4vw,40px)', background: t.bg2 }}>
        <div style={{ width: '100%' }}>
          <button onClick={() => navigate('/')} style={{ background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, color: t.text3, cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>← Back to Store</button>
          <div style={{ fontSize: 26, fontWeight: 900, color: t.text, marginBottom: 6 }}>Welcome back</div>
          <div style={{ fontSize: 14, color: t.text3, marginBottom: 28 }}>Sign in to your account</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input t={t} label="Email Address" value={email} onChange={setEmail} type="email" placeholder="email@example.com" />
            <Input t={t} label="Password" value={pass} onChange={setPass} type="password" placeholder="••••••••" />
            {err && <div style={{ color: t.red, background: t.redBg, border: `1px solid ${t.redBorder}`, borderRadius: 9, padding: '10px 14px', fontSize: 13 }}>{err}</div>}
            <button onClick={handle} disabled={loading} style={{ width: '100%', padding: 14, background: `linear-gradient(135deg,${t.accent},${t.accent2})`, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: `0 4px 16px ${t.accent}40` }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </div>
          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: t.text3 }}>
            Don&apos;t have an account?{' '}
            <button onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: t.accent, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Register</button>
          </div>
        </div>
      </div>
    </div>
  )
}
