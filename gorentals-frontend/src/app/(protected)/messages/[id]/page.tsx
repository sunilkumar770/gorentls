'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import websocketService from '@/services/websocketService';
import { formatDistanceToNow } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export default function ChatPage() {
  const { id: conversationId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [convRes, msgRes] = await Promise.all([
          api.get(`/api/conversations/${conversationId}`),
          api.get(`/api/conversations/${conversationId}/messages?size=50`)
        ]);
        setConversation(convRes.data);
        setMessages(msgRes.data.reverse()); // Reverse because API returns desc
        
        // Mark as read on open
        websocketService.markAsRead(conversationId);
      } catch (err) {
        console.error('Failed to load chat:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user && conversationId) {
      fetchHistory();
      
      // Connect and Subscribe
      websocketService.connect(() => {
        websocketService.subscribeToConversation(conversationId as string, (newMsg: any) => {
          setMessages(prev => [...prev, newMsg]);
          
          // If we are currently viewing the chat, mark as read immediately
          if (newMsg.senderId !== user.id) {
            websocketService.markAsRead(conversationId);
          }
        });
      });
    }

    return () => {
      websocketService.unsubscribeFromConversation(conversationId);
      websocketService.disconnect();
    };
  }, [conversationId, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const tempId = uuidv4();
    websocketService.sendMessage(conversationId as any, inputText, tempId as any);
    
    // Optimistic UI update could go here, but STOMP will push back immediately
    setInputText('');
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading conversation...</div>;

  const otherPartyName = user?.id === conversation?.ownerId ? conversation?.renterName : conversation?.ownerName;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border">
      {/* Header */}
      <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="hover:bg-indigo-500 p-1 rounded-lg">
            ← Back
          </button>
          <div>
            <h2 className="font-bold text-lg">{otherPartyName || "Chat"}</h2>
            <p className="text-xs text-indigo-100 italic">{conversation?.listingTitle}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50"
      >
        {messages.map((m) => {
          const isMe = m.senderId === user?.id;
          return (
            <div key={m.id || m.tempId} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border rounded-tl-none'
              }`}>
                <p className="text-sm font-medium">{m.messageText}</p>
                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {m.createdAt ? formatDistanceToNow(new Date(m.createdAt), { addSuffix: true }) : 'Sending...'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t bg-white flex gap-2">
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button 
          type="submit"
          disabled={!inputText.trim()}
          className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold hover:bg-indigo-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
