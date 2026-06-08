import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Target } from 'lucide-react'
import { format } from 'date-fns'

export default async function MyGoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clientRecord } = await supabase.from('clients').select('*').eq('user_id', user.id).single()
  if (!clientRecord) redirect('/my-dashboard')

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('client_id', clientRecord.id)
    .order('created_at', { ascending: false })

  const statusGroups = {
    active: goals?.filter(g => g.status === 'active') || [],
    completed: goals?.filter(g => g.status === 'completed') || [],
    paused: goals?.filter(g => g.status === 'paused') || [],
  }

  return (
    <div className="page-content fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>My Goals</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {goals?.filter(g => g.status === 'active').length || 0} active · {goals?.filter(g => g.status === 'completed').length || 0} completed
        </p>
      </div>

      {!goals || goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <Target size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>No goals set yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>Your coach will set goals for you soon.</p>
        </div>
      ) : (
        Object.entries(statusGroups).map(([status, list]) => list.length > 0 && (
          <div key={status} style={{ marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'Syne', fontSize: '16px', fontWeight: '700', marginBottom: '14px', textTransform: 'capitalize', color: status === 'active' ? 'var(--indigo)' : status === 'completed' ? 'var(--accent)' : 'var(--amber)' }}>
              {status} Goals
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {list.map(goal => (
                <div key={goal.id} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
                      background: `conic-gradient(var(--indigo) ${goal.progress_percentage * 3.6}deg, rgba(255,255,255,0.07) 0deg)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: 'Syne', fontSize: '12px', fontWeight: '800', color: 'var(--indigo)' }}>{goal.progress_percentage}%</span>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontFamily: 'Syne', fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>{goal.title}</h3>
                      {goal.category && <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--indigo)', background: 'var(--indigo-dim)', padding: '2px 8px', borderRadius: '999px', marginBottom: '8px', display: 'inline-block' }}>{goal.category}</span>}
                      {goal.description && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{goal.description}</p>}
                      <div className="progress-bar-track" style={{ marginBottom: '8px' }}>
                        <div className="progress-bar-fill" style={{ width: `${goal.progress_percentage}%`, background: 'linear-gradient(90deg, var(--indigo), #22d3ee)' }} />
                      </div>
                      {goal.target_date && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          🎯 Target: {format(new Date(goal.target_date), 'MMMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
