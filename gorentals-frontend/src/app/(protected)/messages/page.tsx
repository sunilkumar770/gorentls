'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get('/api/conversations');
        setConversations(response.data);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchConversations();
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading conversations...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Your Messages</h1>
      
      {conversations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
          No messages yet. Start a conversation from a listing page!
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conv) => {
            const isOwner = user?.id === conv.ownerId;
            const otherPartyName = isOwner ? conv.renterName : conv.ownerName;
            const unreadCount = isOwner ? conv.ownerUnread : conv.renterUnread;

            return (
              <Link key={conv.id} href={`/messages/${conv.id}`}>
                <div className={`p-4 rounded-xl border transition-all hover:border-indigo-500 hover:shadow-md bg-white ${unreadCount > 0 ? 'border-l-4 border-l-indigo-600' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg">{otherPartyName}</span>
                        {unreadCount > 0 && (
                          <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 font-medium text-sm mb-2">{conv.listingTitle}</p>
                      <p className="text-gray-600 line-clamp-1 italic">
                        {conv.lastMessage || "No messages yet"}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      {conv.lastMessageAt && (
                        <span className="text-xs text-gray-400 block whitespace-nowrap">
                          {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
