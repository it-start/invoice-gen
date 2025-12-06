
import React, { useState, useMemo } from 'react';
import { Search, MoreHorizontal, Phone, Video, Send, Smile, Image as ImageIcon, CheckCheck, Check, ArrowLeft } from 'lucide-react';
import { ChatSession, LeaseData, Language, ChatMessage, NtfyMessage } from '../../types';
import { t } from '../../utils/i18n';
import { useIsMobile } from '../../hooks/useIsMobile';

// --- MOCK NTFY DATA ---
// This follows the ntfy.sh JSON message format strictly.
// We use 'topic' to group messages into chat sessions.
const RAW_NTFY_DATA: NtfyMessage[] = [
    // Chat 1: Renter (Helena Hills)
    // Topic: lease-{reservationId}-renter
    {
        id: 'msg_1',
        time: 1701336600, // 09:30 AM
        event: 'message',
        topic: 'lease-chat-renter',
        message: 'Oh?',
        title: 'Helena Hills',
        tags: ['read'],
        priority: 3
    },
    {
        id: 'msg_2',
        time: 1701336660, // 09:31 AM
        event: 'message',
        topic: 'lease-chat-renter',
        message: 'Cool',
        title: 'Helena Hills',
        tags: ['read']
    },
    {
        id: 'msg_3',
        time: 1701337260, // 09:41 AM
        event: 'message',
        topic: 'lease-chat-renter',
        message: 'How does it work?',
        title: 'Me', // 'Me' title indicates sent by current user
        tags: ['read']
    },
    {
        id: 'msg_4',
        time: 1701337500, // 09:45 AM
        event: 'message',
        topic: 'lease-chat-renter',
        message: 'Vehicle is in use by Rider',
        title: 'System',
        tags: ['system', 'read']
    },
    {
        id: 'msg_5',
        time: 1701337800, // 09:50 AM
        event: 'message',
        topic: 'lease-chat-renter',
        message: 'You just edit any text to type in the conversation you want to show, and delete any bubbles you don\'t want to use',
        title: 'Me',
        tags: ['read']
    },
    {
        id: 'msg_6',
        time: 1701337860, // 09:51 AM
        event: 'message',
        topic: 'lease-chat-renter',
        message: 'Boom!',
        title: 'Helena Hills',
        tags: ['read']
    },

    // Chat 2: Support (Carlo)
    {
        id: 'msg_7',
        time: 1701250000, // Yesterday
        event: 'message',
        topic: 'lease-chat-support',
        message: 'Let\'s go',
        title: 'Carlo Emilio',
        tags: ['sent']
    },

    // Chat 3: Owner (Oscar)
    {
        id: 'msg_8',
        time: 1701000000, // Mon
        event: 'message',
        topic: 'lease-chat-owner',
        message: 'Trueeeeee',
        title: 'Oscar Davis',
        tags: ['sent']
    }
];

// --- MAPPING LOGIC ---

const ntfyToChatMessage = (ntfy: NtfyMessage): ChatMessage => {
    // Determine sender type based on Title or Tags
    let senderId = 'other';
    if (ntfy.title === 'Me') senderId = 'me';
    else if (ntfy.title === 'System' || ntfy.tags?.includes('system')) senderId = 'system';

    // Determine type
    let type: any = 'text';
    if (ntfy.tags?.includes('system')) type = 'system';
    
    // Format Timestamp
    const date = new Date(ntfy.time * 1000);
    const timestamp = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    return {
        id: ntfy.id,
        senderId,
        text: ntfy.message,
        timestamp,
        type,
        status: ntfy.tags?.includes('read') ? 'read' : 'sent'
    };
};

