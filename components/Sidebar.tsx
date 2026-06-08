'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Zap, LayoutDashboard, Users, Calendar, Target,
  TrendingUp, MessageSquare, LogOut, ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/clients',    icon: Users,            label: 'Clients' },
  { href: '/sessions',   icon: Calendar,         label: 'Sessions' },
  { href: '/goals',      icon: Target,           label: 'Goals' },
  { href: '/progress',   icon: TrendingUp,       label: 'Progress' },
  { href: '/messages',   icon: MessageSquare,    label: 'Messages' },
]

interface SidebarProps {
  userEmail?: string
  userName?: string
}

export default function Sidebar({ userEmail, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={18} color="#000" fill="#000" />
          </div>
          <span style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>CoachFlow</span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--text-muted)', padding: '8px 8px 4px', marginBottom: '4px' }}>
          MAIN MENU
        </div>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className={`sidebar-item ${isActive ? 'active' : ''}`}>
              <Icon size={17} />
              <span>{label}</span>
              {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
          <div className="avatar" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-active)', width: '36px', height: '36px', fontSize: '13px' }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName || 'Coach'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userEmail}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '4px', transition: 'color 0.2s' }}
            title="Sign out"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--rose)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
