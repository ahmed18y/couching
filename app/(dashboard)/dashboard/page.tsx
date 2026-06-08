import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Calendar, Target, MessageSquare, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all data in parallel
  const [
    { data: clients },
    { data: sessions },
    { data: goals },
    { data: unreadMessages },
    { data: recentClients },
    { data: upcomingSessions },
  ] = await Promise.all([
    supabase.from('clients').select('id, status').eq('coach_id', user.id),
    supabase.from('sessions').select('id, session_date').eq('coach_id', user.id).gte('session_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('goals').select('id, status').eq('coach_id', user.id),
    supabase.from('messages').select('id').eq('is_read', false).neq('sender_id', user.id),
    supabase.from('clients').select('id, name, email, coaching_focus, status, avatar_color, created_at').eq('coach_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('sessions').select('id, session_date, title, duration_minutes, mood, client:clients(name, avatar_color)').eq('coach_id', user.id).gte('session_date', new Date().toISOString()).order('session_date', { ascending: true }).limit(5),
  ])

  const activeClients = clients?.filter(c => c.status === 'active').length ?? 0
  const totalClients = clients?.length ?? 0
  const sessionsThisWeek = sessions?.length ?? 0
  const activeGoals = goals?.filter(g => g.status === 'active').length ?? 0
  const unread = unreadMessages?.length ?? 0

  const stats = [
    { label: 'Active Clients', value: activeClients, total: totalClients, icon: Users, color: 'var(--accent)', bg: 'var(--accent-dim)', href: '/clients' },
    { label: 'Sessions This Week', value: sessionsThisWeek, icon: Calendar, color: 'var(--indigo)', bg: 'var(--indigo-dim)', href: '/sessions' },
    { label: 'Active Goals', value: activeGoals, icon: Target, color: 'var(--amber)', bg: 'var(--amber-dim)', href: '/goals' },
    { label: 'Unread Messages', value: unread, icon: MessageSquare, color: 'var(--rose)', bg: 'var(--rose-dim)', href: '/messages' },
  ]

  const moodColors: Record<string, string> = {
    excellent: 'var(--accent)', good: 'var(--indigo)',
    neutral: 'var(--text-muted)', challenging: 'var(--amber)', difficult: 'var(--rose)',
  }

  return (
    <div className="page-content fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', marginBottom: '6px' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {format(new Date(), "EEEE, MMMM d, yyyy")} — Overview of your coaching practice
          </p>
        </div>
        <Link href="/clients" style={{ textDecoration: 'none' }}>
          <button className="btn-primary">
            <Plus size={16} /> New Client
          </button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    {stat.label}
                  </p>
                  <p style={{ fontFamily: 'Syne', fontSize: '36px', fontWeight: '800', color: stat.color, lineHeight: 1 }}>
                    {stat.value}
                  </p>
                  {stat.total !== undefined && (
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

      {/* Two column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Recent Clients */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: '16px', fontWeight: '700' }}>Recent Clients</h3>
            <Link href="/clients" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '13px', fontWeight: '600' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {recentClients && recentClients.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentClients.map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', transition: 'background 0.15s', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)' )}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '' )}
                  >
                    <div className="avatar" style={{ background: client.avatar_color + '22', color: client.avatar_color }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>{client.name}</p>
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
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Users size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No clients yet.</p>
              <Link href="/clients">
                <button className="btn-primary" style={{ marginTop: '12px', fontSize: '13px' }}>
                  <Plus size={14} /> Add First Client
                </button>
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
          {upcomingSessions && upcomingSessions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingSessions.map((session) => {
                const client = Array.isArray(session.client) ? session.client[0] : session.client as { name: string; avatar_color: string } | null
                return (
                  <div key={session.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                    <div style={{ minWidth: '52px', textAlign: 'center', padding: '6px', borderRadius: '8px', background: 'var(--accent-dim)' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase' }}>
                        {format(new Date(session.session_date), 'MMM')}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Syne', color: 'var(--accent)', lineHeight: 1 }}>
                        {format(new Date(session.session_date), 'd')}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '3px' }}>
                        {session.title || `Session with ${client?.name}`}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {format(new Date(session.session_date), 'h:mm a')} · {session.duration_minutes} min
                      </p>
                    </div>
                    {session.mood && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: moodColors[session.mood] || 'var(--text-muted)', flexShrink: 0, marginTop: '4px' }} />
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Calendar size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No upcoming sessions.</p>
              <Link href="/sessions">
                <button className="btn-primary" style={{ marginTop: '12px', fontSize: '13px' }}>
                  <Plus size={14} /> Schedule Session
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Progress Bar Overview */}
      <div className="card" style={{ padding: '24px', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: '16px', fontWeight: '700' }}>Goals Overview</h3>
          <Link href="/goals" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '13px', fontWeight: '600' }}>
            Manage goals <ArrowRight size={14} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            { label: 'Active', value: goals?.filter(g => g.status === 'active').length ?? 0, color: 'var(--accent)' },
            { label: 'Completed', value: goals?.filter(g => g.status === 'completed').length ?? 0, color: 'var(--indigo)' },
            { label: 'Paused', value: goals?.filter(g => g.status === 'paused').length ?? 0, color: 'var(--amber)' },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontSize: '32px', fontWeight: '800', color: item.color }}>{item.value}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{item.label}</div>
              <div className="progress-bar-track" style={{ marginTop: '10px' }}>
                <div className="progress-bar-fill" style={{
                  width: `${goals && goals.length > 0 ? (item.value / goals.length) * 100 : 0}%`,
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
