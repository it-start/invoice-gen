
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Phone, Video, Send, Smile, Image as ImageIcon, CheckCheck, Check, ArrowLeft, Car, Play, Clock, Target, CircleDashed, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
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
        icon: <Check size={12} strokeWidth={3} />,
        label: 'Completed'
    },
    overdue: {
        bg: 'bg-red-100',
        text: 'text-red-600',
        icon: <Clock size={12} />,
        label: 'Overdue'
    },
    confirmed: {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
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
        text: 'text-indigo-600',
        icon: <CheckCheck size={12} />,
        label: 'Confirmation by Owner'
    },
    confirmation_rider: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        icon: <Check size={12} />,
        label: 'Confirmation by Rider'
    }
};

interface ChatLayoutProps {
    leaseData: LeaseData;
    lang: Language;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ leaseData, lang }) => {
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const { id: routeId } = useParams<{ id: string }>(); // Get ID from URL
    
    const [mobileView, setMobileView] = useState<'list' | 'room'>('list');
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // --- REFS FOR SCROLLING ---
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevChatIdRef = useRef<string | null>(null);
    const prevMessageCountRef = useRef<number>(0);

    // --- ZUSTAND STORE ---
    const { sessions, activeSessionId, isLoading, sendMessage, leaseContext } = useChatStore();
    
    // Sync mobile view when route changes
    useEffect(() => {
        if (routeId) {
            if (isMobile) setMobileView('room');
        } else {
            setMobileView('list');
        }
    }, [routeId, isMobile]);

    // Determine Active Chat based on Route ID or Store State
    const currentActiveId = routeId || activeSessionId;
    const activeChat = sessions.find((c: ChatSession) => c.id === currentActiveId);
    
    // Determine Active Lease Context
    const isEditingActiveChat = activeChat && activeChat.id === leaseData.id;
    const currentLeaseData = isEditingActiveChat ? leaseData : (leaseContext || leaseData);

    // --- SMART AUTO SCROLL EFFECT ---
    useEffect(() => {
        if (activeChat && messagesEndRef.current) {
            const isChatSwitch = activeChat.id !== prevChatIdRef.current;
            const isNewMessage = activeChat.messages.length > prevMessageCountRef.current;
            
            // Only scroll if switching chats or if a new message arrived
            if (isChatSwitch || isNewMessage) {
                messagesEndRef.current.scrollIntoView({ 
                    behavior: isChatSwitch ? "auto" : "smooth",
                    block: "end"
                });
            }
            
            prevChatIdRef.current = activeChat.id;
            prevMessageCountRef.current = activeChat.messages.length;
        }
    }, [activeChat?.id, activeChat?.messages.length]);

    const handleChatSelect = (chatId: string) => {
        navigate(`/chat/detail/${chatId}`);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/chat/detail/${searchQuery.trim()}`);
            setSearchQuery('');
        }
    };

    const handleBackToList = () => {
        if (isMobile) {
            setMobileView('list');
        } else {
            navigate('/');
        }
    };

    const handleSend = () => {
        if (!messageInput.trim()) return;
        sendMessage(messageInput);
        setMessageInput('');
    };

    // --- FORMATTERS ---
    const formatTime = (timestamp: number) => {
        if (!timestamp) return '';
        try {
            return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit'
            }).format(new Date(timestamp));
        } catch (e) { return ''; }
    };

    const formatSystemDateTime = (timestamp: number) => {
        if (!timestamp) return '';
        try {
            return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            }).format(new Date(timestamp));
        } catch (e) { return ''; }
    };

    const formatDateSeparator = (timestamp: number) => {
        try {
            return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
                weekday: 'short',
                day: 'numeric', 
                month: 'long'
            }).format(new Date(timestamp));
        } catch (e) { return ''; }
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
                            className={`p-4 flex gap-3 cursor-pointer transition-colors border-b border-slate-50 hover:bg-slate-100 ${currentActiveId === chat.id && !isMobile ? 'bg-white shadow-sm' : ''}`}
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
                                    <span className="text-xs text-slate-400">
                                        {chat.lastMessageTime > 0 ? formatTime(chat.lastMessageTime) : ''}
                                    </span>
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
                <div className="h-16 border-b border-slate-100 flex justify-between items-center px-4 md:px-6 shrink-0 bg-white z-10">
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
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between items-center shadow-sm shrink-0 z-10">
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
                <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 flex flex-col dark-scrollbar bg-white">
                    
                    {activeChat.messages.map((msg: ChatMessage, index: number) => {
                        // Date Separator Logic
                        const prevMsg = index > 0 ? activeChat.messages[index - 1] : null;
                        const isDifferentDay = !prevMsg || new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();

                        return (
                            <React.Fragment key={msg.id}>
                                {isDifferentDay && (
                                    <div className="flex justify-center my-6">
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                                            {formatDateSeparator(msg.timestamp)}
                                        </span>
                                    </div>
                                )}

                                {/* SYSTEM MESSAGE RENDERER */}
                                {msg.type === 'system' ? (() => {
                                    const status = msg.metadata?.status;
                                    const style = status ? STATUS_CONFIG[status] : { bg: 'bg-slate-100', text: 'text-slate-600', icon: <CheckCheck size={12} />, label: 'System' };
                                    
                                    if (!style) return null;

                                    return (
                                        <div className="flex flex-col gap-1 my-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 flex-shrink-0 flex justify-center">
                                                    <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                                                        <Check size={12} />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-start max-w-[90%]">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <div className={`${style.bg} ${style.text} px-2.5 py-0.5 rounded-md text-xs font-bold flex items-center gap-1.5 border border-black/5`}>
                                                            {style.icon}
                                                            {style.label}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            {formatSystemDateTime(msg.timestamp)}
                                                        </span>
                                                    </div>
                                                    {msg.text && <p className="text-xs text-slate-600 pl-1 italic">{msg.text}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    /* NORMAL MESSAGE RENDERER */
                                    (() => {
                                        const isMe = msg.senderId === 'me';
                                        return (
                                            <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] animate-in fade-in slide-in-from-bottom-2 duration-200 ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
                                                {!isMe && (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
                                                        {activeChat.user.name[0]}
                                                    </div>
                                                )}
                                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className={`px-4 py-2.5 shadow-sm text-sm leading-relaxed ${
                                                        isMe 
                                                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                                                        : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm'
                                                    }`}>
                                                        {msg.text}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-400 font-medium select-none">
                                                        {isMe && msg.status === 'read' && <CheckCheck size={13} className="text-blue-500" />}
                                                        {isMe && msg.status === 'sent' && <Check size={13} />}
                                                        <span>{formatTime(msg.timestamp)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()
                                )}
                            </React.Fragment>
                        );
                    })}
                    {/* Dummy div for auto-scrolling anchor */}
                    <div ref={messagesEndRef} className="h-2" />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-100 shrink-0 bg-white">
                    <div className="relative flex items-center gap-2">
                        <input 
                            type="text" 
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-full py-3 pl-5 pr-12 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all placeholder:text-slate-400"
                            placeholder={t('chat_type_message', lang)}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <div className="absolute right-14 flex gap-2 text-slate-400">
                             <button className="hover:text-blue-600 transition-colors hidden sm:block p-1"><ImageIcon size={20} /></button>
                             <button className="hover:text-blue-600 transition-colors p-1"><Smile size={20} /></button>
                        </div>
                        <button 
                            onClick={handleSend}
                            disabled={!messageInput.trim()}
                            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-all shadow-md flex-shrink-0 disabled:opacity-50 disabled:shadow-none active:scale-95"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
            ) : (
                <div className={`${roomClasses} items-center justify-center flex-col gap-4 text-slate-400 bg-slate-50/50`}>
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
                        <Smile size={32} />
                    </div>
                    <div className="text-sm font-medium">Select a chat or search by ID to start</div>
                </div>
            )}

            {/* RIGHT SIDEBAR: Profile */}
            {activeChat && (
            <div className="w-72 border-l border-slate-100 bg-white p-6 hidden xl:flex flex-col h-full overflow-y-auto">
                 <div className="flex flex-col items-center mb-8">
                     <div className="w-24 h-24 rounded-full bg-slate-100 mb-4 overflow-hidden flex items-center justify-center font-bold text-3xl text-slate-400 border-4 border-slate-50 shadow-sm">
                        {activeChat.user.avatar ? (
                            <img src={activeChat.user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : activeChat.user.name[0]}
                     </div>
                     <h3 className="font-bold text-xl text-slate-800 mb-1 text-center">{activeChat.user.name}</h3>
                     <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">
                        {t('chat_active', lang)}
                     </span>
                     
                     {/* Lease Context Info */}
                     <div className="w-full bg-slate-50 rounded-xl p-4 mt-6 border border-slate-100">
                         <div className="flex justify-between text-xs mb-2 border-b border-slate-200 pb-2">
                             <span className="text-slate-500 font-medium">Role</span>
                             <span className="font-bold text-slate-700">{activeChat.user.role}</span>
                         </div>
                         {activeChat.user.contact && (
                             <div className="flex justify-between text-xs mb-2 border-b border-slate-200 pb-2">
                                 <span className="text-slate-500 font-medium">Contact</span>
                                 <span className="font-bold text-slate-700 truncate max-w-[120px]" title={activeChat.user.contact}>{activeChat.user.contact}</span>
                             </div>
                         )}
                          <div className="flex justify-between text-xs">
                             <span className="text-slate-500 font-medium">Ref ID</span>
                             <span className="font-mono font-bold text-slate-700">{currentLeaseData.reservationId}</span>
                         </div>
                     </div>
                 </div>
                 
                 <button className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold mb-6 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                     {t('chat_view_profile', lang)}
                 </button>

                 <div className="space-y-1">
                     <button className="w-full flex items-center gap-3 text-slate-600 text-sm p-3 hover:bg-slate-50 rounded-lg transition-colors font-medium">
                         <Search size={18} className="text-slate-400" />
                         {t('chat_search_history', lang)}
                     </button>
                     <button className="w-full flex items-center gap-3 text-slate-600 text-sm p-3 hover:bg-slate-50 rounded-lg transition-colors font-medium">
                         <ImageIcon size={18} className="text-slate-400" />
                         Shared media
                     </button>
                      <button className="w-full flex items-center gap-3 text-slate-600 text-sm p-3 hover:bg-slate-50 rounded-lg transition-colors font-medium">
                         <Target size={18} className="text-slate-400" />
                         Lease details
                     </button>
                 </div>
            </div>
            )}
        </div>
    );
};
