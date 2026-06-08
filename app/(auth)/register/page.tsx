'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Zap, Users, User } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'coach' | 'client'>('coach')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Insert profile
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        email,
        role,
      })

      if (role === 'client') {
        router.push('/my-dashboard')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-dim)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Zap size={28} color="var(--accent)" />
          </div>
          <h2 style={{ fontFamily: 'Syne', fontSize: '24px', marginBottom: '8px' }}>Account created!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Check your email to confirm, then <Link href="/login" style={{ color: 'var(--accent)' }}>sign in</Link>.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '460px', animation: 'fadeIn 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', justifyContent: 'center' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="#000" fill="#000" />
          </div>
          <span style={{ fontFamily: 'Syne', fontSize: '22px', fontWeight: '700' }}>CoachFlow</span>
        </div>

        <div className="card" style={{ padding: '36px' }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: '24px', fontWeight: '700', marginBottom: '6px' }}>Create your account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
            Join CoachFlow and start your journey
          </p>

          {/* Role selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
            {([
              { value: 'coach', label: 'I\'m a Coach', icon: Users, desc: 'Manage clients & sessions' },
              { value: 'client', label: 'I\'m a Client', icon: User, desc: 'Track my progress' },
            ] as const).map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                style={{
                  background: role === value ? 'var(--accent-dim)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${role === value ? 'var(--border-active)' : 'var(--border)'}`,
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={18} color={role === value ? 'var(--accent)' : 'var(--text-secondary)'} style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '13px', fontWeight: '600', color: role === value ? 'var(--accent)' : 'var(--text-primary)', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{desc}</div>
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background: 'var(--rose-dim)', border: '1px solid rgba(251,113,133,0.25)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: 'var(--rose)', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '7px' }}>Full Name</label>
              <input className="input" placeholder="Ahmed Mohamed" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '7px' }}>Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '7px' }}>Password</label>
              <input className="input" type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: '4px', padding: '12px' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
