// src/app/(dashboard)/dashboard/messages/page.tsx
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getConversations } from '@/lib/messages'
import { ConversationList } from './components/ConversationList'
import { EmptyConversation } from './components/EmptyConversation'

export default async function MessagesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/dashboard/messages')

  const conversations = await getConversations()

  return (
    <div className="h-[calc(100vh-8rem)] flex overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      {/* Left panel — conversation list */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
        <ConversationList conversations={conversations} currentUser={user} />
      </div>

      {/* Right panel — empty state on desktop */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950/20">
        <EmptyConversation />
      </div>
    </div>
  )
}
