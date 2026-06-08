export type UserRole = 'coach' | 'client'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  phone: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  coach_id: string
  user_id: string | null
  name: string
  email: string | null
  phone: string | null
  age: number | null
  coaching_focus: string | null
  start_date: string | null
  status: 'active' | 'inactive' | 'completed'
  bio: string | null
  avatar_color: string
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  client_id: string
  coach_id: string
  session_date: string
  duration_minutes: number
  title: string | null
  notes: string | null
  mood: 'excellent' | 'good' | 'neutral' | 'challenging' | 'difficult' | null
  next_steps: string | null
  created_at: string
  client?: Client
}

export interface Goal {
  id: string
  client_id: string
  coach_id: string
  title: string
  description: string | null
  category: string | null
  target_date: string | null
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  progress_percentage: number
  created_at: string
  updated_at: string
  client?: Client
}

export interface ProgressEntry {
  id: string
  client_id: string
  goal_id: string | null
  coach_id: string
  metric_name: string
  value: number
  unit: string | null
  notes: string | null
  recorded_at: string
  client?: Client
  goal?: Goal
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  client_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: Profile
}

export interface Conversation {
  client: Client
  lastMessage: Message | null
  unreadCount: number
}
