import type { ChatMessage } from '@/lib/messages'

interface Props {
  message: ChatMessage
  isOwn: boolean
  isOptimistic: boolean
  showAvatar: boolean
  senderInitial: string
}

export function MessageBubble({ message, isOwn, isOptimistic, showAvatar, senderInitial }: Props) {
  const time = new Date(message.sentAt).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })

  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} mb-1`}>
      <div className="w-7 h-7 shrink-0">
        {!isOwn && showAvatar && (
          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-[10px]">
            {senderInitial}
          </div>
        )}
      </div>

      <div className={`max-w-[72%] sm:max-w-[60%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isOwn
            ? 'bg-indigo-600 text-white rounded-br-sm shadow-sm'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm border border-slate-200/50 dark:border-slate-700/50'
        } ${isOptimistic ? 'opacity-70' : 'opacity-100'}`}>
          {message.content}
        </div>
        <span className={`text-[10px] font-medium text-slate-400 dark:text-slate-500 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {time}
          {isOwn && !isOptimistic && (
            <span className="ml-1 text-indigo-400">✓</span>
          )}
          {isOwn && isOptimistic && (
            <span className="ml-1 text-slate-300 animate-pulse">·</span>
          )}
        </span>
      </div>
    </div>
  )
}
