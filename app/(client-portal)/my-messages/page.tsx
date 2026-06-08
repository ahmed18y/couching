'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/lib/types'
import { Send, MessageSquare } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'

function formatMsgTime(dt: string) {
  const d = new Date(dt)
  if (isToday(d)) return format(d, 'h:mm a')
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d')
}

export default function MyMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState('')
  const [clientId, setClientId] = useState('')
  const [coachName, setCoachName] = useState('Your Coach')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => { init() }, [])

  useEffect(() => {
    if (!clientId) return
    const channel = supabase
      .channel(`client-messages:${clientId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `client_id=eq.${clientId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [clientId])

  async function init() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: clientRecord } = await supabase.from('clients').select('*, coach:profiles(full_name)').eq('user_id', user.id).single()
    if (!clientRecord) { setLoading(false); return }
    setClientId(clientRecord.id)

    const coach = Array.isArray(clientRecord.coach) ? clientRecord.coach[0] : clientRecord.coach as { full_name: string } | null
    if (coach?.full_name) setCoachName(coach.full_name)

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('client_id', clientRecord.id)
      .order('created_at', { ascending: true })
    setMessages(msgs || [])

    // Mark read
    await supabase.from('messages').update({ is_read: true }).eq('client_id', clientRecord.id).neq('sender_id', user.id)
    setLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView(), 100)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMsg.trim() || !clientId || sending) return
    setSending(true)
    await supabase.from('messages').insert({
      client_id: clientId, sender_id: userId,
      content: newMsg.trim(), conversation_id: clientId,
    })
    setNewMsg('')
    setSending(false)
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '28px 32px 0', flexShrink: 0 }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', marginBottom: '20px' }}>Messages</h1>
      </div>

      <div style={{ flex: 1, margin: '0 32px 28px', minHeight: 0 }} className="card">
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="avatar" style={{ background: 'var(--indigo-dim)', color: 'var(--indigo)', border: '1px solid rgba(129,140,248,0.3)', width: '38px', height: '38px' }}>
            {coachName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700' }}>{coachName}</div>
            <div style={{ fontSize: '12px', color: 'var(--accent)' }}>● Your Coach</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', height: 'calc(100% - 130px)' }}>
          {loading ? (
            <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: '14px' }}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center' }}>
              <MessageSquare size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No messages yet. Say hi to your coach!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMine = msg.sender_id === userId
              const showTime = i === 0 || new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 5 * 60 * 1000
              return (
                <div key={msg.id}>
                  {showTime && (
                    <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', margin: '8px 0' }}>
                      {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    <div className={`chat-bubble ${isMine ? 'sent' : 'received'}`}
                      style={!isMine ? { background: 'var(--indigo-dim)', borderColor: 'rgba(129,140,248,0.2)', color: 'var(--text-primary)' } : {}}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {clientId && (
          <form onSubmit={handleSend} style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
            <input
              className="input"
              placeholder="Message your coach..."
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              style={{ flex: 1, borderRadius: '24px', padding: '10px 18px' }}
            />
            <button type="submit" className="btn-primary" disabled={!newMsg.trim() || sending}
              style={{ borderRadius: '24px', padding: '10px 18px', background: 'var(--indigo)' }}>
              <Send size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
