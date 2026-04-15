// src/services/websocketService.ts
// Production singleton — one persistent WS connection for the entire browser session.
// Rule: NEVER call disconnect() on component unmount. Only disconnectPermanently() on logout.

import { Client, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// ── Types: matched exactly to backend MessageResponse.java ────────────────────

export type MessageType   = 'TEXT' | 'IMAGE' | 'SYSTEM';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface IncomingMessage {
  readonly id:             string;
  readonly conversationId: string;
  readonly senderId:       string;
  readonly senderName:     string;
  readonly senderEmail:    string;
  readonly messageText:    string;
  readonly messageType:    MessageType;
  readonly status:         MessageStatus;
  readonly tempId:         string | null;  // echoed back from backend for optimistic swap
  readonly createdAt:      string;         // ISO-8601 LocalDateTime
}

type MessageCallback    = (msg: IncomingMessage) => void;
type InboxCallback      = (msg: IncomingMessage) => void;
type ConnectionCallback = (connected: boolean) => void;
type AuthFailCallback   = () => void;

// ── Singleton ─────────────────────────────────────────────────────────────────

class WebSocketService {
  private client:            Client | null = null;
  private subscriptions      = new Map<string, StompSubscription>();
  private pendingOnConnect   = new Set<() => void>();
  private connListeners      = new Set<ConnectionCallback>();
  private authFailListeners  = new Set<AuthFailCallback>();

  // Matches AuthContext.tsx → localStorage.setItem('gr_token', token)
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('gr_token');
  }

  private getWsUrl(): string {
    const url = process.env.NEXT_PUBLIC_WS_URL;
    if (!url) {
      // Fail loud in dev (report recommendation), fall back in prod
      if (process.env.NODE_ENV === 'development') {
        console.warn('[WS] NEXT_PUBLIC_WS_URL not set — using localhost:8080');
        return 'http://localhost:8080/ws/chat';
      }
      throw new Error('[WS] NEXT_PUBLIC_WS_URL must be set in production');
    }
    return url;
  }

  private notify(connected: boolean): void {
    this.connListeners.forEach(cb => cb(connected));
  }

  // ── connect ───────────────────────────────────────────────────────────────

  connect(onReady?: () => void): void {
    const token = this.getToken();
    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[WS] No auth token — skipping connection');
      }
      return;
    }

    // Already connected → run callback immediately
    if (this.client?.connected) {
      onReady?.();
      return;
    }

    // Connecting in progress → queue the callback
    if (this.client) {
      if (onReady) this.pendingOnConnect.add(onReady);
      return;
    }

    if (onReady) this.pendingOnConnect.add(onReady);

    this.client = new Client({
      webSocketFactory: () => new SockJS(this.getWsUrl()),
      connectHeaders:   { Authorization: `Bearer ${token}` },
      reconnectDelay:   5000,

      debug: (str) => {
        if (process.env.NODE_ENV === 'development') console.debug('[WS]', str);
      },

      onConnect: () => {
        console.log('[WS] Connected');
        this.notify(true);
        this.pendingOnConnect.forEach(cb => cb());
        this.pendingOnConnect.clear();
      },

      // JWT rejection arrives here (HTTP 401 on SockJS handshake → close code 1008)
      // NOT in onStompError — that is a common misconception.
      onWebSocketClose: (event: CloseEvent) => {
        this.notify(false);
        const isAuthFailure = event?.code === 1008
          || event?.reason?.toLowerCase().includes('401')
          || event?.reason?.toLowerCase().includes('unauthorized');

        if (isAuthFailure) {
          console.warn('[WS] Auth rejected — triggering logout');
          this.authFailListeners.forEach(cb => cb());
        } else {
          console.log('[WS] Connection closed — auto-reconnecting in 5s');
        }
      },

      // Log ALL STOMP protocol errors — never leave this empty
      onStompError: (frame) => {
        console.error('[WS] STOMP error:', frame.headers['message'], '|', frame.body);
      },
    });

    this.client.activate();
  }

  // ── subscriptions ─────────────────────────────────────────────────────────

  subscribeToConversation(conversationId: string, callback: MessageCallback): void {
    const doSub = () => {
      if (!this.client?.connected) return;
      // Unsubscribe existing before re-subscribing (handles page re-entry)
      this.unsubscribeFromConversation(conversationId);
      const sub = this.client.subscribe(
        `/topic/conversation.${conversationId}`,
        (frame) => {
          try   { callback(JSON.parse(frame.body) as IncomingMessage); }
          catch (e) { console.error('[WS] Bad message frame:', e); }
        }
      );
      this.subscriptions.set(conversationId, sub);
    };
    this.connect(doSub);
  }

  // Called from ChatProvider ONLY — returns sub so provider can unsubscribe on cleanup
  subscribeToInbox(callback: InboxCallback): StompSubscription | null {
    if (!this.client?.connected) return null;
    return this.client.subscribe('/user/queue/messages', (frame) => {
      try   { callback(JSON.parse(frame.body) as IncomingMessage); }
      catch (e) { console.error('[WS] Bad inbox frame:', e); }
    });
  }

  unsubscribeFromConversation(conversationId: string): void {
    const sub = this.subscriptions.get(conversationId);
    if (sub) { sub.unsubscribe(); this.subscriptions.delete(conversationId); }
  }

  // ── send ──────────────────────────────────────────────────────────────────

  sendMessage(conversationId: string, messageText: string, tempId?: string): void {
    if (!this.client?.connected) {
      console.warn('[WS] sendMessage: not connected — message dropped');
      return;
    }
    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ conversationId, messageText, tempId: tempId ?? null, messageType: 'TEXT' }),
    });
  }

  markAsRead(conversationId: string): void {
    if (!this.client?.connected) return;
    this.client.publish({
      destination: '/app/chat.read',
      body: JSON.stringify({ conversationId }),
    });
  }

  // ── observables ───────────────────────────────────────────────────────────

  onConnectionChange(cb: ConnectionCallback): () => void {
    this.connListeners.add(cb);
    cb(this.client?.connected ?? false); // emit current state immediately
    return () => this.connListeners.delete(cb);
  }

  onAuthFailure(cb: AuthFailCallback): () => void {
    this.authFailListeners.add(cb);
    return () => this.authFailListeners.delete(cb);
  }

  // ── lifecycle ─────────────────────────────────────────────────────────────

  // ONLY call this on logout — never on component unmount
  disconnectPermanently(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();
    this.pendingOnConnect.clear();
    if (this.client) { this.client.deactivate(); this.client = null; }
    this.notify(false);
    console.log('[WS] Permanently disconnected');
  }

  get isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}

const websocketService = new WebSocketService();
export default websocketService;
