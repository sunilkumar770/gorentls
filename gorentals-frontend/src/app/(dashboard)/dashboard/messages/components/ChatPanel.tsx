'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useWebSocketChat } from '@/hooks/useWebSocketChat'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { BookingContextCard } from './BookingContextCard'
import type { ChatMessage, Conversation } from '@/lib/messages'
import type { AuthUser } from '@/context/AuthContext'
import Link from 'next/link'
import { useChat } from '@/context/ChatContext'
import websocketService from '@/services/websocketService'

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
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { refreshUnread } = useChat()

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  // Mark conversation as read whenever conversationId or messages change
  useEffect(() => {
    websocketService.markAsRead(conversation.id)
    refreshUnread()
  }, [conversation.id, messages, refreshUnread])

  const handleIncomingMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => {
      // 1. Dedup: if we already have this message by its server ID, skip
      if (prev.some(m => m.id === msg.id)) return prev

      // 2. tempId match: replace the corresponding optimistic message with the server message
      if (msg.tempId && prev.some(m => m.id === msg.tempId)) {
        return prev.map(m => m.id === msg.tempId ? msg : m)
      }

      // 3. Fallback matching (proximity check within 10 seconds):
      // if matching sender & content, swap the local/optimistic entry
      const matchIndex = prev.findIndex(m => 
        m.senderId === msg.senderId &&
        m.content === msg.content &&
        Math.abs(new Date(m.sentAt).getTime() - new Date(msg.sentAt).getTime()) < 10000
      )
      if (matchIndex !== -1) {
        return prev.map((m, idx) => idx === matchIndex ? msg : m)
      }

      // Otherwise, append as a new message
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

    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `optimistic-${Date.now()}`
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
    sendMessage(content, tempId)
  }, [conversation.id, currentUser, sendMessage])

  const grouped = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-full bg-surface-base">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-3 shrink-0">
        <Link
          href="/dashboard/messages"
          className="md:hidden p-1.5 rounded-lg hover:bg-surface-raised transition-colors text-text-secondary focus-ring"
          aria-label="Back to conversations"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>

        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm shrink-0">
          {(conversation?.participantName || 'User').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-text-primary">
            {conversation?.participantName || 'User'}
          </p>
          <p className="text-xs text-brand-600 truncate font-medium">
            Re: {conversation?.itemName || 'Item'}
          </p>
        </div>

        {status !== 'connected' && (
          <div className="flex items-center gap-1.5 text-xs text-status-warning-text font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {status === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
          </div>
        )}
      </div>

      {conversation?.bookingId && conversation?.itemId && (
        <BookingContextCard
          itemName={conversation.itemName}
          itemImageUrl={conversation.itemImageUrl}
          bookingId={conversation.bookingId}
          itemId={conversation.itemId}
        />
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
        {grouped.map(({ dateLabel, messages: dayMessages }) => (
          <div key={dateLabel}>
            {/* Date divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border-subtle" />
              <span className="text-xs font-medium text-text-muted shrink-0">
                {dateLabel}
              </span>
              <div className="flex-1 h-px bg-border-subtle" />
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
                  senderInitial={(conversation?.participantName || 'User').charAt(0).toUpperCase()}
                />
              )
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 pl-10 py-1">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] text-text-muted font-medium">
              {conversation?.participantName || 'User'} is typing
            </span>
          </div>
        )}
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
