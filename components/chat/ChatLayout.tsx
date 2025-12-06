
import React, { useState } from 'react';
import { Search, MoreHorizontal, Phone, Video, Send, Smile, Image as ImageIcon, CheckCheck, Clock, Check } from 'lucide-react';
import { ChatSession, LeaseData, Language, ChatMessage } from '../../types';
import { t } from '../../utils/i18n';

// MOCK DATA GENERATOR
const getMockChats = (currentLease: LeaseData): ChatSession[] => {
    const renterName = currentLease.renter.surname || 'Renter';
    return [
        {
            id: '1',
            user: { id: 'r1', name: renterName, avatar: '', status: 'online', role: 'Renter' },
            lastMessage: 'How does it work?',
            lastMessageTime: '09:41 AM',
            unreadCount: 2,
            messages: [
                { id: '1', senderId: 'other', text: 'Oh?', timestamp: '09:30 AM', type: 'text', status: 'read' },
                { id: '2', senderId: 'other', text: 'Cool', timestamp: '09:31 AM', type: 'text', status: 'read' },
                { id: '3', senderId: 'me', text: 'How does it work?', timestamp: '09:41 AM', type: 'text', status: 'read' },
                { id: '4', senderId: 'system', text: 'Vehicle is in use by Rider', timestamp: '09:45 AM', type: 'system', status: 'read' },
                { id: '5', senderId: 'me', text: 'You just edit any text to type in the conversation you want to show, and delete any bubbles you don\'t want to use', timestamp: '09:50 AM', type: 'text', status: 'read' },
                { id: '6', senderId: 'other', text: 'Boom!', timestamp: '09:51 AM', type: 'text', status: 'read' }
            ]
        },
        {
            id: '2',
            user: { id: 's1', name: 'Carlo Emilio', avatar: '', status: 'busy', role: 'Support' },
            lastMessage: 'Let\'s go',
            lastMessageTime: 'Yesterday',
            unreadCount: 0,
            messages: []
        },
        {
            id: '3',
            user: { id: 'o1', name: 'Oscar Davis', avatar: '', status: 'offline', role: 'Owner' },
            lastMessage: 'Trueeeeee',
            lastMessageTime: 'Mon',
            unreadCount: 0,
            messages: []
        }
    ];
};

