'use client'
import Link from 'next/link'

export function MessagePreview({ conversation }: { conversation: any }) {
  const lastMsg = conversation.lastMessage
  const isUnread = conversation.unreadCount > 0
  
  return (
    <Link
      href={`/dashboard/messages/${conversation.id}`}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
        isUnread 
          ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800' 
          : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700'
      } hover:shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700`}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0 overflow-hidden">
        {conversation.otherUser?.avatarUrl ? (
          <img src={conversation.otherUser.avatarUrl} alt={conversation.otherUser.fullName} className="w-full h-full object-cover" />
        ) : (
          <span>👤</span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
            {conversation.otherUser?.fullName ?? 'User'}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
            {lastMsg?.timestamp ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <p className={`text-xs truncate mt-0.5 ${isUnread ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
          {lastMsg?.content ?? 'No messages yet'}
        </p>
      </div>

      {isUnread && (
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
      )}
    </Link>
  )
}

