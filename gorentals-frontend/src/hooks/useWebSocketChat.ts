// src/hooks/useWebSocketChat.ts
'use client'
import { useEffect, useState, useCallback } from 'react'
import websocketService, { type IncomingMessage } from '@/services/websocketService'
import type { ChatMessage } from '@/lib/messages'

interface WebSocketChatOptions {
  conversationId: string
  userId: string
  token: string
  onMessage: (msg: ChatMessage) => void
  onTyping?: (isTyping: boolean) => void
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export function useWebSocketChat({
  conversationId,
  userId,
  token,
  onMessage,
  onTyping,
}: WebSocketChatOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  useEffect(() => {
    // Initialize service with token
    websocketService.setToken(token)

    const handleMessage = (msg: IncomingMessage) => {
      // Map backend IncomingMessage to frontend ChatMessage
      const chatMsg: ChatMessage = {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        content: msg.messageText,
        sentAt: msg.createdAt,
      }
      onMessage(chatMsg)
    }

    const unsubConn = websocketService.onConnectionChange((connected) => {
      setStatus(connected ? 'connected' : 'connecting')
    })

    // Subscribe to specific conversation
    websocketService.subscribeToConversation(conversationId, handleMessage)

    return () => {
      unsubConn()
      websocketService.unsubscribeFromConversation(conversationId)
    }
  }, [conversationId, token, onMessage])

  const sendMessage = useCallback((content: string) => {
    // Generate tempId for optimistic UI mapping
    const tempId = `temp-${Date.now()}`
    websocketService.sendMessage(conversationId, content, tempId)
  }, [conversationId])

  const sendTyping = useCallback((isTyping: boolean) => {
    // Backend doesn't currently have a dedicated typing destination in ChatWebSocketController,
    // but we can mock it or extend the backend later.
    // For now, we'll follow the user's plan and provide the function.
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WS] Typing: ${isTyping} for ${conversationId}`)
    }
  }, [conversationId])

  return { sendMessage, sendTyping, status }
}
