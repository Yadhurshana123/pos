import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui'
import { notify } from '@/components/shared'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

export function RegisterPage() {
  const { t } = useTheme()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1=form, 2=otp, 3=done
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [err, setErr] = useState('')

  const sendOtp = () => {
    setErr('')
    const parsed = registerSchema.safeParse(form)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message
      notify(firstError || 'Validation failed', 'error')
      setErr(firstError || 'Validation failed')
      return
    }
    const code = String(Math.floor(100000 + Math.random() * 900000))
    setGeneratedOtp(code)
    setStep(2)
    notify(`OTP sent to ${form.phone}: ${code} (Demo - OTP shown on screen)`, 'info', 8000)
  }

  const verify = async () => {
    if (otp === generatedOtp) {
      setStep(3);
      try {
        await register(form);
        const from = location.state?.from || '/app';
        setTimeout(() => {
          navigate(from, { state: location.state, replace: true });
        }, 1000);
      } catch (e) {
        setStep(1);
        setErr(e.message || 'Registration failed');
        notify(e.message || 'Registration failed', 'error');
      }
    } else {
      setErr('Invalid OTP. Try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: t.bg }}>
      <div style={{ flex: 1, background: `linear-gradient(160deg,${t.accent} 0%,#7f1d1d 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative', overflow: 'hidden' }} className="hide-mobile">
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'relative', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 72, marginBottom: 16, width: 80, height: 80, background: 'rgba(255,255,255,0.15)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', margin: '0 auto' }}>S</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>Join SCSTix EPOS</div>
          <div style={{ fontSize: 16, opacity: 0.8, marginTop: 12, lineHeight: 1.6 }}>Create your account and start earning loyalty points on every purchase.</div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32 }}>
            {[['⭐', 'Earn Loyalty Points'], ['🎁', 'Exclusive Offers'], ['🚚', 'Free Delivery']].map(([i, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{i}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 480, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px,4vw,40px)', background: t.bg2 }}>
        <div style={{ width: '100%' }}>
          <button onClick={() => navigate('/')} style={{ background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, color: t.text3, cursor: 'pointer', marginBottom: 24 }}>← Back to Store</button>
          {/* Steps */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28, gap: 0 }}>
            {['Your Details', 'Verify OTP (Demo - OTP shown on screen)', 'Complete'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : undefined }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: step > i ? t.accent : step === i + 1 ? t.accent : t.bg4, color: step > i || step === i + 1 ? '#fff' : t.text3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: 10, color: step === i + 1 ? t.accent : t.text4, fontWeight: 700, whiteSpace: 'nowrap' }}>{s}</div>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 2, background: step > i + 1 ? t.accent : t.border, margin: '0 4px', marginBottom: 18 }} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: t.text, marginBottom: 6 }}>Create Account</div>
              <div style={{ fontSize: 14, color: t.text3, marginBottom: 24 }}>Fill in your details to get started</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input t={t} label="Full Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="John Smith" required />
                <Input t={t} label="Email Address" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" placeholder="john@email.com" required />
                <Input t={t} label="Phone Number" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="+44 7700 900000" required note="OTP will be sent to this number (Demo - OTP shown on screen)" />
                <Input t={t} label="Password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} type="password" placeholder="Min 6 characters" required />
                <Input t={t} label="Confirm Password" value={form.confirmPassword} onChange={v => setForm(f => ({ ...f, confirmPassword: v }))} type="password" placeholder="Confirm your password" required />
                {err && <div style={{ color: t.red, background: t.redBg, border: `1px solid ${t.redBorder}`, borderRadius: 9, padding: '10px 14px', fontSize: 13 }}>{err}</div>}
                <button onClick={sendOtp} style={{ width: '100%', padding: 14, background: `linear-gradient(135deg,${t.blue},#1e40af)`, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Send OTP →</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: t.text, marginBottom: 6 }}>Verify Your Number</div>
              <div style={{ fontSize: 14, color: t.text3, marginBottom: 8 }}>We sent a 6-digit OTP to <strong>{form.phone}</strong></div>
              <div style={{ background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: t.yellow, fontWeight: 700 }}>
                📱 Demo OTP: <span style={{ fontSize: 22, letterSpacing: 4, fontFamily: 'monospace' }}>{generatedOtp}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input t={t} label="Enter 6-Digit OTP" value={otp} onChange={v => { setOtp(v); setErr(''); }} placeholder="______" note="Check the yellow box above for demo OTP" />
                {err && <div style={{ color: t.red, background: t.redBg, border: `1px solid ${t.redBorder}`, borderRadius: 9, padding: '10px 14px', fontSize: 13 }}>{err}</div>}
                <button onClick={verify} disabled={otp.length < 6} style={{ width: '100%', padding: 14, background: `linear-gradient(135deg,${t.green},#15803d)`, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 900, cursor: otp.length < 6 ? 'not-allowed' : 'pointer', opacity: otp.length < 6 ? 0.5 : 1 }}>Verify & Create Account ✓</button>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: t.text3, cursor: 'pointer', fontSize: 13 }}>← Edit details</button>
              </div>
            </>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: t.text }}>Welcome to SCSTix EPOS!</div>
              <div style={{ fontSize: 14, color: t.text3, marginTop: 8 }}>Account created. Signing you in...</div>
              <div style={{ marginTop: 20, display: 'inline-block', width: 24, height: 24, border: `3px solid ${t.accent}`, borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: t.text3 }}>
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: t.accent, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Sign In</button>
          </div>
        </div>
      </div>
    </div>
  )
}
