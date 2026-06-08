'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Zap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Get user role to redirect correctly
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'client') {
        router.push('/my-dashboard')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)' }}>
      {/* Left: Branding */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0d1120 0%, #0a1628 100%)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden',
      }} className="hidden md:flex">
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-80px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '60px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={20} color="#000" fill="#000" />
            </div>
            <span style={{ fontFamily: 'Syne', fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>
              CoachFlow
            </span>
          </div>

          <h1 style={{
            fontFamily: 'Syne', fontSize: '44px', fontWeight: '800',
            lineHeight: '1.15', color: 'var(--text-primary)', marginBottom: '20px',
          }}>
            Transform lives.<br />
            <span style={{ color: 'var(--accent)' }}>Track progress.</span><br />
            Build impact.
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.7', maxWidth: '380px' }}>
            The all-in-one coaching platform to manage your clients, track their growth, and deliver exceptional results.
          </p>

          <div style={{ marginTop: '60px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { num: '50+', label: 'Clients managed effortlessly' },
              { num: '100%', label: 'Free with Supabase + Vercel' },
              { num: '∞', label: 'Real-time messaging' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{
                  fontFamily: 'Syne', fontSize: '24px', fontWeight: '800',
                  color: 'var(--accent)', minWidth: '60px',
                }}>{item.num}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div style={{
        flex: 1, maxWidth: '520px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '40px 48px',
      }}>
        <div style={{ width: '100%', animation: 'fadeIn 0.4s ease' }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }} className="flex md:hidden">
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={18} color="#000" fill="#000" />
            </div>
            <span style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: '700' }}>CoachFlow</span>
          </div>

          <h2 style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '36px', fontSize: '14px' }}>
            Sign in to your coaching dashboard
          </p>

          {error && (
            <div style={{
              background: 'var(--rose-dim)', border: '1px solid rgba(251,113,133,0.25)',
              borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
              color: 'var(--rose)', fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Email
              </label>
              <input
                className="input"
                type="email"
                placeholder="coach@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ justifyContent: 'center', marginTop: '8px', padding: '12px' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
