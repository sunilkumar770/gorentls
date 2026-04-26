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
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-3xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-[var(--text)] flex items-center gap-3">
              <MessageCircle className="w-7 h-7 text-[var(--primary)]" />
              Inbox
              {totalUnread > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-[#ef4444] text-white rounded-full shadow-sm">
                  {totalUnread}
                </span>
              )}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1 font-medium">Your active negotiations and support threads</p>
          </div>
          <button onClick={load} disabled={loading}
            className="p-2.5 rounded-[var(--r-md)] text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors shadow-sm"
            aria-label="Refresh conversations">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
          </div>
        ) : error ? (
          <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] p-10 text-center border border-red-500/20 shadow-card">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-[var(--text)] font-bold mb-1">Could not load inbox</p>
            <p className="text-sm text-[var(--text-muted)] mb-4">{error}</p>
            <button onClick={load}
              className="px-5 py-2.5 bg-[var(--text)] text-[var(--bg)] text-sm font-bold rounded-[var(--r-md)] hover:bg-black transition-colors shadow-sm">
              Try again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] p-16 text-center border border-[var(--border)] shadow-card">
            <MessageCircle className="w-12 h-12 text-[var(--border-strong)] mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-[var(--text)] mb-2">No active threads</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">
              Tap &ldquo;Contact Owner&rdquo; on any listing or respond to rental requests.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {conversations.map(conv => {
              const unread     = getUnread(conv);
              const otherParty = getOtherParty(conv);
              const hasUnread  = unread > 0;
              return (
                <Link key={conv.id} href={`/messages/${conv.id}`}>
                  <div className={`bg-[var(--bg-card)] rounded-[var(--r-lg)] px-5 py-4 border transition-all hover:shadow-card hover:border-[var(--primary)] cursor-pointer ${
                    hasUnread ? 'border-l-4 border-l-[var(--primary)] border-[var(--border)]' : 'border-[var(--border)]'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm ${
                        hasUnread ? 'gradient-teal text-white border-transparent' : 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/10'
                      }`}>
                        {otherParty?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-sm truncate ${hasUnread ? 'font-bold text-[var(--text)]' : 'font-semibold text-[var(--text-muted)]'}`}>
                              {otherParty}
                            </span>
                            {hasUnread && (
                              <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold gradient-teal text-white rounded-full shadow-sm">
                                {unread}
                              </span>
                            )}
                          </div>
                          {conv.lastMessageAt && (
                            <span className="text-[11px] font-semibold text-[var(--text-faint)] whitespace-nowrap flex-shrink-0">
                              {formatDistanceToNow(parseISO(conv.lastMessageAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] font-medium mb-1.5 truncate flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[var(--primary)] block opacity-70"></span> 
                          {conv.listingTitle}
                        </p>
                        <p className={`text-sm line-clamp-1 ${hasUnread ? 'font-medium text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
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
