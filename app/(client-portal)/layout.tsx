import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClientSidebar from '@/components/ClientSidebar'

export default async function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'coach') redirect('/dashboard')

  return (
    <div>
      <ClientSidebar userEmail={user.email} userName={profile?.full_name} />
      <main className="main-layout">
        {children}
      </main>
    </div>
  )
}
