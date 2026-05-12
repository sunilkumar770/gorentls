# PHASE 4 — MESSAGING SYSTEM RECOVERY

## 1. Goal Description
The goal is to overhaul the messaging system of GoRentals, replacing hardcoded/static conversation data with a real-time, WebSocket-backed communication infrastructure.

## 2. Requirements
- **Server-Side Data**: Fetch conversation list and message history from backend APIs.
- **Real-Time Communication**: Implement WebSockets (STOMP pattern) with exponential backoff reconnect and HTTP fetch-on-reconnect fallback.
- **Optimistic UI**: Implement optimistic message sending with client-side deduplication.
- **Responsive Design**: 
  - Desktop: 3-panel layout (Conversation List, Chat Panel, Context Card).
  - Mobile: Route-based navigation (List view vs. Detail view).
- **Contextual Awareness**: Show booking/item context card at the top of conversations.
- **Security**: Pass JWT token in WebSocket handshake and API headers.

## 3. Implementation Plan

### 3.1. API Utilities (`src/lib/messages.ts`)
Implement `getConversations`, `getMessages`, and `getConversation` using server-side fetching with the `gorentals_token` cookie.

### 3.2. WebSocket Hook (`src/hooks/useWebSocketChat.ts`)
Manage WebSocket lifecycle:
- Connection status tracking.
- Message sending/receiving.
- Typing indicators.
- Automatic reconnection with exponential backoff.

### 3.3. Page Components
- `src/app/(dashboard)/dashboard/messages/page.tsx`: Conversation list view (SSR).
- `src/app/(dashboard)/dashboard/messages/[conversationId]/page.tsx`: Chat thread view (SSR shell).

### 3.4. UI Components (`src/app/(dashboard)/dashboard/messages/components/`)
- `ConversationList.tsx`: Searchable list of conversations.
- `ChatPanel.tsx`: Main chat area with message thread and input.
- `MessageBubble.tsx`: Individual message display.
- `MessageInput.tsx`: Input area with typing indicator support.
- `BookingContextCard.tsx`: Contextual information about the rental item.
- `EmptyConversation.tsx`: Desktop placeholder when no chat is selected.

## 4. Verification Plan
- [ ] Verify conversations are fetched from real API endpoints.
- [ ] Verify real-time message exchange via WebSockets.
- [ ] Verify automatic reconnection on network drop.
- [ ] Verify optimistic updates and delivery indicators.
- [ ] Verify responsive behavior on mobile (route-based navigation).
