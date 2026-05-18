import type { ChatMessage } from '@/lib/messages'
import { cn } from '@/lib/utils'

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
    <div className={cn('flex gap-2 items-end mb-1', isOwn ? 'justify-end' : 'justify-start')}>
      {/* Other user avatar */}
      {!isOwn && (
        <div className={cn(
          'w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs shrink-0',
          !showAvatar && 'invisible'
        )}>
          {senderInitial}
        </div>
      )}

      {/* Bubble */}
      <div className={cn(
        'max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
        isOwn
          ? 'bg-brand-600 text-text-inverse rounded-br-sm'
          : 'bg-surface-raised text-text-primary rounded-bl-sm border border-border-subtle'
      )}>
        <p>{message.content}</p>
        {/* Timestamp + read indicator */}
        <div className={cn(
          'flex items-center justify-end gap-1 mt-1',
          isOwn ? 'text-white/60' : 'text-text-muted'
        )}>
          <span className="text-[10px] font-medium">{time}</span>
          {isOwn && !isOptimistic && <span className="text-[10px]">✓✓</span>}
          {isOwn && isOptimistic && <span className="text-[10px] opacity-50">·</span>}
        </div>
      </div>
    </div>
  )
}
