'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/contexts/ChatContext';
import {
  getConversation, getMessages, markConversationRead,
  type Conversation, type Message,
} from '@/services/messages';
import websocketService, { type IncomingMessage } from '@/services/websocketService';
import { parseISO, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Send, Loader2, AlertCircle, Wifi, WifiOff, Check, CheckCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

function toMessage(m: IncomingMessage): Message {
  return {
    id: m.id, tempId: m.tempId, conversationId: m.conversationId,
    senderId: m.senderId, senderName: m.senderName, senderEmail: m.senderEmail,
    messageText: m.messageText, messageType: m.messageType,
    status: m.status, createdAt: m.createdAt,
  };
}

export default function ChatPage() {
  const params         = useParams();
  const conversationId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;
  const { user }       = useAuth();
  const { refreshUnread } = useChat();
  const router         = useRouter();

  const [messages,     setMessages]     = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputText,    setInputText]    = useState('');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [wsConnected,  setWsConnected]  = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current)
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  // Load history — sequenced to fix race condition (mark read AFTER messages load)
  useEffect(() => {
    if (!user || !conversationId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [conv, msgs] = await Promise.all([
          getConversation(conversationId),
          getMessages(conversationId),
        ]);
        setConversation(conv);
        setMessages(msgs);
        // Sequence: load first, then mark read, then update badge
        await markConversationRead(conversationId);
        refreshUnread();

        // Phase 2: Send ACKs for all recent SENT messages from other party
        msgs.forEach(m => {
          if (m.senderId !== user.id && m.status === 'SENT') {
            websocketService.sendDeliveryAck(m.id);
          }
        });
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Failed to load conversation.');
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user?.id]);

  // Real-time subscription
  useEffect(() => {
    if (!conversationId || !user) return;
    const removeConn = websocketService.onConnectionChange(setWsConnected);

    websocketService.subscribeToConversation(conversationId, (incoming: IncomingMessage) => {
      setMessages(prev => {
        // 1. Check if this is a status update for an existing message (ACK or READ update)
        const existingIdx = prev.findIndex(m => m.id === incoming.id);
        if (existingIdx !== -1 && incoming.id) {
          const updated = [...prev];
          updated[existingIdx] = toMessage(incoming);
          return updated;
        }

        // 2. Optimistic swap: replace temp entry with confirmed server message
        if (incoming.tempId) {
          const tempIdx = prev.findIndex(m => m.tempId === incoming.tempId);
          if (tempIdx !== -1) {
            const updated = [...prev];
            updated[tempIdx] = toMessage(incoming);
            return updated;
          }
        }

        // 3. Deduplicate by DB id (handles WS reconnect replay)
        if (incoming.id && prev.some(m => m.id === incoming.id)) return prev;

        // 4. Message from other party → mark read + send delivery ACK
        if (incoming.senderId !== user.id) {
          websocketService.markAsRead(conversationId);
          websocketService.sendDeliveryAck(incoming.id);
          refreshUnread();
        }
        return [...prev, toMessage(incoming)];
      });
      scrollToBottom();
    });

    return () => {
      websocketService.unsubscribeFromConversation(conversationId);
      removeConn();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user?.id]);

  // Auto-scroll whenever message list grows
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !user) return;

    // crypto.randomUUID() — native ES2021, no external dependency needed
    const tempId = crypto.randomUUID();

    const optimistic: Message = {
      id: tempId, tempId, conversationId,
      senderId: user.id, senderName: user.fullName ?? 'Me',
      senderEmail: user.email ?? '', messageText: text,
      messageType: 'TEXT', status: 'SENT',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setInputText('');
    scrollToBottom();
    inputRef.current?.focus();

    if (websocketService.isConnected) {
      websocketService.sendMessage(conversationId, text, tempId);
    } else {
      toast.error('Reconnecting — message will send shortly');
      websocketService.connect(() =>
        websocketService.sendMessage(conversationId, text, tempId)
      );
    }
  };

  const otherParty = String(user?.id) === String(conversation?.ownerId)
    ? conversation?.renterName
    : conversation?.ownerName;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-[var(--bg)]">
      <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4 px-4 bg-[var(--bg)]">
      <AlertCircle className="w-10 h-10 text-red-500" />
      <p className="text-sm text-[var(--text)] font-bold">Could not load conversation</p>
      <p className="text-sm text-[var(--text-muted)] text-center">{error}</p>
      <button onClick={() => router.back()}
        className="px-5 py-2.5 bg-[var(--text)] text-[var(--bg)] text-sm font-bold rounded-[var(--r-md)] hover:bg-black transition-colors shadow-sm">
        Go back
      </button>
    </div>
  );

  // ── Chat Room ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto bg-[var(--bg-card)] rounded-none sm:rounded-[var(--r-xl)] sm:my-6 sm:shadow-card overflow-hidden sm:border border-[var(--border)]">

      {/* ── Header ── */}
      <div className="gradient-teal px-4 py-4 text-white flex items-center gap-4 flex-shrink-0 shadow-sm border-b border-[var(--border)]/20">
        <button onClick={() => router.back()}
          className="p-2 rounded-[var(--r-md)] hover:bg-white/10 transition-colors"
          aria-label="Back to messages">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-inner">
          {otherParty?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base leading-tight truncate">
            {otherParty ?? 'Chat'}
          </h2>
          <p className="text-xs text-white/80 truncate font-medium mt-0.5">
            {conversation?.listingTitle}
          </p>
        </div>
        {/* Live WS status indicator */}
        {wsConnected
          ? <Wifi className="w-4 h-4 text-white/90 flex-shrink-0" />
          : <span title="Reconnecting..."><WifiOff className="w-4 h-4 text-amber-300 animate-pulse flex-shrink-0" /></span>
        }
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gradient-to-b from-[var(--bg)] to-[var(--bg-card)] scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm font-medium text-[var(--text-faint)]">No messages yet — say hello! 👋</p>
          </div>
        )}

        {messages.map(m => {
          const isMe      = String(m.senderId) === String(user?.id);
          // Pending = optimistic message whose id still equals its tempId
          const isPending = Boolean(m.tempId) && m.id === m.tempId;

          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm border ${
                isMe
                  ? 'gradient-teal text-white rounded-tr-sm border-transparent'
                  : 'bg-[var(--bg-card)] text-[var(--text)] border-[var(--border)] rounded-tl-sm'
              }`}>
                <p className="text-sm leading-relaxed break-words">{m.messageText}</p>
                <div className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] font-medium ${
                  isMe ? 'text-white/80' : 'text-[var(--text-faint)]'
                }`}>
                  {isPending
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <>
                        {m.createdAt && formatDistanceToNow(parseISO(m.createdAt), { addSuffix: true })}
                        {isMe && (
                          <span className="flex ml-0.5">
                            {m.status === 'SENT' && <Check className="w-3 h-3 opacity-70" />}
                            {(m.status === 'DELIVERED' || m.status === 'READ') && (
                              <CheckCheck className={`w-3 h-3 ${m.status === 'READ' ? 'text-emerald-300' : 'opacity-90'}`} />
                            )}
                          </span>
                        )}
                      </>
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Input ── */}
      <form
        onSubmit={handleSend}
        className="px-4 py-4 border-t border-[var(--border)] bg-[var(--bg-card)] flex gap-3 flex-shrink-0 items-center"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={wsConnected ? 'Type a message...' : 'Reconnecting...'}
          className="flex-1 bg-[var(--bg)] border border-[var(--border-strong)] rounded-full px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all placeholder:text-[var(--text-faint)] text-[var(--text)] shadow-inner"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          aria-label="Send message"
          className="w-12 h-12 gradient-teal text-white rounded-full flex items-center justify-center hover:shadow-md transition-all disabled:opacity-40 flex-shrink-0"
        >
          <Send className="w-5 h-5 ml-0.5" />
        </button>
      </form>
    </div>
  );
}
