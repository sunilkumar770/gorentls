// src/lib/messages.ts
import { cookies } from 'next/headers'

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api$/, '').replace(/\/$/, '')

async function authHeader() {
  const cookieStore = await cookies()
  const token = cookieStore.get('gorentals_token')?.value
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface Conversation {
  id: string
  listingId: string
  listingTitle: string
  ownerId: string
  ownerName: string
  renterId: string
  renterName: string
  lastMessage?: string
  lastMessageAt?: string
  ownerUnread: number
  renterUnread: number
  
  // Derived fields for UI
  participantName: string
  participantAvatarUrl?: string
  itemName: string
  itemImageUrl?: string
  unreadCount: number
  bookingId?: string
  itemId?: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  content: string
  sentAt: string
  readAt?: string
  tempId?: string
}

function mapConversation(c: any, currentUserId: string): Conversation {
  const isOwner = c.ownerId === currentUserId
  return {
    ...c,
    participantName: isOwner ? c.renterName : c.ownerName,
    itemName: c.listingTitle,
    itemImageUrl: c.listingImage,
    unreadCount: isOwner ? c.ownerUnread : c.renterUnread,
  }
}

export async function getConversations(currentUserId: string): Promise<Conversation[]> {
  try {
    const url = `${BASE}/api/conversations`
    console.log(`[lib/messages] Fetching conversations from: ${url}`)
    const res = await fetch(url, {
      headers: (await authHeader()) as HeadersInit,
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error(`[lib/messages] Failed to fetch conversations: ${res.status}`)
      return []
    }
    const data = await res.json()
    const content = Array.isArray(data) ? data : data.content ?? []
    return content.map((c: any) => mapConversation(c, currentUserId))
  } catch (err) { 
    console.error(`[lib/messages] Error fetching conversations:`, err)
    return [] 
  }
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    const url = `${BASE}/api/conversations/${conversationId}/messages?limit=50`
    console.log(`[lib/messages] Fetching messages from: ${url}`)
    const res = await fetch(url, {
      headers: (await authHeader()) as HeadersInit,
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error(`[lib/messages] Failed to fetch messages for ${conversationId}: ${res.status}`)
      return []
    }
    const data = await res.json()
    const content = Array.isArray(data) ? data : data.content ?? []
    return content.map((m: any) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: m.senderName,
      content: m.messageText,
      sentAt: m.createdAt,
      status: m.status,
    }))
  } catch (err) { 
    console.error(`[lib/messages] Error fetching messages for ${conversationId}:`, err)
    return [] 
  }
}

export async function getConversation(conversationId: string, currentUserId: string): Promise<Conversation | null> {
  try {
    const url = `${BASE}/api/conversations/${conversationId}`
    console.log(`[lib/messages] Fetching conversation from: ${url}`)
    const res = await fetch(url, {
      headers: (await authHeader()) as HeadersInit,
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error(`[lib/messages] Failed to fetch conversation ${conversationId}: ${res.status}`)
      return null
    }
    const data = await res.json()
    return mapConversation(data, currentUserId)
  } catch (err) { 
    console.error(`[lib/messages] Error fetching conversation ${conversationId}:`, err)
    return null 
  }
}
