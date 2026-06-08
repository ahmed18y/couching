'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Goal, Client } from '@/lib/types'
import { Plus, Target, X, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

const categoryColors: Record<string, string> = {
  'Health': '#34d399', 'Career': '#818cf8', 'Finance': '#fbbf24',
  'Relationships': '#fb7185', 'Mindset': '#22d3ee', 'Other': '#94a3b8',
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<(Goal & { client: Client })[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filtered, setFiltered] = useState<(Goal & { client: Client })[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({
    client_id: '', title: '', description: '', category: '',
    target_date: '', progress_percentage: '0',
  })
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    let r = goals
    if (search) r = r.filter(g => g.title.toLowerCase().includes(search.toLowerCase()) || g.client?.name?.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'all') r = r.filter(g => g.status === statusFilter)
    if (clientFilter !== 'all') r = r.filter(g => g.client_id === clientFilter)
    setFiltered(r)
  }, [goals, search, statusFilter, clientFilter])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const [{ data: g }, { data: c }] = await Promise.all([
      supabase.from('goals').select('*, client:clients(*)').eq('coach_id', user.id).order('created_at', { ascending: false }),
      supabase.from('clients').select('*').eq('coach_id', user.id),
    ])
    setGoals((g || []) as unknown as (Goal & { client: Client })[])
    setClients(c || [])
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('goals').insert({
      client_id: form.client_id, coach_id: userId,
      title: form.title, description: form.description || null,
      category: form.category || null, target_date: form.target_date || null,
      progress_percentage: parseInt(form.progress_percentage),
    })
    setShowModal(false)
    setForm({ client_id: '', title: '', description: '', category: '', target_date: '', progress_percentage: '0' })
    loadData()
    setSaving(false)
  }

  async function updateProgress(id: string, pct: number) {
    await supabase.from('goals').update({ progress_percentage: pct }).eq('id', id)
    loadData()
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('goals').update({ status }).eq('id', id)
    loadData()
  }

  const statusBadge: Record<string, string> = {
    active: 'badge-green', completed: 'badge-blue', paused: 'badge-amber', cancelled: 'badge-rose',
  }

  const summary = {
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    paused: goals.filter(g => g.status === 'paused').length,
    avgProgress: goals.length ? Math.round(goals.reduce((s, g) => s + g.progress_percentage, 0) / goals.length) : 0,
  }

  return (
    <div className="page-content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>Goals</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{goals.length} total · {summary.active} active · {summary.avgProgress}% avg progress</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Goal</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Active', value: summary.active, color: 'var(--accent)' },
          { label: 'Completed', value: summary.completed, color: 'var(--indigo)' },
          { label: 'Paused', value: summary.paused, color: 'var(--amber)' },
          { label: 'Avg Progress', value: summary.avgProgress + '%', color: 'var(--rose)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Search goals or clients..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>
        <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: '150px' }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select className="input" value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ maxWidth: '180px' }}>
          <option value="all">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Goals List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Loading goals...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <Target size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '8px' }}>No goals found</p>
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: '12px' }}><Plus size={16} /> Add Goal</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((goal) => {
            const c = Array.isArray(goal.client) ? goal.client[0] : goal.client as Client | null
            const catColor = categoryColors[goal.category || ''] || 'var(--text-muted)'
            return (
              <div key={goal.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {/* Progress circle visual */}
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                    background: `conic-gradient(var(--accent) ${goal.progress_percentage * 3.6}deg, rgba(255,255,255,0.07) 0deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                  }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'Syne', fontSize: '11px', fontWeight: '800', color: 'var(--accent)' }}>{goal.progress_percentage}%</span>
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '10px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700' }}>{goal.title}</h3>
                          <span className={`badge ${statusBadge[goal.status]}`}>{goal.status}</span>
                          {goal.category && (
                            <span style={{ fontSize: '11px', fontWeight: '700', color: catColor, background: catColor + '18', padding: '2px 8px', borderRadius: '999px' }}>{goal.category}</span>
                          )}
                        </div>
                        {c && (
                          <Link href={`/clients/${c.id}`} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--accent)', fontWeight: '600' }}>
                            <div className="avatar" style={{ width: '16px', height: '16px', fontSize: '8px', background: c.avatar_color + '22', color: c.avatar_color }}>{c.name.charAt(0)}</div>
                            {c.name}
                          </Link>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <select
                          className="input"
                          value={goal.status}
                          onChange={e => updateStatus(goal.id, e.target.value)}
                          style={{ padding: '5px 10px', fontSize: '12px', maxWidth: '130px' }}
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="paused">Paused</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {goal.description && (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{goal.description}</p>
                    )}

                    {goal.target_date && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        🎯 Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                      </p>
                    )}

                    {/* Progress bar + quick update */}
                    <div>
                      <div className="progress-bar-track" style={{ marginBottom: '8px' }}>
                        <div className="progress-bar-fill" style={{ width: `${goal.progress_percentage}%` }} />
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[0, 10, 25, 50, 75, 90, 100].map(pct => (
                          <button key={pct} onClick={() => updateProgress(goal.id, pct)}
                            style={{
                              fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '6px',
                              background: goal.progress_percentage === pct ? 'var(--accent-dim)' : 'rgba(255,255,255,0.04)',
                              color: goal.progress_percentage === pct ? 'var(--accent)' : 'var(--text-muted)',
                              border: `1px solid ${goal.progress_percentage === pct ? 'var(--border-active)' : 'var(--border)'}`,
                              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                            }}
                          >{pct}%</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h2 style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: '700' }}>New Goal</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Client *</label>
                <select className="input" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} required>
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Goal Title *</label>
                <input className="input" placeholder="e.g. Launch my business" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Category</label>
                  <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">None</option>
                    {Object.keys(categoryColors).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Date</label>
                  <input className="input" type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Description</label>
                <textarea className="input" placeholder="What does achieving this goal look like?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ minHeight: '80px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Initial Progress: {form.progress_percentage}%</label>
                <input type="range" min="0" max="100" value={form.progress_percentage} onChange={e => setForm({ ...form, progress_percentage: e.target.value })} style={{ width: '100%', accentColor: 'var(--accent)' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={!form.client_id || !form.title || saving}>
                  {saving ? 'Saving...' : 'Add Goal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
