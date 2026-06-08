import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

interface ProgressEntry {
  id: string
  metric_name: string
  value: number
  unit: string | null
  notes: string | null
  recorded_at: string
}

export default async function MyProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clientRecord } = await supabase.from('clients').select('*').eq('user_id', user.id).single()
  if (!clientRecord) redirect('/my-dashboard')

  const { data: entries } = await supabase
    .from('progress_entries')
    .select('id, metric_name, value, unit, notes, recorded_at')
    .eq('client_id', clientRecord.id)
    .order('recorded_at', { ascending: false })

  const safeEntries: ProgressEntry[] = entries || []

  const byMetric: Record<string, ProgressEntry[]> = {}
  for (const e of safeEntries) {
    if (!byMetric[e.metric_name]) byMetric[e.metric_name] = []
    byMetric[e.metric_name].push(e)
  }

  return (
    <div className="page-content fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>My Progress</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {safeEntries.length} data points · {Object.keys(byMetric).length} metrics tracked
        </p>
      </div>

      {safeEntries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <TrendingUp size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>No progress data yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>Your coach will log your progress entries.</p>
        </div>
      ) : (
        Object.entries(byMetric).map(([metric, list]) => {
          const latest = list[0]
          const previous = list[1]
          const trendRaw = previous
            ? (((latest.value - previous.value) / previous.value) * 100).toFixed(1)
            : null
          const isUp = trendRaw !== null && parseFloat(trendRaw) > 0

          return (
            <div key={metric} className="card" style={{ padding: '22px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontFamily: 'Syne', fontSize: '16px', fontWeight: '700', marginBottom: '4px', textTransform: 'capitalize' }}>{metric}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontFamily: 'Syne', fontSize: '36px', fontWeight: '800', color: 'var(--indigo)' }}>{latest.value}</span>
                    {latest.unit && <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>{latest.unit}</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Latest: {format(new Date(latest.recorded_at), 'MMM d, yyyy')}</p>
                </div>
                {trendRaw !== null && (
                  <div style={{
                    padding: '8px 14px', borderRadius: '8px',
                    background: isUp ? 'var(--accent-dim)' : 'var(--rose-dim)',
                    color: isUp ? 'var(--accent)' : 'var(--rose)',
                    fontSize: '14px', fontWeight: '700',
                  }}>
                    {isUp ? '↑' : '↓'} {Math.abs(parseFloat(trendRaw))}%
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {list.slice(0, 8).map((e, i) => (
                  <div key={e.id} style={{
                    padding: '10px 14px', borderRadius: '8px', textAlign: 'center',
                    background: i === 0 ? 'var(--indigo-dim)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${i === 0 ? 'rgba(129,140,248,0.3)' : 'var(--border)'}`,
                    minWidth: '80px',
                  }}>
                    <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: '800', color: i === 0 ? 'var(--indigo)' : 'var(--text-primary)' }}>
                      {e.value}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {format(new Date(e.recorded_at), 'MMM d')}
                    </div>
                  </div>
                ))}
              </div>

              {list[0].notes && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  📝 {list[0].notes}
                </p>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