const hydrateSessionsFromNtfy = (leaseData: LeaseData): ChatSession[] => {
    // Group raw ntfy messages by topic
    const sessions: Record<string, ChatSession> = {
        'lease-chat-renter': {
            id: 'lease-chat-renter',
            user: { id: 'r1', name: leaseData.renter.surname || 'Renter', avatar: '', status: 'online', role: 'Renter' },
            messages: [],
            lastMessage: '',
            lastMessageTime: '',
            unreadCount: 0
        },
        'lease-chat-support': {
             id: 'lease-chat-support',
             user: { id: 's1', name: 'Carlo Emilio', avatar: '', status: 'busy', role: 'Support' },
             messages: [],
             lastMessage: '',
             lastMessageTime: '',
             unreadCount: 0
        },
        'lease-chat-owner': {
             id: 'lease-chat-owner',
             user: { id: 'o1', name: 'Oscar Davis', avatar: '', status: 'offline', role: 'Owner' },
             messages: [],
             lastMessage: '',
             lastMessageTime: '',
             unreadCount: 0
        }
    };

    // Sort by time first
    const sorted = [...RAW_NTFY_DATA].sort((a, b) => a.time - b.time);

    // Populate sessions
    sorted.forEach(ntfy => {
        if (sessions[ntfy.topic]) {
            const msg = ntfyToChatMessage(ntfy);
            sessions[ntfy.topic].messages.push(msg);
            sessions[ntfy.topic].lastMessage = msg.text;
            sessions[ntfy.topic].lastMessageTime = msg.timestamp;
            // Simple unread logic for mock: if last msg from other and not read
            if (msg.senderId === 'other' && msg.status !== 'read') {
                 sessions[ntfy.topic].unreadCount += 1;
            }
        }
    });

    return Object.values(sessions);
};


interface ChatLayoutProps {
    leaseData: LeaseData;
    lang: Language;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ leaseData, lang }) => {
    const isMobile = useIsMobile();
    const [mobileView, setMobileView] = useState<'list' | 'room'>('list');

    // Initialize sessions from Ntfy Mock Data
    const initialSessions = useMemo(() => hydrateSessionsFromNtfy(leaseData), [leaseData]);
    const [chats, setChats] = useState<ChatSession[]>(initialSessions);
    const [activeChatId, setActiveChatId] = useState<string>('lease-chat-renter');
    const [messageInput, setMessageInput] = useState('');

    const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

    const handleChatSelect = (chatId: string) => {
        setActiveChatId(chatId);
        if (isMobile) {
            setMobileView('room');
        }
    };

    const handleBackToList = () => {
        setMobileView('list');
    };

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;
        
        // In a real app, this would POST to ntfy
        const newMsg: ChatMessage = {
            id: Math.random().toString(),
            senderId: 'me',
            text: messageInput,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            type: 'text',
            status: 'sent'
        };

        setChats(prev => prev.map(c => {
            if (c.id === activeChatId) {
                return {
                    ...c,
                    messages: [...c.messages, newMsg],
                    lastMessage: messageInput,
                    lastMessageTime: 'Just now'
                };
            }
            return c;
        }));

        setMessageInput('');
    };

    // Determine layout visibility classes based on mobile state
    const listClasses = isMobile 
        ? (mobileView === 'list' ? 'w-full flex' : 'hidden') 
        : 'w-80 border-r border-slate-100 flex';
        
    const roomClasses = isMobile 
        ? (mobileView === 'room' ? 'flex w-full' : 'hidden') 
        : 'flex-1 flex';

    return (
        <div className="flex h-full bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            
            {/* LEFT SIDEBAR: Chat List */}
            <div className={`${listClasses} flex-col bg-slate-50`}>
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
                            onClick={() => handleChatSelect(chat.id)}
                            className={`p-4 flex gap-3 cursor-pointer transition-colors border-b border-slate-50 hover:bg-slate-100 ${activeChatId === chat.id && !isMobile ? 'bg-white shadow-sm' : ''}`}
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
            <div className={`${roomClasses} flex-col bg-white`}>
                {/* Header */}
                <div className="h-16 border-b border-slate-100 flex justify-between items-center px-4 md:px-6">
                    <div className="flex items-center gap-3">
                         {isMobile && (
                            <button onClick={handleBackToList} className="-ml-2 p-2 hover:bg-slate-100 rounded-full text-slate-600">
                                <ArrowLeft size={20} />
                            </button>
                         )}
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
                <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 flex flex-col">
                    <div className="text-center text-xs text-slate-400 my-4">Nov 30, 2023</div>
                    
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
                            <div key={msg.id} className={`flex gap-3 max-w-[85%] md:max-w-[80%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
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
                             <button className="hover:text-slate-600 hidden sm:block"><ImageIcon size={18} /></button>
                             <button className="hover:text-slate-600"><Smile size={18} /></button>
                        </div>
                        <button 
                            onClick={handleSendMessage}
                            className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-colors shadow-md flex-shrink-0"
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
