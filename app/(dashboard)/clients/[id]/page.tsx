'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Client, Session, Goal, ProgressEntry } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Calendar, Target, TrendingUp, Plus, Edit2, Trash2, X } from 'lucide-react'
import { format } from 'date-fns'

type Tab = 'overview' | 'sessions' | 'goals' | 'progress'

const moodColors: Record<string, string> = {
  excellent: '#34d399', good: '#818cf8', neutral: '#94a3b8', challenging: '#fbbf24', difficult: '#fb7185'
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [progress, setProgress] = useState<ProgressEntry[]>([])
  const [tab, setTab] = useState<Tab>('overview')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)

  // Session modal
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [sessionForm, setSessionForm] = useState({ title: '', session_date: '', duration_minutes: '60', notes: '', mood: '', next_steps: '' })
  const [savingSession, setSavingSession] = useState(false)

  // Goal modal
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalForm, setGoalForm] = useState({ title: '', description: '', category: '', target_date: '', progress_percentage: '0' })
  const [savingGoal, setSavingGoal] = useState(false)

  // Progress modal
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressForm, setProgressForm] = useState({ metric_name: '', value: '', unit: '', notes: '' })
  const [savingProgress, setSavingProgress] = useState(false)

  const supabase = createClient()

  useEffect(() => { loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    const [{ data: c }, { data: s }, { data: g }, { data: p }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('sessions').select('*').eq('client_id', id).order('session_date', { ascending: false }),
      supabase.from('goals').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('progress_entries').select('*').eq('client_id', id).order('recorded_at', { ascending: false }),
    ])
    setClient(c)
    setSessions(s || [])
    setGoals(g || [])
    setProgress(p || [])
    setLoading(false)
  }

  async function saveSession() {
    setSavingSession(true)
    await supabase.from('sessions').insert({
      client_id: id, coach_id: userId,
      title: sessionForm.title || null,
      session_date: sessionForm.session_date,
      duration_minutes: parseInt(sessionForm.duration_minutes),
      notes: sessionForm.notes || null,
      mood: sessionForm.mood || null,
      next_steps: sessionForm.next_steps || null,
    })
    setShowSessionModal(false)
    setSessionForm({ title: '', session_date: '', duration_minutes: '60', notes: '', mood: '', next_steps: '' })
    loadAll()
    setSavingSession(false)
  }

  async function saveGoal() {
    setSavingGoal(true)
    await supabase.from('goals').insert({
      client_id: id, coach_id: userId,
      title: goalForm.title, description: goalForm.description || null,
      category: goalForm.category || null, target_date: goalForm.target_date || null,
      progress_percentage: parseInt(goalForm.progress_percentage),
    })
    setShowGoalModal(false)
    setGoalForm({ title: '', description: '', category: '', target_date: '', progress_percentage: '0' })
    loadAll()
    setSavingGoal(false)
  }

  async function saveProgress() {
    setSavingProgress(true)
    await supabase.from('progress_entries').insert({
      client_id: id, coach_id: userId,
      metric_name: progressForm.metric_name, value: parseFloat(progressForm.value),
      unit: progressForm.unit || null, notes: progressForm.notes || null,
    })
    setShowProgressModal(false)
    setProgressForm({ metric_name: '', value: '', unit: '', notes: '' })
    loadAll()
    setSavingProgress(false)
  }

  async function updateGoalProgress(goalId: string, pct: number) {
    await supabase.from('goals').update({ progress_percentage: pct }).eq('id', goalId)
    loadAll()
  }

  async function deleteSession(sid: string) {
    if (!confirm('Delete this session?')) return
    await supabase.from('sessions').delete().eq('id', sid)
    loadAll()
  }

  async function deleteGoal(gid: string) {
    if (!confirm('Delete this goal?')) return
    await supabase.from('goals').delete().eq('id', gid)
    loadAll()
  }

  if (loading) return <div className="page-content" style={{ color: 'var(--text-muted)', padding: '80px 32px' }}>Loading...</div>
  if (!client) return <div className="page-content" style={{ padding: '80px 32px', color: 'var(--rose)' }}>Client not found.</div>

  const tabs: { key: Tab; label: string; icon: typeof Calendar; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: Target },
    { key: 'sessions', label: 'Sessions', icon: Calendar, count: sessions.length },
    { key: 'goals', label: 'Goals', icon: Target, count: goals.length },
    { key: 'progress', label: 'Progress', icon: TrendingUp, count: progress.length },
  ]

  return (
    <div className="page-content fade-in">
      {/* Back */}
      <Link href="/clients" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to Clients
      </Link>

      {/* Profile Header */}
      <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div className="avatar" style={{ width: '72px', height: '72px', fontSize: '28px', background: client.avatar_color + '22', color: client.avatar_color }}>
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h1 style={{ fontFamily: 'Syne', fontSize: '24px', fontWeight: '800' }}>{client.name}</h1>
              <span className={`badge ${client.status === 'active' ? 'badge-green' : 'badge-muted'}`}>{client.status}</span>
              {client.coaching_focus && <span className="badge badge-blue">{client.coaching_focus}</span>}
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {client.email && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}><Mail size={13} />{client.email}</span>}
              {client.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}><Phone size={13} />{client.phone}</span>}
              {client.age && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Age: {client.age}</span>}
              {client.start_date && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Started: {format(new Date(client.start_date), 'MMM d, yyyy')}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/messages">
              <button className="btn-primary" style={{ fontSize: '13px', padding: '8px 14px' }}>Message</button>
            </Link>
          </div>
        </div>
        {client.bio && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>{client.bio}</p>}
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Sessions', value: sessions.length, color: 'var(--indigo)' },
          { label: 'Goals', value: goals.filter(g => g.status === 'active').length, color: 'var(--accent)' },
          { label: 'Avg Progress', value: goals.length ? Math.round(goals.reduce((s, g) => s + g.progress_percentage, 0) / goals.length) + '%' : '—', color: 'var(--amber)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '-1px' }}>
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              padding: '10px 18px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
              background: tab === key ? 'var(--accent-dim)' : 'transparent',
              color: tab === key ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: '600', fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
              borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            <Icon size={15} /> {label}
            {count !== undefined && <span style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 7px', borderRadius: '999px', fontSize: '11px' }}>{count}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Recent Sessions</h3>
            {sessions.slice(0, 3).map(s => (
              <div key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{s.title || 'Session'}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{format(new Date(s.session_date), 'MMM d')}</span>
                </div>
                {s.notes && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.notes}</p>}
              </div>
            ))}
            {sessions.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No sessions yet.</p>}
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Active Goals</h3>
            {goals.filter(g => g.status === 'active').slice(0, 3).map(g => (
              <div key={g.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{g.title}</span>
                  <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '700' }}>{g.progress_percentage}%</span>
                </div>
                <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${g.progress_percentage}%` }} /></div>
              </div>
            ))}
            {goals.filter(g => g.status === 'active').length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No active goals.</p>}
          </div>
        </div>
      )}

      {tab === 'sessions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button className="btn-primary" onClick={() => setShowSessionModal(true)}><Plus size={15} /> Add Session</button>
          </div>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}><Calendar size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} /><p style={{ color: 'var(--text-muted)' }}>No sessions yet.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sessions.map(s => (
                <div key={s.id} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <h4 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700' }}>{s.title || 'Coaching Session'}</h4>
                        {s.mood && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: moodColors[s.mood], display: 'inline-block' }} title={s.mood} />}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{format(new Date(s.session_date), 'EEE, MMM d, yyyy')}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.duration_minutes} min</span>
                      </div>
                      {s.notes && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{s.notes}</p>}
                      {s.next_steps && <div style={{ background: 'var(--accent-dim)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: 'var(--accent)' }}><strong>Next steps:</strong> {s.next_steps}</div>}
                    </div>
                    <button className="btn-danger" onClick={() => deleteSession(s.id)} style={{ padding: '6px 8px', marginLeft: '12px' }}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'goals' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button className="btn-primary" onClick={() => setShowGoalModal(true)}><Plus size={15} /> Add Goal</button>
          </div>
          {goals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}><Target size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} /><p style={{ color: 'var(--text-muted)' }}>No goals yet.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {goals.map(g => (
                <div key={g.id} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700' }}>{g.title}</h4>
                        <span className={`badge ${g.status === 'active' ? 'badge-green' : g.status === 'completed' ? 'badge-blue' : 'badge-amber'}`}>{g.status}</span>
                      </div>
                      {g.category && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{g.category}</span>}
                      {g.description && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>{g.description}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: '800', color: 'var(--accent)' }}>{g.progress_percentage}%</span>
                      <button className="btn-danger" onClick={() => deleteGoal(g.id)} style={{ padding: '6px 8px' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div className="progress-bar-track" style={{ marginBottom: '8px' }}>
                    <div className="progress-bar-fill" style={{ width: `${g.progress_percentage}%` }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[0, 25, 50, 75, 100].map(pct => (
                      <button key={pct} onClick={() => updateGoalProgress(g.id, pct)}
                        style={{
                          fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '6px',
                          background: g.progress_percentage === pct ? 'var(--accent-dim)' : 'rgba(255,255,255,0.04)',
                          color: g.progress_percentage === pct ? 'var(--accent)' : 'var(--text-muted)',
                          border: `1px solid ${g.progress_percentage === pct ? 'var(--border-active)' : 'var(--border)'}`,
                          cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                        }}
                      >{pct}%</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'progress' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button className="btn-primary" onClick={() => setShowProgressModal(true)}><Plus size={15} /> Log Progress</button>
          </div>
          {progress.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}><TrendingUp size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} /><p style={{ color: 'var(--text-muted)' }}>No progress logged yet.</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {progress.map(p => (
                <div key={p.id} className="card" style={{ padding: '18px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{format(new Date(p.recorded_at), 'MMM d, yyyy')}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>{p.metric_name}</div>
                  <div style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', color: 'var(--accent)' }}>
                    {p.value}{p.unit ? <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}> {p.unit}</span> : null}
                  </div>
                  {p.notes && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{p.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Session Modal */}
      {showSessionModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowSessionModal(false) }}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: '700' }}>Add Session</h2>
              <button onClick={() => setShowSessionModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Title</label><input className="input" placeholder="Session title" value={sessionForm.title} onChange={e => setSessionForm({ ...sessionForm, title: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Date & Time *</label><input className="input" type="datetime-local" value={sessionForm.session_date} onChange={e => setSessionForm({ ...sessionForm, session_date: e.target.value })} required /></div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Duration (min)</label><input className="input" type="number" value={sessionForm.duration_minutes} onChange={e => setSessionForm({ ...sessionForm, duration_minutes: e.target.value })} /></div>
              </div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Mood</label>
                <select className="input" value={sessionForm.mood} onChange={e => setSessionForm({ ...sessionForm, mood: e.target.value })}>
                  <option value="">Select mood...</option>
                  {['excellent', 'good', 'neutral', 'challenging', 'difficult'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Session Notes</label><textarea className="input" placeholder="What was discussed..." value={sessionForm.notes} onChange={e => setSessionForm({ ...sessionForm, notes: e.target.value })} /></div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Next Steps</label><textarea className="input" placeholder="Action items for client..." value={sessionForm.next_steps} onChange={e => setSessionForm({ ...sessionForm, next_steps: e.target.value })} style={{ minHeight: '70px' }} /></div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button className="btn-secondary" onClick={() => setShowSessionModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveSession} disabled={!sessionForm.session_date || savingSession}>{savingSession ? 'Saving...' : 'Add Session'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowGoalModal(false) }}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: '700' }}>Add Goal</h2>
              <button onClick={() => setShowGoalModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Goal Title *</label><input className="input" placeholder="e.g. Run a 5K" value={goalForm.title} onChange={e => setGoalForm({ ...goalForm, title: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Category</label><input className="input" placeholder="Health, Career..." value={goalForm.category} onChange={e => setGoalForm({ ...goalForm, category: e.target.value })} /></div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Date</label><input className="input" type="date" value={goalForm.target_date} onChange={e => setGoalForm({ ...goalForm, target_date: e.target.value })} /></div>
              </div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Description</label><textarea className="input" placeholder="Describe the goal..." value={goalForm.description} onChange={e => setGoalForm({ ...goalForm, description: e.target.value })} /></div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Initial Progress: {goalForm.progress_percentage}%</label>
                <input type="range" min="0" max="100" value={goalForm.progress_percentage} onChange={e => setGoalForm({ ...goalForm, progress_percentage: e.target.value })} style={{ width: '100%', accentColor: 'var(--accent)' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button className="btn-secondary" onClick={() => setShowGoalModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveGoal} disabled={!goalForm.title || savingGoal}>{savingGoal ? 'Saving...' : 'Add Goal'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowProgressModal(false) }}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: '700' }}>Log Progress</h2>
              <button onClick={() => setShowProgressModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Metric *</label><input className="input" placeholder="e.g. Weight, Revenue, Steps..." value={progressForm.metric_name} onChange={e => setProgressForm({ ...progressForm, metric_name: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Value *</label><input className="input" type="number" step="any" placeholder="75" value={progressForm.value} onChange={e => setProgressForm({ ...progressForm, value: e.target.value })} /></div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Unit</label><input className="input" placeholder="kg, $, %" value={progressForm.unit} onChange={e => setProgressForm({ ...progressForm, unit: e.target.value })} /></div>
              </div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Notes</label><textarea className="input" placeholder="Any observations..." value={progressForm.notes} onChange={e => setProgressForm({ ...progressForm, notes: e.target.value })} style={{ minHeight: '70px' }} /></div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button className="btn-secondary" onClick={() => setShowProgressModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveProgress} disabled={!progressForm.metric_name || !progressForm.value || savingProgress}>{savingProgress ? 'Saving...' : 'Log Entry'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
