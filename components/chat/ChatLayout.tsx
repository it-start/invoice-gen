
import React, { useState, useEffect } from 'react';
import { Search, MoreHorizontal, Phone, Video, Send, Smile, Image as ImageIcon, CheckCheck, Check, ArrowLeft, Car, Play, Clock, Target, CircleDashed, Loader2 } from 'lucide-react';
import { LeaseData, Language, LeaseStatus, ChatSession, ChatMessage } from '../../types';
import { t } from '../../utils/i18n';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useChatStore } from '../../stores/chatStore';

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

interface ChatLayoutProps {
    leaseData: LeaseData;
    lang: Language;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ leaseData, lang }) => {
    const isMobile = useIsMobile();
    const [mobileView, setMobileView] = useState<'list' | 'room'>('list');
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // --- ZUSTAND STORE ---
    const { sessions, activeSessionId, isLoading, setActiveSession, sendMessage, loadChatSession, leaseContext } = useChatStore();
    
    // Auto-load session if leaseData has ID and we haven't loaded it yet
    useEffect(() => {
        if (leaseData.reservationId && !sessions.find(s => s.id === leaseData.reservationId)) {
            // Avoid auto-loading if it's the default placeholder ID unless explicit
            if (leaseData.reservationId !== '9048') {
                 loadChatSession(leaseData.reservationId);
            }
        }
    }, [leaseData.reservationId, loadChatSession, sessions]);

    const activeChat = sessions.find((c: ChatSession) => c.id === activeSessionId);
    
    // DETERMINE ACTIVE LEASE CONTEXT FOR DISPLAY
    // If the currently edited lease (from EditorPage props) matches the active chat ID,
    // we use the 'leaseData' prop because it contains the latest local edits from the form.
    // Otherwise, we use the 'leaseContext' from the store (raw API data) for viewing other chats.
    const isEditingActiveChat = activeChat && activeChat.id === leaseData.reservationId;
    const currentLeaseData = isEditingActiveChat ? leaseData : (leaseContext || leaseData);

    const handleChatSelect = (chatId: string) => {
        setActiveSession(chatId);
        if (isMobile) {
            setMobileView('room');
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            loadChatSession(searchQuery.trim());
            setSearchQuery('');
        }
    };

    const handleBackToList = () => {
        setMobileView('list');
    };

    const handleSend = () => {
        if (!messageInput.trim()) return;
        sendMessage(messageInput);
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
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Enter Reservation ID..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoading && sessions.length === 0 && (
                        <div className="p-8 flex justify-center text-slate-400">
                            <Loader2 className="animate-spin" />
                        </div>
                    )}
                    
                    {sessions.length === 0 && !isLoading && (
                        <div className="p-8 text-center text-xs text-slate-400">
                            No active chats.<br/>Search by ID to load.
                        </div>
                    )}

                    {sessions.map((chat: ChatSession) => (
                        <div 
                            key={chat.id}
                            onClick={() => handleChatSelect(chat.id)}
                            className={`p-4 flex gap-3 cursor-pointer transition-colors border-b border-slate-50 hover:bg-slate-100 ${activeSessionId === chat.id && !isMobile ? 'bg-white shadow-sm' : ''}`}
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
            {activeChat ? (
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
                             <h4 className="text-sm font-bold text-slate-800">{currentLeaseData.vehicle.name}</h4>
                             <div className="flex items-center gap-2 text-xs text-slate-500">
                                 <span className="bg-slate-200 px-1.5 rounded text-slate-600 font-mono">{currentLeaseData.vehicle.plate}</span>
                                 <span>•</span>
                                 <span>{currentLeaseData.pickup.date} - {currentLeaseData.dropoff.date}</span>
                             </div>
                         </div>
                    </div>
                    <div className="text-right">
                         <span className="block text-sm font-bold text-slate-800">{currentLeaseData.pricing.total} THB</span>
                         <span className="block text-[10px] text-slate-400">#{currentLeaseData.reservationId}</span>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 flex flex-col dark-scrollbar">
                    <div className="text-center text-xs text-slate-400 my-4">History</div>
                    
                    {activeChat.messages.map((msg: ChatMessage) => {
                        // --- SYSTEM MESSAGE RENDERER ---
                        if (msg.type === 'system') {
                            const status = msg.metadata?.status;
                            const style = status ? STATUS_CONFIG[status] : { bg: 'bg-slate-100', text: 'text-slate-600', icon: <CheckCheck size={12} />, label: 'System' };
                            
                            // Fallback if status config missing
                            if (!style) return null; 

                            return (
                                <div key={msg.id} className="flex flex-col gap-1 my-2">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 flex-shrink-0 flex justify-center">
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
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <div className="absolute right-14 flex gap-2 text-slate-400">
                             <button className="hover:text-slate-600 hidden sm:block"><ImageIcon size={18} /></button>
                             <button className="hover:text-slate-600"><Smile size={18} /></button>
                        </div>
                        <button 
                            onClick={handleSend}
                            className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-colors shadow-md flex-shrink-0"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
            ) : (
                <div className={`${roomClasses} items-center justify-center text-slate-400 text-sm`}>
                    Select a chat or search by ID
                </div>
            )}

            {/* RIGHT SIDEBAR: Profile */}
            {activeChat && (
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
                             <span className="font-medium">{currentLeaseData.reservationId}</span>
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
            )}
        </div>
    );
};
