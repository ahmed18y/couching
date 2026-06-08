import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Target, TrendingUp, Calendar, MessageSquare, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

export default async function MyDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Find client record linked to this user
  const { data: clientRecord } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!clientRecord) {
    return (
      <div className="page-content fade-in">
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', marginBottom: '12px' }}>
            Welcome to CoachFlow! 👋
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Your coach hasn&apos;t linked your account yet.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Ask your coach to link your account from their dashboard. Your email is: <strong style={{ color: 'var(--accent)' }}>{user.email}</strong>
          </p>
        </div>
      </div>
    )
  }

  const [{ data: goals }, { data: sessions }, { data: progress }, { data: unread }] = await Promise.all([
    supabase.from('goals').select('*').eq('client_id', clientRecord.id).order('created_at', { ascending: false }),
    supabase.from('sessions').select('*').eq('client_id', clientRecord.id).order('session_date', { ascending: false }).limit(5),
    supabase.from('progress_entries').select('*').eq('client_id', clientRecord.id).order('recorded_at', { ascending: false }).limit(6),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('client_id', clientRecord.id).eq('is_read', false).neq('sender_id', user.id),
  ])

  const activeGoals = goals?.filter(g => g.status === 'active') || []
  const avgProgress = activeGoals.length ? Math.round(activeGoals.reduce((s, g) => s + g.progress_percentage, 0) / activeGoals.length) : 0

  return (
    <div className="page-content fade-in">
      {/* Greeting */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: '32px', fontWeight: '800', marginBottom: '6px' }}>
          Hey, {profile?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          {format(new Date(), "EEEE, MMMM d")} — Here&apos;s your coaching overview
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {[
          { label: 'Active Goals', value: activeGoals.length, icon: Target, color: 'var(--indigo)', bg: 'var(--indigo-dim)', href: '/my-goals' },
          { label: 'Avg Progress', value: avgProgress + '%', icon: TrendingUp, color: 'var(--accent)', bg: 'var(--accent-dim)', href: '/my-goals' },
          { label: 'Sessions', value: sessions?.length || 0, icon: Calendar, color: 'var(--amber)', bg: 'var(--amber-dim)', href: '#' },
          { label: 'New Messages', value: (unread as unknown as number) || 0, icon: MessageSquare, color: 'var(--rose)', bg: 'var(--rose-dim)', href: '/my-messages' },
        ].map(s => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = '' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>{s.label}</p>
                  <p style={{ fontFamily: 'Syne', fontSize: '32px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</p>
                </div>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={18} color={s.color} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* My Active Goals */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700' }}>My Active Goals</h3>
            <Link href="/my-goals" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--indigo)', fontSize: '12px', fontWeight: '600' }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {activeGoals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No active goals yet. Your coach will set them up.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeGoals.slice(0, 4).map(g => (
                <div key={g.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{g.title}</span>
                    <span style={{ fontSize: '12px', color: 'var(--indigo)', fontWeight: '700' }}>{g.progress_percentage}%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${g.progress_percentage}%`, background: 'linear-gradient(90deg, var(--indigo), #22d3ee)' }} />
                  </div>
                  {g.target_date && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      Target: {format(new Date(g.target_date), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="card" style={{ padding: '22px' }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700', marginBottom: '18px' }}>Recent Sessions</h3>
          {!sessions || sessions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No sessions yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sessions.slice(0, 4).map(s => (
                <div key={s.id} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '3px' }}>{s.title || 'Coaching Session'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {format(new Date(s.session_date), 'MMM d, yyyy')} · {s.duration_minutes} min
                  </div>
                  {s.next_steps && (
                    <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '5px' }}>✓ {s.next_steps}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent progress */}
      {progress && progress.length > 0 && (
        <div className="card" style={{ padding: '22px', marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700' }}>Recent Progress</h3>
            <Link href="/my-progress" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '12px', fontWeight: '600' }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {progress.map(p => (
              <div key={p.id} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{p.metric_name}</div>
                <div style={{ fontFamily: 'Syne', fontSize: '24px', fontWeight: '800', color: 'var(--accent)' }}>
                  {p.value}{p.unit ? <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif', fontWeight: '400' }}>{p.unit}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