interface ChatLayoutProps {
    leaseData: LeaseData;
    lang: Language;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ leaseData, lang }) => {
    const [chats, setChats] = useState<ChatSession[]>(() => getMockChats(leaseData));
    const [activeChatId, setActiveChatId] = useState<string>('1');
    const [messageInput, setMessageInput] = useState('');

    const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;
        
        const newMessage: ChatMessage = {
            id: Math.random().toString(),
            senderId: 'me',
            text: messageInput,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'text',
            status: 'sent'
        };

        const updatedChats = chats.map(c => {
            if (c.id === activeChatId) {
                return {
                    ...c,
                    messages: [...c.messages, newMessage],
                    lastMessage: messageInput,
                    lastMessageTime: 'Just now'
                };
            }
            return c;
        });

        setChats(updatedChats);
        setMessageInput('');
    };

    return (
        <div className="flex h-full bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            
            {/* LEFT SIDEBAR: Chat List */}
            <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50">
                <div className="p-4 border-b border-slate-100 bg-white">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">{t('switch_chat', lang)}</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder={t('chat_search', lang)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {chats.map(chat => (
                        <div 
                            key={chat.id}
                            onClick={() => setActiveChatId(chat.id)}
                            className={`p-4 flex gap-3 cursor-pointer transition-colors border-b border-slate-50 hover:bg-slate-100 ${activeChatId === chat.id ? 'bg-white shadow-sm' : ''}`}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold overflow-hidden">
                                    {chat.user.avatar ? <img src={chat.user.avatar} alt={chat.user.name} /> : chat.user.name[0]}
                                </div>
                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${chat.user.status === 'online' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-slate-800 text-sm truncate">{chat.user.name}</h3>
                                    <span className="text-xs text-slate-400">{chat.lastMessageTime}</span>
                                </div>
                                <p className="text-xs text-slate-500 truncate">{chat.lastMessage}</p>
                            </div>
                            {chat.unreadCount > 0 && (
                                <div className="flex items-center">
                                    <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                                        {chat.unreadCount}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* MIDDLE: Chat Room */}
            <div className="flex-1 flex flex-col bg-white">
                {/* Header */}
                <div className="h-16 border-b border-slate-100 flex justify-between items-center px-6">
                    <div className="flex items-center gap-3">
                         <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                             {activeChat.user.name[0]}
                         </div>
                         <div>
                             <h3 className="font-bold text-slate-800 text-sm">{activeChat.user.name}</h3>
                             <p className="text-xs text-green-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                {t('chat_active', lang)}
                             </p>
                         </div>
                    </div>
                    <div className="flex gap-4 text-slate-400">
                        <button className="hover:text-slate-600"><Phone size={20} /></button>
                        <button className="hover:text-slate-600"><Video size={20} /></button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col">
                    <div className="text-center text-xs text-slate-400 my-4">Nov 30, 2023, 9:41 AM</div>
                    
                    {activeChat.messages.map((msg) => {
                        if (msg.type === 'system') {
                            return (
                                <div key={msg.id} className="flex justify-center my-4">
                                    <div className="bg-green-50 text-green-800 px-3 py-1 rounded text-xs font-medium flex items-center gap-2">
                                        <CheckCheck size={12} /> {msg.text}
                                    </div>
                                </div>
                            );
                        }

                        const isMe = msg.senderId === 'me';
                        return (
                            <div key={msg.id} className={`flex gap-3 max-w-[80%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
                                {!isMe && (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-600">
                                        {activeChat.user.name[0]}
                                    </div>
                                )}
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-2 rounded-2xl text-sm ${
                                        isMe 
                                        ? 'bg-black text-white rounded-tr-none' 
                                        : 'bg-slate-100 text-slate-800 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                                        {isMe && msg.status === 'read' && <CheckCheck size={12} className="text-blue-500" />}
                                        {isMe && msg.status === 'sent' && <Check size={12} />}
                                        <span>{msg.timestamp}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-100">
                    <div className="relative flex items-center gap-2">
                        <input 
                            type="text" 
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-full py-2.5 pl-4 pr-12 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all"
                            placeholder={t('chat_type_message', lang)}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <div className="absolute right-14 flex gap-2 text-slate-400">
                             <button className="hover:text-slate-600"><ImageIcon size={18} /></button>
                             <button className="hover:text-slate-600"><Smile size={18} /></button>
                        </div>
                        <button 
                            onClick={handleSendMessage}
                            className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-colors shadow-md"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR: Profile */}
            <div className="w-72 border-l border-slate-100 bg-white p-6 hidden xl:block">
                 <div className="flex flex-col items-center mb-8">
                     <div className="w-20 h-20 rounded-full bg-slate-200 mb-4 overflow-hidden">
                        <img 
                            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150" 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                        />
                     </div>
                     <h3 className="font-bold text-lg text-slate-800">{activeChat.user.name}</h3>
                     <p className="text-sm text-slate-400">{t('chat_active', lang)}</p>
                 </div>
                 
                 <button className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium mb-6 hover:bg-slate-800 transition-colors">
                     {t('chat_view_profile', lang)}
                 </button>

                 <div className="space-y-4">
                     <div className="flex items-center gap-3 text-slate-600 text-sm cursor-pointer hover:text-blue-600">
                         <Search size={18} />
                         {t('chat_search_history', lang)}
                     </div>
                     <div className="flex items-center gap-3 text-slate-600 text-sm cursor-pointer hover:text-blue-600">
                         <ImageIcon size={18} />
                         Sent images
                     </div>
                      <div className="flex items-center gap-3 text-slate-600 text-sm cursor-pointer hover:text-blue-600">
                         <MoreHorizontal size={18} />
                         More options
                     </div>
                 </div>
            </div>
        </div>
    );
};
