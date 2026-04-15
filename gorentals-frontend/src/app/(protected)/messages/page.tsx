'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/contexts/ChatContext';
import { getConversations, type Conversation } from '@/services/messages';
import { parseISO, formatDistanceToNow } from 'date-fns';
import { MessageCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function MessagesPage() {
  const { user }        = useAuth();
  const { totalUnread } = useChat();  // badge — NO separate WS subscription needed
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try   { setConversations(await getConversations()); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Failed to load conversations.'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Refresh list whenever global unread count changes (ChatContext drives this)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (user) load(); }, [totalUnread]);

  const getUnread     = (c: Conversation) =>
    String(user?.id) === String(c.ownerId) ? c.ownerUnread : c.renterUnread;
  const getOtherParty = (c: Conversation) =>
    String(user?.id) === String(c.ownerId) ? c.renterName : c.ownerName;

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="max-w-3xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#111827] flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-[#16a34a]" />
              Messages
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {totalUnread}
                </span>
              )}
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">Your conversations with renters and owners</p>
          </div>
          <button onClick={load} disabled={loading}
            className="p-2 rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
            aria-label="Refresh conversations">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#16a34a]" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-red-100">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-[#374151] font-medium mb-1">Could not load conversations</p>
            <p className="text-sm text-[#6b7280] mb-4">{error}</p>
            <button onClick={load}
              className="px-4 py-2 bg-[#111827] text-white text-sm font-semibold rounded-lg hover:bg-[#374151] transition-colors">
              Try again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-[#f3f4f6]">
            <MessageCircle className="w-12 h-12 text-[#d1d5db] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#111827] mb-2">No conversations yet</h3>
            <p className="text-sm text-[#6b7280] max-w-xs mx-auto">
              Tap &ldquo;Contact Owner&rdquo; on any listing to start a conversation.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {conversations.map(conv => {
              const unread     = getUnread(conv);
              const otherParty = getOtherParty(conv);
              const hasUnread  = unread > 0;
              return (
                <Link key={conv.id} href={`/messages/${conv.id}`}>
                  <div className={`bg-white rounded-xl px-5 py-4 border transition-all hover:shadow-md hover:border-[#16a34a] cursor-pointer ${
                    hasUnread ? 'border-l-4 border-l-[#16a34a] border-[#e5e7eb]' : 'border-[#f3f4f6]'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        hasUnread ? 'bg-[#16a34a] text-white' : 'bg-[#f0fdf4] text-[#16a34a]'
                      }`}>
                        {otherParty?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-sm truncate ${hasUnread ? 'font-bold text-[#111827]' : 'font-semibold text-[#374151]'}`}>
                              {otherParty}
                            </span>
                            {hasUnread && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-[#16a34a] text-white rounded-full">
                                {unread}
                              </span>
                            )}
                          </div>
                          {conv.lastMessageAt && (
                            <span className="text-[11px] text-[#9ca3af] whitespace-nowrap flex-shrink-0">
                              {formatDistanceToNow(parseISO(conv.lastMessageAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6b7280] font-medium mb-1 truncate">📦 {conv.listingTitle}</p>
                        <p className={`text-sm line-clamp-1 ${hasUnread ? 'font-medium text-[#111827]' : 'text-[#6b7280]'}`}>
                          {conv.lastMessage ?? 'No messages yet — say hello!'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
