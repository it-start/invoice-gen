

import React, { useState, useMemo } from 'react';
import { Search, MoreHorizontal, Phone, Video, Send, Smile, Image as ImageIcon, CheckCheck, Check, ArrowLeft, Car, Play, AlertCircle, Clock, CheckCircle2, Target, CircleDashed } from 'lucide-react';
import { ChatSession, LeaseData, Language, ChatMessage, NtfyMessage, LeaseStatus } from '../../types';
import { t } from '../../utils/i18n';
import { useIsMobile } from '../../hooks/useIsMobile';

// --- STATUS CONFIGURATION ---
const STATUS_CONFIG: Record<LeaseStatus, { bg: string, text: string, icon: React.ReactNode, label: string }> = {
    collected: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: <Play size={12} fill="currentColor" />,
        label: 'Collected'
    },
    completed: {
        bg: 'bg-slate-200',
        text: 'text-slate-600',
        icon: <Check size={12} strokeWidth={4} />,
        label: 'Completed'
    },
    overdue: {
        bg: 'bg-red-100',
        text: 'text-red-600',
        icon: <Clock size={12} />,
        label: 'Overdue'
    },
    confirmed: {
        bg: 'bg-indigo-100',
        text: 'text-indigo-600',
        icon: <Target size={12} />,
        label: 'Confirmed'
    },
    pending: {
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        icon: <CircleDashed size={12} />,
        label: 'Pending'
    },
    confirmation_owner: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-500',
        icon: <CheckCheck size={12} />,
        label: 'Confirmation by Owner'
    },
    confirmation_rider: {
        bg: 'bg-purple-50',
        text: 'text-purple-500',
        icon: <CheckCheck size={12} />,
        label: 'Confirmation by Rider'
    }
};

// --- MOCK NTFY DATA ---
const RAW_NTFY_DATA: NtfyMessage[] = [
    {
        id: 'msg_1',
        time: 1701336600, 
        event: 'message',
        topic: 'lease-chat-renter',
        message: 'Oh?',
        title: 'Helena Hills',
        tags: ['read'],
        priority: 3
    },
    {
        id: 'msg_2',
        time: 1701336660, 
        event: 'message',
        topic: 'lease-chat-renter',
        message: 'Cool',
        title: 'Helena Hills',
        tags: ['read']
    },
    {
        id: 'msg_3',
        time: 1701337260, 
        event: 'message',
        topic: 'lease-chat-renter',
        message: 'How does it work?',
        title: 'Me',
        tags: ['read']
    },
    // Mocking a previous status event in the chat history
    {
        id: 'msg_4',
        time: 1701337500,
        event: 'message',
        topic: 'lease-chat-renter',
        message: 'Deal is confirmed. Dates booked',
        title: 'System',
        tags: ['system', 'status:confirmed']
    },
    {
        id: 'msg_5',
        time: 1701337800, 
        event: 'message',
        topic: 'lease-chat-renter',
        message: 'You just edit any text to type in the conversation you want to show, and delete any bubbles you don\'t want to use',
        title: 'Me',
        tags: ['read']
    },
    {
        id: 'msg_6',
        time: 1701337860, 
        event: 'message',
        topic: 'lease-chat-renter',
        message: 'Boom!',
        title: 'Helena Hills',
        tags: ['read']
    },
    {
        id: 'msg_7',
        time: 1701250000,
        event: 'message',
        topic: 'lease-chat-support',
        message: 'Let\'s go',
        title: 'Carlo Emilio',
        tags: ['sent']
    },
    {
        id: 'msg_8',
        time: 1701000000,
        event: 'message',
        topic: 'lease-chat-owner',
        message: 'Trueeeeee',
        title: 'Oscar Davis',
        tags: ['sent']
    }
];

// --- MAPPING LOGIC ---

const ntfyToChatMessage = (ntfy: NtfyMessage): ChatMessage => {
    let senderId = 'other';
    if (ntfy.title === 'Me') senderId = 'me';
    else if (ntfy.title === 'System' || ntfy.tags?.includes('system')) senderId = 'system';

    let type: any = 'text';
    let statusMetadata: LeaseStatus | undefined = undefined;

    if (ntfy.tags?.includes('system')) {
        type = 'system';
        // Extract status from tags like "status:collected"
        const statusTag = ntfy.tags?.find(t => t.startsWith('status:'));
        if (statusTag) {
            statusMetadata = statusTag.split(':')[1] as LeaseStatus;
        }
    }
    
    const date = new Date(ntfy.time * 1000);
    const timestamp = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    return {
        id: ntfy.id,
        senderId,
        text: ntfy.message,
        timestamp,
        type,
        status: ntfy.tags?.includes('read') ? 'read' : 'sent',
        metadata: {
            status: statusMetadata
        }
    };
};

