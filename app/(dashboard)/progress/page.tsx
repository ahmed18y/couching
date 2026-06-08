'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProgressEntry, Client } from '@/lib/types'
import { TrendingUp, Plus, X, Search } from 'lucide-react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

export default function ProgressPage() {
  const [entries, setEntries] = useState<(ProgressEntry & { client: Client })[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [clientFilter, setClientFilter] = useState('all')
  const [metricFilter, setMetricFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({ client_id: '', metric_name: '', value: '', unit: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const [{ data: e }, { data: c }] = await Promise.all([
      supabase.from('progress_entries').select('*, client:clients(*)').eq('coach_id', user.id).order('recorded_at', { ascending: false }),
      supabase.from('clients').select('*').eq('coach_id', user.id),
    ])
    setEntries((e || []) as unknown as (ProgressEntry & { client: Client })[])
    setClients(c || [])
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('progress_entries').insert({
      client_id: form.client_id, coach_id: userId,
      metric_name: form.metric_name, value: parseFloat(form.value),
      unit: form.unit || null, notes: form.notes || null,
    })
    setShowModal(false)
    setForm({ client_id: '', metric_name: '', value: '', unit: '', notes: '' })
    loadData()
    setSaving(false)
  }

  // Get unique metrics
  const allMetrics = [...new Set(entries.map(e => e.metric_name))]

  // Filter entries
  const filtered = entries.filter(e => {
    const c = Array.isArray(e.client) ? e.client[0] : e.client as Client | null
    const matchClient = clientFilter === 'all' || e.client_id === clientFilter
    const matchMetric = metricFilter === 'all' || e.metric_name === metricFilter
    const matchSearch = !search || e.metric_name.toLowerCase().includes(search.toLowerCase()) || c?.name?.toLowerCase().includes(search.toLowerCase())
    return matchClient && matchMetric && matchSearch
  })

  // Build chart data for selected metric + client
  const chartData = (() => {
    if (!selectedMetric) return []
    return entries
      .filter(e => e.metric_name === selectedMetric && (selectedClient ? e.client_id === selectedClient : true))
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map(e => ({ date: format(new Date(e.recorded_at), 'MMM d'), value: e.value }))
  })()

  return (
    <div className="page-content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>Progress Tracking</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{entries.length} data points · {allMetrics.length} metrics tracked</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Log Progress</button>
      </div>

      {/* Chart section */}
      {allMetrics.length > 0 && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Trend Chart</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <select className="input" value={selectedMetric || ''} onChange={e => setSelectedMetric(e.target.value || null)} style={{ maxWidth: '200px' }}>
              <option value="">Select metric...</option>
              {allMetrics.map(m => <option key={m}>{m}</option>)}
            </select>
            <select className="input" value={selectedClient || ''} onChange={e => setSelectedClient(e.target.value || null)} style={{ maxWidth: '200px' }}>
              <option value="">All clients</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {selectedMetric && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis stroke="#475569" tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ background: '#1a1d35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f0f4f8', fontSize: '13px' }}
                />
                <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2.5} dot={{ fill: '#34d399', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              {selectedMetric ? 'Not enough data to display chart.' : 'Select a metric to view the trend.'}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Search entries..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>
        <select className="input" value={metricFilter} onChange={e => setMetricFilter(e.target.value)} style={{ maxWidth: '180px' }}>
          <option value="all">All Metrics</option>
          {allMetrics.map(m => <option key={m}>{m}</option>)}
        </select>
        <select className="input" value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ maxWidth: '180px' }}>
          <option value="all">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Entries grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <TrendingUp size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '8px' }}>No progress entries yet</p>
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: '12px' }}><Plus size={16} /> Log First Entry</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {filtered.map((entry) => {
            const c = Array.isArray(entry.client) ? entry.client[0] : entry.client as Client | null
            return (
              <div key={entry.id} className="card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{format(new Date(entry.recorded_at), 'EEE, MMM d, yyyy')}</div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'capitalize' }}>{entry.metric_name}</div>
                <div style={{ fontFamily: 'Syne', fontSize: '32px', fontWeight: '800', color: 'var(--accent)', marginBottom: '6px' }}>
                  {entry.value}
                  {entry.unit && <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif', fontWeight: '400', marginLeft: '4px' }}>{entry.unit}</span>}
                </div>
                {c && (
                  <Link href={`/clients/${c.id}`} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--accent)', fontWeight: '600' }}>
                    <div className="avatar" style={{ width: '16px', height: '16px', fontSize: '8px', background: c.avatar_color + '22', color: c.avatar_color }}>{c.name.charAt(0)}</div>
                    {c.name}
                  </Link>
                )}
                {entry.notes && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>{entry.notes}</p>}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal" style={{ maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h2 style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: '700' }}>Log Progress</h2>
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Metric *</label>
                <input className="input" placeholder="e.g. Weight, Revenue, Steps, Sleep Hours..." value={form.metric_name} onChange={e => setForm({ ...form, metric_name: e.target.value })} list="metrics-list" />
                <datalist id="metrics-list">
                  {allMetrics.map(m => <option key={m} value={m} />)}
                </datalist>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Value *</label>
                  <input className="input" type="number" step="any" placeholder="0" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Unit</label>
                  <input className="input" placeholder="kg, $, %" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Notes</label>
                <textarea className="input" placeholder="Any observations or context..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ minHeight: '70px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={!form.client_id || !form.metric_name || !form.value || saving}>
                  {saving ? 'Saving...' : 'Log Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
