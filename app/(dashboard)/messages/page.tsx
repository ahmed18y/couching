'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message, Client, Profile } from '@/lib/types'
import { Send, MessageSquare, Search } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'

interface ConvClient extends Client {
  lastMessage?: Message
  unreadCount?: number
}

function formatMsgTime(dt: string) {
  const d = new Date(dt)
  if (isToday(d)) return format(d, 'h:mm a')
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d')
}

export default function MessagesPage() {
  const [clients, setClients] = useState<ConvClient[]>([])
  const [selectedClient, setSelectedClient] = useState<ConvClient | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => { init() }, [])

  useEffect(() => {
    if (!selectedClient || !userId) return
    loadMessages(selectedClient.id)

    // Real-time subscription
    const channel = supabase
      .channel(`messages:${selectedClient.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `client_id=eq.${selectedClient.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
        scrollToBottom()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedClient?.id, userId])

  useEffect(() => { scrollToBottom() }, [messages])

  function scrollToBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function init() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)
    await loadClients(user.id)
    setLoading(false)
  }

  async function loadClients(uid: string) {
    const { data: cls } = await supabase.from('clients').select('*').eq('coach_id', uid).order('name')
    if (!cls) return

    // Get last message and unread count for each client
    const enriched = await Promise.all(cls.map(async (c) => {
      const [{ data: lastMsg }, { count: unread }] = await Promise.all([
        supabase.from('messages').select('*').eq('client_id', c.id).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('client_id', c.id).eq('is_read', false).neq('sender_id', uid),
      ])
      return { ...c, lastMessage: lastMsg || undefined, unreadCount: unread || 0 }
    }))

    setClients(enriched.sort((a, b) => {
      const at = a.lastMessage?.created_at || a.created_at
      const bt = b.lastMessage?.created_at || b.created_at
      return new Date(bt).getTime() - new Date(at).getTime()
    }))
  }

  async function loadMessages(clientId: string) {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles(*)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })
    setMessages(data || [])

    // Mark as read
    await supabase.from('messages').update({ is_read: true }).eq('client_id', clientId).neq('sender_id', userId)
    loadClients(userId)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMsg.trim() || !selectedClient || sending) return
    setSending(true)
    await supabase.from('messages').insert({
      client_id: selectedClient.id,
      sender_id: userId,
      content: newMsg.trim(),
      conversation_id: selectedClient.id,
    })
    setNewMsg('')
    setSending(false)
    loadClients(userId)
  }

  const filteredClients = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '28px 32px 0', flexShrink: 0 }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', marginBottom: '20px' }}>Messages</h1>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, margin: '0 32px 28px', gap: '16px' }}>
        {/* Left: Conversations */}
        <div className="card" style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input className="input" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '32px', fontSize: '13px', padding: '8px 10px 8px 32px' }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</div>
            ) : filteredClients.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No clients found</div>
            ) : (
              filteredClients.map(client => (
                <div
                  key={client.id}
                  onClick={() => { setSelectedClient(client); setMessages([]) }}
                  style={{
                    padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                    background: selectedClient?.id === client.id ? 'var(--accent-dim)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (selectedClient?.id !== client.id) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={e => { if (selectedClient?.id !== client.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div className="avatar" style={{ background: client.avatar_color + '22', color: client.avatar_color, width: '36px', height: '36px', fontSize: '14px', flexShrink: 0 }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: selectedClient?.id === client.id ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {client.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {(client.unreadCount ?? 0) > 0 && (
                            <span style={{ background: 'var(--rose)', color: '#fff', borderRadius: '999px', fontSize: '10px', fontWeight: '700', padding: '1px 6px' }}>
                              {client.unreadCount}
                            </span>
                          )}
                          {client.lastMessage && (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {formatMsgTime(client.lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      {client.lastMessage ? (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {client.lastMessage.sender_id === userId ? 'You: ' : ''}{client.lastMessage.content}
                        </p>
                      ) : (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No messages yet</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Chat */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedClient ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
              <p style={{ fontSize: '16px', marginBottom: '6px' }}>Select a client to start messaging</p>
              <p style={{ fontSize: '13px' }}>Real-time messaging powered by Supabase</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <div className="avatar" style={{ background: selectedClient.avatar_color + '22', color: selectedClient.avatar_color, width: '38px', height: '38px', fontSize: '15px' }}>
                  {selectedClient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700' }}>{selectedClient.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {selectedClient.coaching_focus || selectedClient.email || 'Client'}
                    <span style={{ marginLeft: '8px', color: 'var(--accent)' }}>● Online</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', fontSize: '14px' }}>
                    No messages yet. Send the first one!
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
                          <div className={`chat-bubble ${isMine ? 'sent' : 'received'}`}>
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
              <form onSubmit={handleSend} style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', flexShrink: 0 }}>
                <input
                  className="input"
                  placeholder={`Message ${selectedClient.name}...`}
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  style={{ flex: 1, borderRadius: '24px', padding: '10px 18px' }}
                />
                <button type="submit" className="btn-primary" disabled={!newMsg.trim() || sending} style={{ borderRadius: '24px', padding: '10px 18px', flexShrink: 0 }}>
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
