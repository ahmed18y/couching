'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Client } from '@/lib/types'
import Link from 'next/link'
import { Plus, Search, Users, Mail, Phone, Edit2, Trash2, X, ChevronRight } from 'lucide-react'

const AVATAR_COLORS = ['#34d399', '#818cf8', '#fbbf24', '#fb7185', '#22d3ee', '#a78bfa', '#f97316']

const focusOptions = [
  'Life Coaching', 'Career Coaching', 'Business Coaching', 'Health & Wellness',
  'Executive Coaching', 'Relationship Coaching', 'Mindset Coaching', 'Other'
]

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filtered, setFiltered] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', age: '', coaching_focus: '', status: 'active', bio: '',
  })
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    let result = clients
    if (search) result = result.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'all') result = result.filter(c => c.status === statusFilter)
    setFiltered(result)
  }, [clients, search, statusFilter])

  async function loadClients() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase.from('clients').select('*').eq('coach_id', user.id).order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  function openAddModal() {
    setEditingClient(null)
    setForm({ name: '', email: '', phone: '', age: '', coaching_focus: '', status: 'active', bio: '' })
    setShowModal(true)
  }

  function openEditModal(client: Client) {
    setEditingClient(client)
    setForm({
      name: client.name, email: client.email || '', phone: client.phone || '',
      age: client.age?.toString() || '', coaching_focus: client.coaching_focus || '',
      status: client.status, bio: client.bio || '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    const colorIdx = Math.floor(Math.random() * AVATAR_COLORS.length)
    const payload = {
      name: form.name, email: form.email || null, phone: form.phone || null,
      age: form.age ? parseInt(form.age) : null, coaching_focus: form.coaching_focus || null,
      status: form.status as 'active' | 'inactive' | 'completed', bio: form.bio || null,
    }
    if (editingClient) {
      await supabase.from('clients').update(payload).eq('id', editingClient.id)
    } else {
      await supabase.from('clients').insert({ ...payload, coach_id: userId, avatar_color: AVATAR_COLORS[colorIdx] })
    }
    setShowModal(false)
    loadClients()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this client? This will also remove their sessions, goals, and progress.')) return
    await supabase.from('clients').delete().eq('id', id)
    loadClients()
  }

  const statusBadge: Record<string, string> = { active: 'badge-green', inactive: 'badge-muted', completed: 'badge-blue' }

  return (
    <div className="page-content fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>Clients</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{clients.length} total · {clients.filter(c => c.status === 'active').length} active</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'active', 'inactive', 'completed'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: `1px solid ${statusFilter === s ? 'var(--border-active)' : 'var(--border)'}`,
                background: statusFilter === s ? 'var(--accent-dim)' : 'rgba(255,255,255,0.03)',
                color: statusFilter === s ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize', fontFamily: 'DM Sans, sans-serif',
              }}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Client Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Loading clients...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <Users size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '8px' }}>
            {search || statusFilter !== 'all' ? 'No clients match your filters' : 'No clients yet'}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Add your first client to get started.</p>
          <button className="btn-primary" onClick={openAddModal}><Plus size={16} /> Add Client</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filtered.map((client) => (
            <div key={client.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <div className="avatar" style={{ background: client.avatar_color + '22', color: client.avatar_color, width: '46px', height: '46px', fontSize: '18px' }}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</h3>
                    <span className={`badge ${statusBadge[client.status]}`}>{client.status}</span>
                  </div>
                  {client.coaching_focus && (
                    <p style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '600' }}>{client.coaching_focus}</p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {client.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <Mail size={13} color="var(--text-muted)" /> {client.email}
                  </div>
                )}
                {client.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <Phone size={13} color="var(--text-muted)" /> {client.phone}
                  </div>
                )}
                {client.age && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Age: {client.age}</div>
                )}
              </div>

              {client.bio && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {client.bio}
                </p>
              )}

              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                <Link href={`/clients/${client.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                  <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '13px', padding: '8px 12px' }}>
                    View Profile <ChevronRight size={14} />
                  </button>
                </Link>
                <button className="btn-secondary" onClick={() => openEditModal(client)} style={{ padding: '8px 10px' }}>
                  <Edit2 size={14} />
                </button>
                <button className="btn-danger" onClick={() => handleDelete(client.id)} style={{ padding: '8px 10px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: '700' }}>
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Full Name *</label>
                  <input className="input" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Age</label>
                  <input className="input" type="number" placeholder="32" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Email</label>
                  <input className="input" type="email" placeholder="client@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Phone</label>
                  <input className="input" placeholder="+1 234 567 8900" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Coaching Focus</label>
                  <select className="input" value={form.coaching_focus} onChange={(e) => setForm({ ...form, coaching_focus: e.target.value })}>
                    <option value="">Select focus...</option>
                    {focusOptions.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Status</label>
                  <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Bio / Notes</label>
                <textarea className="input" placeholder="Brief background about the client..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} style={{ minHeight: '80px' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={!form.name || saving}>
                  {saving ? 'Saving...' : editingClient ? 'Save Changes' : 'Add Client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
