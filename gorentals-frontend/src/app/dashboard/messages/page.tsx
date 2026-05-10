'use client';

import { useState } from 'react';
import { 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip, 
  Smile,
  ChevronLeft,
  CheckCheck,
  User,
  Filter,
  MapPin
} from 'lucide-react';

const MOCK_CHATS = [
  { id: 1, name: 'Rahul Sharma', lastMsg: 'Is the camera still available for...', time: '10:24 AM', unread: 2, online: true, avatar: 'R', city: 'Hyderabad', item: 'Sony A7 III' },
  { id: 2, name: 'Priya Kapoor', lastMsg: 'The pickup was smooth, thanks!', time: 'Yesterday', unread: 0, online: false, avatar: 'P', city: 'Bengaluru', item: 'MacBook Pro' },
  { id: 3, name: 'Aarav Mehta', lastMsg: 'Can we extend the rental for 2...', time: 'Oct 8', unread: 0, online: false, avatar: 'A', city: 'Mumbai', item: 'Drone Mini 3' },
  { id: 4, name: 'Sneha Trivedi', lastMsg: 'Please send the deposit refund...', time: 'Oct 5', unread: 0, online: true, avatar: 'S', city: 'Chennai', item: 'Rode Mic' },
];

const MOCK_MESSAGES = [
  { id: 1, text: 'Hi Rahul, is the Sony A7 III still available for this weekend?', time: '9:15 AM', sent: true },
  { id: 2, text: 'Yes, it is available! I just finished cleaning it from the last rental.', time: '9:20 AM', sent: false },
  { id: 3, text: 'Great. Does it come with the 24-70mm lens?', time: '9:22 AM', sent: true },
  { id: 4, text: 'Yes, the kit includes the 24-70mm f/2.8 lens, 3 batteries, and a 128GB SD card.', time: '9:25 AM', sent: false },
  { id: 5, text: 'Awesome. I will proceed with the booking now.', time: '9:30 AM', sent: true },
  { id: 6, text: 'Perfect! I will confirm it immediately after.', time: '9:31 AM', sent: false, status: 'system' },
];

export default function MessagingPage() {
  const [activeChat, setActiveChat] = useState(MOCK_CHATS[0]);
  const [msgInput, setMsgInput] = useState('');

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Sidebar - Chat List */}
      <div className="w-full lg:w-96 flex flex-col bg-card rounded-[2.5rem] shadow-sm shadow-slate-100/50 overflow-hidden">
        <div className="p-6 border-b-2 border-border">
          <h1 className="text-2xl font-bold text-text mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
            <input 
              placeholder="Search conversations..."
              className="w-full h-11 pl-11 pr-4 bg-subtle rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all border-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {MOCK_CHATS.map((chat) => (
            <button 
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`w-full p-4 flex items-start gap-4 transition-all border-l-4 ${
                activeChat.id === chat.id 
                  ? 'bg-indigo-50/50 border-[#4F46E5]' 
                  : 'border-transparent hover:bg-subtle'
              }`}
            >
              <div className="relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold ${
                  chat.id % 2 === 0 ? 'bg-amber-500' : 'bg-[#4F46E5]'
                }`}>
                  {chat.avatar}
                </div>
                {chat.online && (
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-text truncate">{chat.name}</h3>
                  <span className="text-[10px] text-faint font-bold">{chat.time}</span>
                </div>
                <p className="text-xs text-[#4F46E5] font-bold mb-1 truncate">{chat.item}</p>
                <p className="text-xs text-muted truncate leading-relaxed">{chat.lastMsg}</p>
              </div>
              {chat.unread > 0 && (
                <div className="w-5 h-5 bg-[#4F46E5] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {chat.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="hidden lg:flex flex-1 flex-col bg-card rounded-[2.5rem] shadow-sm shadow-slate-100/50 overflow-hidden">
        {/* Chat Header */}
        <div className="p-6 border-b-2 border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold ${
              activeChat.id % 2 === 0 ? 'bg-amber-500' : 'bg-[#4F46E5]'
            }`}>
              {activeChat.avatar}
            </div>
            <div>
              <h3 className="font-bold text-text">{activeChat.name}</h3>
              <div className="flex items-center gap-2 text-[10px] font-bold text-faint uppercase tracking-widest mt-0.5">
                <MapPin className="w-3 h-3" /> {activeChat.city}
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className={activeChat.online ? 'text-emerald-500' : 'text-faint'}>
                  {activeChat.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-11 h-11 bg-subtle rounded-2xl flex items-center justify-center text-muted hover:bg-subtle transition-colors">
              <Phone className="w-4 h-4" />
            </button>
            <button className="w-11 h-11 bg-subtle rounded-2xl flex items-center justify-center text-muted hover:bg-subtle transition-colors">
              <Video className="w-4 h-4" />
            </button>
            <button className="w-11 h-11 bg-subtle rounded-2xl flex items-center justify-center text-muted hover:bg-subtle transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-subtle/30">
          <div className="flex justify-center">
            <span className="px-4 py-1.5 bg-card text-[10px] font-bold text-faint uppercase tracking-widest rounded-full shadow-sm">
              Today
            </span>
          </div>

          {MOCK_MESSAGES.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${
                msg.sent 
                  ? 'bg-[#4F46E5] text-white rounded-[2rem] rounded-tr-lg p-5 shadow-lg shadow-indigo-100' 
                  : 'bg-card text-text rounded-[2rem] rounded-tl-lg p-5 shadow-sm'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <div className={`flex items-center gap-1.5 mt-2 text-[10px] font-bold ${
                  msg.sent ? 'text-indigo-200' : 'text-faint'
                }`}>
                  {msg.time}
                  {msg.sent && <CheckCheck className="w-3 h-3" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-6 bg-card border-t-2 border-border">
          <div className="flex items-center gap-4 bg-subtle rounded-3xl p-2 px-4">
            <button className="text-faint hover:text-muted p-2">
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 bg-transparent h-12 text-sm font-medium focus:outline-none"
            />
            <button className="text-faint hover:text-muted p-2">
              <Smile className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 bg-[#4F46E5] text-white rounded-2xl flex items-center justify-center hover:bg-[#4338CA] transition-colors shadow-lg shadow-indigo-200">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
