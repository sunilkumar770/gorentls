// src/app/(dashboard)/dashboard/messages/components/ConversationList.tsx
'use client'
import Link from 'next/link'
import { useState } from 'react'
import type { Conversation } from '@/lib/messages'
import type { AuthUser } from '@/context/AuthContext'
import { Typography } from '@/components/ui/Typography'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Search as SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ConversationList({
  conversations,
  currentUser,
  activeId,
}: {
  conversations: Conversation[]
  currentUser: AuthUser
  activeId?: string
}) {
  const [search, setSearch] = useState('')
  const filtered = conversations.filter(c =>
    c.participantName.toLowerCase().includes(search.toLowerCase()) ||
    c.itemName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-surface-base">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <Typography variant="h4">Messages</Typography>
          {conversations.some(c => c.unreadCount > 0) && (
            <Badge variant="brand" size="sm">
              {conversations.reduce((acc, c) => acc + c.unreadCount, 0)}
            </Badge>
          )}
        </div>
        {/* Search */}
        <Input
          placeholder="Search conversations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={<SearchIcon className="w-4 h-4" />}
          className="bg-surface-subtle border-none"
          size="sm"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <Typography variant="h3" className="mb-2">💬</Typography>
            <Typography variant="body-sm" className="font-bold text-text-primary mb-1">No conversations</Typography>
            <Typography variant="body-xs" className="text-text-tertiary">
              Start a conversation by messaging an owner from a listing.
            </Typography>
          </div>
        ) : (
          filtered.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
            />
          ))
        )}
      </div>
    </div>
  )
}

function ConversationItem({
  conversation: conv,
  isActive,
}: {
  conversation: Conversation
  isActive: boolean
}) {
  const timeLabel = conv.lastMessageAt
    ? formatRelativeTime(conv.lastMessageAt)
    : ''

  return (
    <Link
      href={`/dashboard/messages/${conv.id}`}
      className={cn(
        'flex items-center gap-3 px-4 py-4 hover:bg-surface-subtle transition-colors border-b border-border-subtle/50',
        isActive && 'bg-brand-50/10 dark:bg-brand-950/20 border-l-2 border-l-brand-600'
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar 
          src={conv.participantAvatarUrl} 
          name={conv.participantName} 
          size="md" 
        />
        {conv.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1">
            <Badge variant="brand" size="xs" className="px-1 min-w-[18px] h-[18px] justify-center border-2 border-surface-base">
              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
            </Badge>
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <Typography 
            variant="body-sm" 
            className={cn('truncate', conv.unreadCount > 0 ? 'font-bold text-text-primary' : 'font-medium text-text-secondary')}
          >
            {conv.participantName}
          </Typography>
          {timeLabel && (
            <Typography variant="body-xs" className="text-text-tertiary shrink-0">{timeLabel}</Typography>
          )}
        </div>
        <p className="text-xs text-text-tertiary truncate mt-0.5">
          <span className="text-brand-600 font-medium">{conv.itemName}</span>
          {conv.lastMessage && ` · ${conv.lastMessage}`}
        </p>
      </div>
    </Link>
  )
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
