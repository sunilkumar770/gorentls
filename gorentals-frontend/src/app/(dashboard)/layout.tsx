// src/app/(dashboard)/layout.tsx
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardNav } from './components/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Double-guard: middleware handles edge, this handles SSR
  if (!user) redirect('/login?redirect=/dashboard')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <DashboardNav user={user} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
