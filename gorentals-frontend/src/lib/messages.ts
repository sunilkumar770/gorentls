// src/lib/messages.ts
import { cookies } from 'next/headers'

const BASE = process.env.NEXT_PUBLIC_API_URL

async function authHeader() {
  const cookieStore = await cookies()
  const token = cookieStore.get('gorentals_token')?.value
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface Conversation {
  id: string
  participantName: string
  participantAvatarUrl?: string
  itemName: string
  itemImageUrl?: string
  itemId: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
  bookingId?: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  content: string
  sentAt: string
  readAt?: string
}

export async function getConversations(): Promise<Conversation[]> {
  try {
    const res = await fetch(`${BASE}/api/conversations`, {
      headers: (await authHeader()) as HeadersInit,
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    // Handle both array and paged response
    return Array.isArray(data) ? data : data.content ?? []
  } catch { return [] }
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    const res = await fetch(`${BASE}/api/conversations/${conversationId}/messages?limit=50`, {
      headers: (await authHeader()) as HeadersInit,
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : data.content ?? []
  } catch { return [] }
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  try {
    const res = await fetch(`${BASE}/api/conversations/${conversationId}`, {
      headers: (await authHeader()) as HeadersInit,
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}
