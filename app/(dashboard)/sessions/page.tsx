'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Session, Client } from '@/lib/types'
import { Plus, Calendar, Clock, Trash2, X, Search } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

const moodConfig: Record<string, { color: string; label: string }> = {
  excellent: { color: '#34d399', label: '🌟 Excellent' },
  good:      { color: '#818cf8', label: '👍 Good' },
  neutral:   { color: '#94a3b8', label: '😐 Neutral' },
  challenging: { color: '#fbbf24', label: '⚡ Challenging' },
  difficult:   { color: '#fb7185', label: '🔥 Difficult' },
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<(Session & { client: Client })[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filtered, setFiltered] = useState<(Session & { client: Client })[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({
    client_id: '', title: '', session_date: '', duration_minutes: '60',
    notes: '', mood: '', next_steps: '',
  })
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    if (!search) { setFiltered(sessions); return }
    setFiltered(sessions.filter(s =>
      s.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.notes?.toLowerCase().includes(search.toLowerCase())
    ))
  }, [sessions, search])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from('sessions').select('*, client:clients(*)').eq('coach_id', user.id).order('session_date', { ascending: false }),
      supabase.from('clients').select('*').eq('coach_id', user.id).eq('status', 'active'),
    ])
    setSessions((s || []) as unknown as (Session & { client: Client })[])
    setClients(c || [])
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('sessions').insert({
      client_id: form.client_id, coach_id: userId,
      title: form.title || null, session_date: form.session_date,
      duration_minutes: parseInt(form.duration_minutes),
      notes: form.notes || null, mood: form.mood || null,
      next_steps: form.next_steps || null,
    })
    setShowModal(false)
    setForm({ client_id: '', title: '', session_date: '', duration_minutes: '60', notes: '', mood: '', next_steps: '' })
    loadData()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this session?')) return
    await supabase.from('sessions').delete().eq('id', id)
    loadData()
  }

  return (
    <div className="page-content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>Sessions</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{sessions.length} total sessions logged</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Session</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Search by client, title, or notes..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px', maxWidth: '400px' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Loading sessions...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <Calendar size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '8px' }}>No sessions yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Start by adding a coaching session.</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add First Session</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((session) => {
            const c = Array.isArray(session.client) ? session.client[0] : session.client as Client | null
            return (
              <div key={session.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {/* Date block */}
                  <div style={{ minWidth: '60px', textAlign: 'center', padding: '8px', borderRadius: '10px', background: 'var(--accent-dim)', flexShrink: 0 }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {format(new Date(session.session_date), 'MMM')}
                    </div>
                    <div style={{ fontFamily: 'Syne', fontSize: '24px', fontWeight: '800', color: 'var(--accent)', lineHeight: 1 }}>
                      {format(new Date(session.session_date), 'd')}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {format(new Date(session.session_date), 'yyyy')}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '10px' }}>
                      <div>
                        <h3 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>
                          {session.title || 'Coaching Session'}
                        </h3>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          {c && (
                            <Link href={`/clients/${c.id}`} style={{ textDecoration: 'none' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--accent)', fontWeight: '600' }}>
                                <div className="avatar" style={{ width: '18px', height: '18px', fontSize: '9px', background: c.avatar_color + '22', color: c.avatar_color }}>{c.name.charAt(0)}</div>
                                {c.name}
                              </span>
                            </Link>
                          )}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <Clock size={11} /> {format(new Date(session.session_date), 'h:mm a')} · {session.duration_minutes} min
                          </span>
                          {session.mood && (
                            <span style={{ fontSize: '12px', color: moodConfig[session.mood]?.color }}>
                              {moodConfig[session.mood]?.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="btn-danger" onClick={() => handleDelete(session.id)} style={{ padding: '6px 8px', flexShrink: 0 }}><Trash2 size={13} /></button>
                    </div>

                    {session.notes && (
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.5' }}>{session.notes}</p>
                    )}

                    {session.next_steps && (
                      <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--border-active)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: 'var(--accent)' }}>
                        <strong>Next Steps:</strong> {session.next_steps}
                      </div>
                    )}
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
          <div className="modal" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h2 style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: '700' }}>New Session</h2>
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Session Title</label>
                <input className="input" placeholder="e.g. Goal Setting Session" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Date & Time *</label>
                  <input className="input" type="datetime-local" value={form.session_date} onChange={e => setForm({ ...form, session_date: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Duration (min)</label>
                  <input className="input" type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Session Mood</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(moodConfig).map(([key, { color, label }]) => (
                    <button key={key} type="button" onClick={() => setForm({ ...form, mood: key })}
                      style={{
                        padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '600',
                        background: form.mood === key ? color + '22' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${form.mood === key ? color : 'var(--border)'}`,
                        color: form.mood === key ? color : 'var(--text-secondary)',
                        cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                      }}
                    >{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Session Notes</label>
                <textarea className="input" placeholder="What was discussed, breakthroughs, observations..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ minHeight: '90px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Next Steps</label>
                <textarea className="input" placeholder="Action items for the client..." value={form.next_steps} onChange={e => setForm({ ...form, next_steps: e.target.value })} style={{ minHeight: '70px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={!form.client_id || !form.session_date || saving}>
                  {saving ? 'Saving...' : 'Add Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
