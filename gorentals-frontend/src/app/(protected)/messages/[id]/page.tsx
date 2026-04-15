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
import { ArrowLeft, Send, Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react';
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
        // Optimistic swap: replace temp entry with confirmed server message
        if (incoming.tempId) {
          const idx = prev.findIndex(m => m.tempId === incoming.tempId);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx]  = toMessage(incoming);
            return updated;
          }
        }
        // Deduplicate by DB id (handles WS reconnect replay)
        if (incoming.id && prev.some(m => m.id === incoming.id)) return prev;

        // Message from other party → mark read + refresh badge
        if (incoming.senderId !== user.id) {
          websocketService.markAsRead(conversationId);
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
    <div className="flex items-center justify-center h-[calc(100vh-64px)]">
      <Loader2 className="w-6 h-6 animate-spin text-[#16a34a]" />
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4 px-4">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-sm text-[#374151] font-medium">Could not load conversation</p>
      <p className="text-sm text-[#6b7280] text-center">{error}</p>
      <button onClick={() => router.back()}
        className="px-4 py-2 bg-[#111827] text-white text-sm font-semibold rounded-lg hover:bg-[#374151] transition-colors">
        Go back
      </button>
    </div>
  );

  // ── Chat Room ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-3xl mx-auto bg-white rounded-none sm:rounded-2xl sm:my-4 sm:shadow-xl overflow-hidden sm:border border-[#e5e7eb]">

      {/* ── Header ── */}
      <div className="bg-[#16a34a] px-4 py-3 text-white flex items-center gap-3 flex-shrink-0">
        <button onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-[#15803d] transition-colors"
          aria-label="Back to messages">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
          {otherParty?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base leading-tight truncate">
            {otherParty ?? 'Chat'}
          </h2>
          <p className="text-xs text-green-100 truncate">
            {conversation?.listingTitle}
          </p>
        </div>
        {/* Live WS status indicator */}
        {wsConnected
          ? <Wifi    className="w-4 h-4 text-green-200 flex-shrink-0" />
          : <WifiOff className="w-4 h-4 text-yellow-300 animate-pulse flex-shrink-0" />
        }
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f9fafb] scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[#9ca3af]">No messages yet — say hello! 👋</p>
          </div>
        )}

        {messages.map(m => {
          const isMe      = String(m.senderId) === String(user?.id);
          // Pending = optimistic message whose id still equals its tempId
          const isPending = Boolean(m.tempId) && m.id === m.tempId;

          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                isMe
                  ? 'bg-[#16a34a] text-white rounded-tr-none'
                  : 'bg-white text-[#111827] border border-[#f3f4f6] rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed break-words">{m.messageText}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                  isMe ? 'text-green-200' : 'text-[#9ca3af]'
                }`}>
                  {isPending
                    ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    : m.createdAt
                      ? formatDistanceToNow(parseISO(m.createdAt), { addSuffix: true })
                      : null
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
        className="px-4 py-3 border-t border-[#f3f4f6] bg-white flex gap-2 flex-shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={wsConnected ? 'Type a message...' : 'Reconnecting...'}
          className="flex-1 bg-[#f9fafb] border border-[#e5e7eb] rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          aria-label="Send message"
          className="w-10 h-10 bg-[#16a34a] text-white rounded-full flex items-center justify-center hover:bg-[#15803d] active:bg-[#166534] transition-colors disabled:opacity-40 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