const hydrateSessionsFromNtfy = (leaseData: LeaseData): ChatSession[] => {
    const sessions: Record<string, ChatSession> = {
        'lease-chat-renter': {
            id: 'lease-chat-renter',
            user: { 
                id: 'r1', 
                name: leaseData.renter.surname || 'Renter', 
                contact: leaseData.renter.contact,
                avatar: '', 
                status: 'online', 
                role: 'Renter' 
            },
            messages: [],
            lastMessage: '',
            lastMessageTime: '',
            unreadCount: 0
        },
        'lease-chat-support': {
             id: 'lease-chat-support',
             user: { 
                 id: 's1', 
                 name: 'Carlo Emilio', 
                 contact: '+66 123 456 789',
                 avatar: '', 
                 status: 'busy', 
                 role: 'Support' 
            },
             messages: [],
             lastMessage: '',
             lastMessageTime: '',
             unreadCount: 0
        },
        'lease-chat-owner': {
             id: 'lease-chat-owner',
             user: { 
                 id: 'o1', 
                 name: 'Oscar Davis', 
                 contact: leaseData.owner.contact,
                 avatar: '', 
                 status: 'offline', 
                 role: 'Owner' 
            },
             messages: [],
             lastMessage: '',
             lastMessageTime: '',
             unreadCount: 0
        }
    };

    const sorted = [...RAW_NTFY_DATA].sort((a, b) => a.time - b.time);

    sorted.forEach(ntfy => {
        if (sessions[ntfy.topic]) {
            const msg = ntfyToChatMessage(ntfy);
            sessions[ntfy.topic].messages.push(msg);
            sessions[ntfy.topic].lastMessage = msg.text;
            sessions[ntfy.topic].lastMessageTime = msg.timestamp;
            if (msg.senderId === 'other' && msg.status !== 'read') {
                 sessions[ntfy.topic].unreadCount += 1;
            }
        }
    });

    // --- INJECT DYNAMIC SYSTEM MESSAGE WITH LEASE INFO ---
    if (sessions['lease-chat-renter']) {
        const vehicleName = leaseData.vehicle.name || 'Vehicle';
        // This simulates the "Collected" status message from the screenshot
        const systemMsg: ChatMessage = {
            id: 'sys-lease-status',
            senderId: 'system',
            text: `${vehicleName} is in use by Rider`,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            type: 'system',
            status: 'read',
            metadata: {
                status: 'collected'
            }
        };
        const msgs = sessions['lease-chat-renter'].messages;
        if (msgs.length > 2) {
            msgs.splice(msgs.length - 2, 0, systemMsg);
        } else {
            msgs.push(systemMsg);
        }
    }

    return Object.values(sessions);
};


interface ChatLayoutProps {
    leaseData: LeaseData;
    lang: Language;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ leaseData, lang }) => {
    const isMobile = useIsMobile();
    const [mobileView, setMobileView] = useState<'list' | 'room'>('list');

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
                <div className="flex-1 overflow-y-auto custom-scrollbar">
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
                <div className="h-16 border-b border-slate-100 flex justify-between items-center px-4 md:px-6 shrink-0">
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

                {/* Reservation Summary Pinned Bar */}
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between items-center shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="bg-white p-2 rounded-lg border border-slate-200 text-blue-600">
                             <Car size={18} />
                         </div>
                         <div>
                             <h4 className="text-sm font-bold text-slate-800">{leaseData.vehicle.name}</h4>
                             <div className="flex items-center gap-2 text-xs text-slate-500">
                                 <span className="bg-slate-200 px-1.5 rounded text-slate-600 font-mono">{leaseData.vehicle.plate}</span>
                                 <span>•</span>
                                 <span>{leaseData.pickup.date} - {leaseData.dropoff.date}</span>
                             </div>
                         </div>
                    </div>
                    <div className="text-right">
                         <span className="block text-sm font-bold text-slate-800">{leaseData.pricing.total} THB</span>
                         <span className="block text-[10px] text-slate-400">#{leaseData.reservationId}</span>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 flex flex-col dark-scrollbar">
                    <div className="text-center text-xs text-slate-400 my-4">Today</div>
                    
                    {activeChat.messages.map((msg) => {
                        // --- SYSTEM MESSAGE RENDERER ---
                        if (msg.type === 'system') {
                            const status = msg.metadata?.status;
                            // Default styling if no specific status is found
                            const style = status ? STATUS_CONFIG[status] : { bg: 'bg-slate-100', text: 'text-slate-600', icon: <CheckCheck size={12} />, label: 'System' };
                            
                            return (
                                <div key={msg.id} className="flex flex-col gap-1 my-2">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 flex-shrink-0 flex justify-center">
                                            {/* Optional: Checkmark icon next to system messages to align with screenshot style */}
                                            <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                                                <Check size={10} />
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-start max-w-[85%]">
                                            <div className={`${style.bg} ${style.text} px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 mb-1`}>
                                                {style.icon}
                                                {style.label}
                                            </div>
                                            <p className="text-xs text-slate-500 pl-1">{msg.text}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // --- NORMAL MESSAGE RENDERER ---
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
                <div className="p-4 border-t border-slate-100 shrink-0">
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
                     <div className="w-20 h-20 rounded-full bg-slate-200 mb-4 overflow-hidden flex items-center justify-center font-bold text-2xl text-slate-500">
                        {activeChat.user.avatar ? (
                            <img src={activeChat.user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : activeChat.user.name[0]}
                     </div>
                     <h3 className="font-bold text-lg text-slate-800">{activeChat.user.name}</h3>
                     <p className="text-sm text-slate-400 mb-2">{t('chat_active', lang)}</p>
                     
                     {/* Lease Context Info */}
                     <div className="w-full bg-slate-50 rounded-lg p-3 mb-6">
                         <div className="flex justify-between text-xs mb-1">
                             <span className="text-slate-500">Role</span>
                             <span className="font-medium">{activeChat.user.role}</span>
                         </div>
                         {activeChat.user.contact && (
                             <div className="flex justify-between text-xs mb-1">
                                 <span className="text-slate-500">Contact</span>
                                 <span className="font-medium truncate max-w-[120px]" title={activeChat.user.contact}>{activeChat.user.contact}</span>
                             </div>
                         )}
                          <div className="flex justify-between text-xs">
                             <span className="text-slate-500">Ref</span>
                             <span className="font-medium">{leaseData.reservationId}</span>
                         </div>
                     </div>
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