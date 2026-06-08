import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Calendar, Target, MessageSquare, Plus, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clients } = await supabase
    .from('clients').select('id, name, email, coaching_focus, status, avatar_color, created_at')
    .eq('coach_id', user.id).order('created_at', { ascending: false })

  const { data: sessions } = await supabase
    .from('sessions').select('id, session_date')
    .eq('coach_id', user.id)
    .gte('session_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  const { data: goals } = await supabase
    .from('goals').select('id, status').eq('coach_id', user.id)

  const { data: upcomingSessions } = await supabase
    .from('sessions').select('id, session_date, title, duration_minutes, client_id')
    .eq('coach_id', user.id)
    .gte('session_date', new Date().toISOString())
    .order('session_date', { ascending: true }).limit(5)

  const clientIds = [...new Set((upcomingSessions || []).map(s => s.client_id))]
  const { data: sessionClients } = clientIds.length > 0
    ? await supabase.from('clients').select('id, name, avatar_color').in('id', clientIds)
    : { data: [] }

  const safeClients = clients || []
  const safeGoals = goals || []
  const safeUpcoming = upcomingSessions || []
  const safeSessionClients = sessionClients || []

  const activeClients = safeClients.filter(c => c.status === 'active').length
  const sessionsThisWeek = (sessions || []).length
  const activeGoals = safeGoals.filter(g => g.status === 'active').length

  const stats = [
    { label: 'Active Clients',     value: activeClients,     total: safeClients.length, icon: Users,          color: 'var(--accent)',  bg: 'var(--accent-dim)',  href: '/clients'  },
    { label: 'Sessions This Week', value: sessionsThisWeek,  icon: Calendar,            color: 'var(--indigo)', bg: 'var(--indigo-dim)', href: '/sessions' },
    { label: 'Active Goals',       value: activeGoals,       icon: Target,              color: 'var(--amber)',  bg: 'var(--amber-dim)',  href: '/goals'    },
    { label: 'Total Clients',      value: safeClients.length, icon: MessageSquare,      color: 'var(--rose)',   bg: 'var(--rose-dim)',   href: '/clients'  },
  ]

  return (
    <div className="page-content fade-in">
      <style>{`
        .stat-link:hover .stat-card { transform: translateY(-2px); border-color: rgba(255,255,255,0.12); }
        .client-row:hover { background: rgba(255,255,255,0.04); }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', marginBottom: '6px' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Link href="/clients" style={{ textDecoration: 'none' }}>
          <button className="btn-primary"><Plus size={16} /> New Client</button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }} className="stat-link">
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    {stat.label}
                  </p>
                  <p style={{ fontFamily: 'Syne', fontSize: '36px', fontWeight: '800', color: stat.color, lineHeight: 1 }}>
                    {stat.value}
                  </p>
                  {'total' in stat && stat.total !== undefined && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>of {stat.total} total</p>
                  )}
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={20} color={stat.color} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Recent Clients */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: '16px', fontWeight: '700' }}>Recent Clients</h3>
            <Link href="/clients" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '13px', fontWeight: '600' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {safeClients.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {safeClients.slice(0, 5).map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`} style={{ textDecoration: 'none' }}>
                  <div className="client-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
                    <div className="avatar" style={{ background: (client.avatar_color || '#34d399') + '22', color: client.avatar_color || '#34d399' }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px', color: 'var(--text-primary)' }}>{client.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {client.coaching_focus || client.email || 'No focus set'}
                      </p>
                    </div>
                    <span className={`badge ${client.status === 'active' ? 'badge-green' : 'badge-muted'}`}>
                      {client.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <Users size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>No clients yet</p>
              <Link href="/clients">
                <button className="btn-primary" style={{ fontSize: '13px' }}><Plus size={14} /> Add First Client</button>
              </Link>
            </div>
          )}
        </div>

        {/* Upcoming Sessions */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: '16px', fontWeight: '700' }}>Upcoming Sessions</h3>
            <Link href="/sessions" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '13px', fontWeight: '600' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {safeUpcoming.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {safeUpcoming.map((session) => {
                const client = safeSessionClients.find(c => c.id === session.client_id)
                return (
                  <div key={session.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                    <div style={{ minWidth: '50px', textAlign: 'center', padding: '6px', borderRadius: '8px', background: 'var(--accent-dim)', flexShrink: 0 }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase' }}>
                        {format(new Date(session.session_date), 'MMM')}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Syne', color: 'var(--accent)', lineHeight: 1 }}>
                        {format(new Date(session.session_date), 'd')}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '3px' }}>
                        {session.title || (client ? `Session with ${client.name}` : 'Session')}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {format(new Date(session.session_date), 'h:mm a')} · {session.duration_minutes} min
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <Calendar size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>No upcoming sessions</p>
              <Link href="/sessions">
                <button className="btn-primary" style={{ fontSize: '13px' }}><Plus size={14} /> Schedule Session</button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Goals summary */}
      <div className="card" style={{ padding: '24px', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: '16px', fontWeight: '700' }}>Goals Overview</h3>
          <Link href="/goals" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '13px', fontWeight: '600' }}>
            Manage goals <ArrowRight size={14} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            { label: 'Active',    value: safeGoals.filter(g => g.status === 'active').length,    color: 'var(--accent)'  },
            { label: 'Completed', value: safeGoals.filter(g => g.status === 'completed').length, color: 'var(--indigo)' },
            { label: 'Paused',    value: safeGoals.filter(g => g.status === 'paused').length,    color: 'var(--amber)'  },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontSize: '32px', fontWeight: '800', color: item.color }}>{item.value}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{item.label}</div>
              <div className="progress-bar-track" style={{ marginTop: '10px' }}>
                <div className="progress-bar-fill" style={{
                  width: `${safeGoals.length > 0 ? (item.value / safeGoals.length) * 100 : 0}%`,
                  background: item.color,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
