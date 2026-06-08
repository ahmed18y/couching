import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CoachFlow — Online Coaching Platform',
  description: 'Manage clients, track progress, and grow your coaching practice.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
