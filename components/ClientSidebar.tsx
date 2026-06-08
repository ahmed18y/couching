'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap, LayoutDashboard, Target, TrendingUp, MessageSquare, LogOut, ChevronRight } from 'lucide-react'

const navItems = [
  { href: '/my-dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
  { href: '/my-goals',     icon: Target,          label: 'My Goals'     },
  { href: '/my-progress',  icon: TrendingUp,      label: 'My Progress'  },
  { href: '/my-messages',  icon: MessageSquare,   label: 'Messages'     },
]

interface ClientSidebarProps {
  userEmail?: string
  userName?: string
}

export default function ClientSidebar({ userEmail, userName }: ClientSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'

  return (
    <aside className="sidebar">
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/my-dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={18} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>CoachFlow</span>
        </Link>
        <div style={{ marginTop: '10px', fontSize: '11px', fontWeight: '700', color: 'var(--indigo)', letterSpacing: '0.08em' }}>CLIENT PORTAL</div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link key={href} href={href} className={`sidebar-item ${isActive ? 'active' : ''}`}
              style={isActive ? { background: 'var(--indigo-dim)', color: 'var(--indigo)', borderColor: 'rgba(129,140,248,0.3)' } : {}}>
              <Icon size={17} />
              <span>{label}</span>
              {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
          <div className="avatar" style={{ background: 'var(--indigo-dim)', color: 'var(--indigo)', border: '1px solid rgba(129,140,248,0.3)', width: '36px', height: '36px', fontSize: '13px' }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName || 'Client'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</div>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '4px' }} title="Sign out"
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--rose)') }
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
