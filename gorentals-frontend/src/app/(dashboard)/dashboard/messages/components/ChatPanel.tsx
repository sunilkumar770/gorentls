'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useWebSocketChat } from '@/hooks/useWebSocketChat'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { BookingContextCard } from './BookingContextCard'
import type { ChatMessage, Conversation } from '@/lib/messages'
import type { AuthUser } from '@/context/AuthContext'
import Link from 'next/link'

interface Props {
  conversation: Conversation
  initialMessages: ChatMessage[]
  currentUser: AuthUser
  token: string
}

export function ChatPanel({ conversation, initialMessages, currentUser, token }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [isTyping, setIsTyping] = useState(false)
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleIncomingMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => {
      // Dedup: if we already have this message (optimistic or server echo), skip
      if (prev.some(m => m.id === msg.id)) return prev
      // If it's a server confirmation of an optimistic message, we should replace the optimistic one
      // But for simplicity, we'll just skip duplicates
      return [...prev, msg]
    })
    setIsTyping(false)
  }, [])

  const handleTyping = useCallback((typing: boolean) => {
    setIsTyping(typing)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    if (typing) {
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000)
    }
  }, [])

  const { sendMessage, sendTyping, status } = useWebSocketChat({
    conversationId: conversation.id,
    userId: currentUser.id,
    token,
    onMessage: handleIncomingMessage,
    onTyping: handleTyping,
  })

  const handleSend = useCallback((content: string) => {
    if (!content.trim()) return

    const tempId = `optimistic-${Date.now()}`
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversationId: conversation.id,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      content,
      sentAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimisticMsg])
    setOptimisticIds(prev => new Set(prev).add(tempId))
    sendMessage(content)
  }, [conversation.id, currentUser, sendMessage])

  const grouped = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 shrink-0">
        <Link
          href="/dashboard/messages"
          className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
          aria-label="Back to conversations"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>

        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-sm shrink-0">
          {conversation.participantName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 dark:text-white">
            {conversation.participantName}
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 truncate font-medium">
            Re: {conversation.itemName}
          </p>
        </div>

        {status !== 'connected' && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {status === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
          </div>
        )}
      </div>

      {conversation.bookingId && (
        <BookingContextCard
          itemName={conversation.itemName}
          itemImageUrl={conversation.itemImageUrl}
          bookingId={conversation.bookingId}
          itemId={conversation.itemId}
        />
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {grouped.map(({ dateLabel, messages: dayMessages }) => (
          <div key={dateLabel}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0">
                {dateLabel}
              </span>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            </div>

            {dayMessages.map((msg, i) => {
              const isOwn = msg.senderId === currentUser.id
              const isOptimistic = optimisticIds.has(msg.id)
              const prevMsg = dayMessages[i - 1]
              const showAvatar = !isOwn && msg.senderId !== prevMsg?.senderId

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={isOwn}
                  isOptimistic={isOptimistic}
                  showAvatar={showAvatar}
                  senderInitial={conversation.participantName.charAt(0).toUpperCase()}
                />
              )
            })}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 pl-10 py-1">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">{conversation.participantName} is typing</span>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      <MessageInput
        onSend={handleSend}
        onTyping={sendTyping}
        disabled={status === 'error'}
      />
    </div>
  )
}

function groupMessagesByDate(messages: ChatMessage[]): { dateLabel: string; messages: ChatMessage[] }[] {
  const groups: Record<string, ChatMessage[]> = {}
  for (const msg of messages) {
    const date = new Date(msg.sentAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    let label: string
    if (date.toDateString() === today.toDateString()) label = 'Today'
    else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })

    if (!groups[label]) groups[label] = []
    groups[label].push(msg)
  }
  return Object.entries(groups).map(([dateLabel, msgs]) => ({ dateLabel, messages: msgs }))
}
