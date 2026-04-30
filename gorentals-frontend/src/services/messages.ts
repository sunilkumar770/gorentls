// src/services/messages.ts
// REST abstraction for conversations and messages.
// Axios baseURL = http://localhost:8080/api → use /conversations (NOT /api/conversations)
// Bug fixed: old pages used /api/conversations → resolved to /api/api/conversations → 404

import api from '@/lib/axios';

// ── Types: matched to ConversationResponse.java and MessageResponse.java ──────

export interface Conversation {
  id:            string;
  listingId:     string;
  listingTitle:  string;
  ownerId:       string;
  ownerName:     string;
  ownerEmail:    string;
  renterId:      string;
  renterName:    string;
  renterEmail:   string;
  lastMessage:   string | null;
  lastMessageAt: string | null;  // ISO-8601
  ownerUnread:   number;
  renterUnread:  number;
  createdAt:     string;
}

export interface Message {
  id:             string;
  tempId:         string | null;
  conversationId: string;
  senderId:       string;
  senderName:     string;
  senderEmail:    string;
  messageText:    string;
  messageType:    'TEXT' | 'IMAGE' | 'SYSTEM';
  status:         'SENT' | 'DELIVERED' | 'READ';
  createdAt:      string;  // ISO-8601
}

// ── API functions ─────────────────────────────────────────────────────────────

// GET /api/conversations → sorted newest first
export async function getConversations(): Promise<Conversation[]> {
  const res = await api.get<Conversation[]>('/conversations');
  const list = Array.isArray(res.data) ? res.data : [];
  return list.sort((a, b) =>
    new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()
  );
}

// GET /api/conversations/{id}
export async function getConversation(id: string): Promise<Conversation> {
  const res = await api.get<Conversation>(`/conversations/${id}`);
  return res.data;
}

// GET /api/conversations/{id}/messages?page=0&size=50
// Backend returns List<MessageResponse> — already sorted ASC by createdAt
export async function getMessages(conversationId: string): Promise<Message[]> {
  const res = await api.get<Message[]>(`/conversations/${conversationId}/messages`, {
    params: { page: 0, size: 50 },
  });
  return Array.isArray(res.data) ? res.data : [];
}

// POST /api/conversations
// StartConversationRequest requires: listingId (UUID) + initialMessage (@NotBlank)
// Note: backend derives ownerId from the listing — do NOT send ownerId in payload
export async function startConversation(
  listingId: string,
  initialMessage: string
): Promise<Conversation> {
  const res = await api.post<Conversation>('/conversations', { 
    listingId, 
    message: initialMessage 
  });
  return res.data;
}

// PATCH /api/conversations/{id}/read → returns 204 No Content
// Non-critical — failure is silently swallowed so it never blocks the UI
export async function markConversationRead(conversationId: string): Promise<void> {
  await api.patch(`/conversations/${conversationId}/read`).catch((err) => {
  });
}
