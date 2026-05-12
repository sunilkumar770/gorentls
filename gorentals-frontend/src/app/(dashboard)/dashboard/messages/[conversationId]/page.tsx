// src/app/(dashboard)/dashboard/messages/[conversationId]/page.tsx
import { getCurrentUser } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getConversations, getMessages, getConversation } from '@/lib/messages'
import { ConversationList } from '../components/ConversationList'
import { ChatPanel } from '../components/ChatPanel'
import { cookies } from 'next/headers'

export default async function ConversationPage({
  params,
}: {
  params: { conversationId: string }
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/dashboard/messages')

  const [conversations, conversation, messages] = await Promise.all([
    getConversations(),
    getConversation(params.conversationId),
    getMessages(params.conversationId),
  ])

  if (!conversation) notFound()

  // Get token for WebSocket connection
  const cookieStore = await cookies()
  const token = cookieStore.get('gorentals_token')?.value ?? ''

  return (
    <div className="h-[calc(100vh-8rem)] flex overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      {/* Left panel — hidden on mobile when in conversation */}
      <div className="hidden md:flex w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0">
        <ConversationList
          conversations={conversations}
          currentUser={user}
          activeId={params.conversationId}
        />
      </div>

      {/* Right panel — full screen on mobile */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatPanel
          conversation={conversation}
          initialMessages={messages}
          currentUser={user}
          token={token}
        />
      </div>
    </div>
  )
}
