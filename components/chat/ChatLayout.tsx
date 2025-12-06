
import React, { useState, useEffect, useRef } from 'react';
import { Search, Phone, Video, Send, Smile, Image as ImageIcon, CheckCheck, Check, ArrowLeft, Car, Play, Clock, Target, CircleDashed, Loader2, User as UserIcon, FileEdit, ThumbsUp, ThumbsDown, X, MoreVertical, PanelRightClose, PanelRightOpen, BadgeCheck, Wrench, Ban, AlertTriangle, HelpCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { LeaseData, Language, LeaseStatus, ChatSession, ChatMessage } from '../../types';
import { t } from '../../utils/i18n';
import { humanizeTime, formatShortDate } from '../../utils/dateUtils';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useChatStore } from '../../stores/chatStore';
import LeaseForm from '../forms/LeaseForm';
import InputGroup from '../ui/InputGroup';

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
        label: 'Conf. by Owner'
    },
    confirmation_rider: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        icon: <Check size={12} />,
        label: 'Conf. by Rider'
    },
    rejected: {
        bg: 'bg-red-50',
        text: 'text-red-600',
        icon: <X size={12} />,
        label: 'Rejected'
    },
    // New Statuses mapping
    maintenance: {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        icon: <Wrench size={12} />,
        label: 'Maintenance'
    },
    cancelled: {
        bg: 'bg-red-50',
        text: 'text-red-600',
        icon: <Ban size={12} />,
        label: 'Cancelled'
    },
    conflict: {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        icon: <AlertTriangle size={12} />,
        label: 'Conflict'
    },
    no_response: {
        bg: 'bg-slate-100',
        text: 'text-slate-500',
        icon: <HelpCircle size={12} />,
        label: 'No Response'
    }
};

interface ChatLayoutProps {
    leaseData: LeaseData;
    lang: Language;
    leaseHandlers: any;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ leaseData, lang, leaseHandlers }) => {
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const { id: routeId } = useParams<{ id: string }>(); // Get ID from URL
    
    const [mobileView, setMobileView] = useState<'list' | 'room'>('list');
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarTab, setSidebarTab] = useState<'profile' | 'details'>('details');
    
    // Sidebar Collapse State with Persistence
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('chat_sidebar_open');
            return saved !== null ? JSON.parse(saved) : true;
        }
        return true;
    });

    useEffect(() => {
        localStorage.setItem('chat_sidebar_open', JSON.stringify(isSidebarOpen));
    }, [isSidebarOpen]);

    // --- REFS FOR SCROLLING ---
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevChatIdRef = useRef<string | null>(null);
    const prevMessageCountRef = useRef<number>(0);

    // --- ZUSTAND STORE ---
    const { 
        sessions, 
        activeSessionId, 
        isLoading, 
        sendMessage, 
        setActiveSession,
        markMessageAsRead,
        confirmReservation, 
        rejectReservation, 
        leaseContext,
        hydrate,
        isHydrated
    } = useChatStore();

    // Hydrate store on mount
    useEffect(() => {
        if (!isHydrated) {
            hydrate();
        }
    }, [isHydrated, hydrate]);
    
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

    // --- READ RECEIPT / VISIBILITY OBSERVER ---
    useEffect(() => {
        if (!activeChat) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target as HTMLElement;
                    const id = el.dataset.id;
                    const status = el.dataset.status;
                    const sender = el.dataset.sender;
                    
                    // If message is incoming (sender !== 'me') and unread (status === 'sent')
                    // Note: 'other' is used for incoming messages in chatStore
                    if (id && status === 'sent' && sender !== 'me' && sender !== 'system') {
                        markMessageAsRead(activeChat.id, id);
                        observer.unobserve(el); // Stop observing once marked
                    }
                }
            });
        }, {
            root: null, // Viewport
            threshold: 0.5 // Trigger when 50% visible
        });

        // Select all message wrappers that are potentially unread
        const elements = document.querySelectorAll('.message-wrapper');
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [activeChat?.id, activeChat?.messages, markMessageAsRead]);

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
        setActiveSession(chatId); // Instant UI feedback
        // If we are already on this route (e.g. user went back via UI state but URL stayed), force view
        if (routeId === chatId && isMobile) {
            setMobileView('room');
        } else {
            navigate(`/chat/detail/${chatId}`);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/chat/detail/${searchQuery.trim()}`);
            setSearchQuery('');
        }
    };

    const handleBackToList = () => {
        // Always navigate to root to clear route params, ensuring subsequent clicks on the same chat trigger a route change or are handled correctly
        navigate('/');
    };

    const handleSend = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
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
        : 'w-80 border-r border-slate-200 flex';
        
    const roomClasses = isMobile 
        ? (mobileView === 'room' ? 'flex w-full' : 'hidden') 
        : 'flex-1 flex';

    return (
        <div className="flex h-full bg-white md:rounded-xl overflow-hidden md:border border-slate-200 md:shadow-sm">
            
            {/* LEFT SIDEBAR: Chat List */}
            <div className={`${listClasses} flex-col bg-slate-50`}>
                <div className="p-4 border-b border-slate-200 bg-white shadow-sm z-10">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">{t('switch_chat', lang)}</h2>
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search ID..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                    {/* Empty State / Loading Initial */}
                    {isLoading && sessions.length === 0 && (
                        <div className="p-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <Loader2 className="animate-spin text-blue-500" />
                            <span className="text-xs">Loading chats...</span>
                        </div>
                    )}
                    
                    {sessions.length === 0 && !isLoading && (
                        <div className="p-8 text-center text-xs text-slate-400 italic">
                            No active chats found.
                        </div>
                    )}

                    {sessions.map((chat: ChatSession) => {
                        const isActive = currentActiveId === chat.id;
                        const statusColor = chat.reservationSummary?.status ? STATUS_CONFIG[chat.reservationSummary.status]?.text : 'text-slate-400';
                        const statusLabel = chat.reservationSummary?.status ? STATUS_CONFIG[chat.reservationSummary.status]?.label : 'Unknown';

                        return (
                            <div 
                                key={chat.id}
                                onClick={() => handleChatSelect(chat.id)}
                                className={`p-3 md:p-4 flex gap-3 cursor-pointer transition-all border-b border-slate-50 group
                                    ${isActive 
                                        ? 'bg-blue-50/50 border-l-4 border-l-blue-500 shadow-inner' 
                                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                                    }`}
                            >
                                <div className="relative shrink-0 self-start">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden transition-all
                                        ${isActive ? 'bg-blue-200 text-blue-700 ring-2 ring-white shadow-md' : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'}`}>
                                        {chat.user.avatar ? <img src={chat.user.avatar} alt={chat.user.name} /> : chat.user.name[0]}
                                    </div>
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border-2 border-white ${chat.user.status === 'online' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-start">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className={`font-bold text-sm truncate ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>{chat.user.name}</h3>
                                        <span className={`text-[10px] font-medium whitespace-nowrap ml-2 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                                            {/* USE HUMANIZED TIME HERE */}
                                            {chat.lastMessageTime > 0 ? humanizeTime(chat.lastMessageTime, lang) : ''}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className={`text-xs truncate max-w-[140px] md:max-w-[140px] ${isActive ? 'text-blue-700 font-medium' : 'text-slate-500 group-hover:text-slate-600'}`}>
                                            {chat.lastMessage}
                                        </p>
                                        {chat.unreadCount > 0 && (
                                            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center shadow-sm">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>

                                    {/* ENHANCED METADATA ROW */}
                                    {chat.reservationSummary && (
                                        <div className="flex items-center gap-2 mt-auto pt-1 border-t border-slate-100/50">
                                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded max-w-[50%]">
                                                <Car size={10} />
                                                <span className="truncate">{chat.reservationSummary.vehicleName}</span>
                                            </div>
                                            <div className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${statusColor}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full bg-current opacity-70`}></span>
                                                {statusLabel}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MIDDLE: Chat Room */}
            {activeChat ? (
            <div className={`${roomClasses} flex-col bg-slate-50/30 relative`}>
                {/* Header */}
                <div className="h-14 md:h-16 border-b border-slate-200 flex justify-between items-center px-3 md:px-6 shrink-0 bg-white shadow-sm z-20">
                    <div className="flex items-center gap-2 md:gap-3">
                         {isMobile && (
                            <button onClick={handleBackToList} className="-ml-2 p-2 hover:bg-slate-100 rounded-full text-slate-600">
                                <ArrowLeft size={20} />
                            </button>
                         )}
                         <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border border-slate-100">
                             {activeChat.user.name[0]}
                         </div>
                         <div>
                             <h3 className="font-bold text-slate-800 text-sm">{activeChat.user.name}</h3>
                             <p className="text-[10px] md:text-xs text-green-600 flex items-center gap-1 font-medium">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                {t('chat_active', lang)}
                             </p>
                         </div>
                    </div>
                    <div className="flex gap-2 text-slate-400 items-center">
                        <button className="hidden md:block p-2 hover:bg-slate-100 rounded-full hover:text-slate-600 transition-colors"><Phone size={18} /></button>
                        <button className="hidden md:block p-2 hover:bg-slate-100 rounded-full hover:text-slate-600 transition-colors"><Video size={18} /></button>
                        
                        {/* SIDEBAR TOGGLE */}
                        <div className="h-6 w-px bg-slate-200 mx-1 hidden xl:block"></div>
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`p-2 rounded-full transition-colors hidden xl:block ${isSidebarOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 hover:text-slate-600'}`}
                            title="Toggle Details"
                        >
                            {isSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                        </button>

                        <button className="p-2 hover:bg-slate-100 rounded-full hover:text-slate-600 transition-colors xl:hidden"><MoreVertical size={18} /></button>
                    </div>
                </div>

                {/* Reservation Summary Pinned Bar (Optimized for Mobile) */}
                <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-3 md:px-4 py-2 md:py-3 flex justify-between items-center shadow-sm shrink-0 z-10 sticky top-0">
                    <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                         {/* Hide Icon on Mobile to save space */}
                         <div className="hidden md:block bg-blue-50 p-2 rounded-lg border border-blue-100 text-blue-600">
                             <Car size={18} />
                         </div>
                         <div className="min-w-0">
                             <h4 className="text-xs md:text-sm font-bold text-slate-800 truncate">{currentLeaseData.vehicle.name}</h4>
                             <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-slate-500">
                                 <span className="bg-slate-100 border border-slate-200 px-1.5 rounded text-slate-600 font-mono whitespace-nowrap">{currentLeaseData.vehicle.plate}</span>
                                 <span className="text-slate-300">•</span>
                                 <span className="truncate font-medium text-slate-600">
                                     {formatShortDate(currentLeaseData.pickup.date, lang)} - {formatShortDate(currentLeaseData.dropoff.date, lang)}
                                 </span>
                             </div>
                         </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                         <span className="block text-xs md:text-sm font-bold text-slate-800 bg-slate-100 px-2 rounded whitespace-nowrap">{currentLeaseData.pricing.total} THB</span>
                         <span className="block text-[9px] md:text-[10px] text-slate-400 mt-0.5">#{currentLeaseData.reservationId}</span>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-2 md:p-6 overflow-y-auto space-y-4 md:space-y-6 flex flex-col dark-scrollbar bg-slate-50/50 overscroll-contain">
                    
                    {activeChat.messages.map((msg: ChatMessage, index: number) => {
                        // Date Separator Logic
                        const prevMsg = index > 0 ? activeChat.messages[index - 1] : null;
                        const isDifferentDay = !prevMsg || new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();

                        return (
                            <React.Fragment key={msg.id}>
                                {isDifferentDay && (
                                    <div className="flex justify-center my-4 md:my-6 sticky top-2 z-0">
                                        <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 shadow-sm px-3 py-1 rounded-full uppercase tracking-wider">
                                            {formatDateSeparator(msg.timestamp)}
                                        </span>
                                    </div>
                                )}

                                {/* SYSTEM MESSAGE RENDERER */}
                                {msg.type === 'system' ? (() => {
                                    const status = msg.metadata?.status;
                                    const style = status ? STATUS_CONFIG[status] : { bg: 'bg-slate-100', text: 'text-slate-600', icon: <CheckCheck size={12} />, label: 'System' };
                                    
                                    if (!style) return null;

                                    const isActionable = status === 'confirmation_owner' && currentLeaseData.status !== 'confirmed' && currentLeaseData.status !== 'rejected';

                                    return (
                                        <div className="flex flex-col gap-1 my-2 animate-in fade-in slide-in-from-bottom-2 duration-300 px-2 md:px-12">
                                            <div className="flex items-start gap-3 w-full">
                                                <div className="w-full flex flex-col items-center">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="h-px w-4 md:w-8 bg-slate-200"></div>
                                                        <div className={`${style.bg} ${style.text} px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1.5 border border-black/5 shadow-sm`}>
                                                            {style.icon}
                                                            {style.label}
                                                        </div>
                                                        <div className="h-px w-4 md:w-8 bg-slate-200"></div>
                                                    </div>
                                                    
                                                    <span className="text-[9px] md:text-[10px] text-slate-400 font-mono mb-1">
                                                            {formatSystemDateTime(msg.timestamp)}
                                                    </span>
                                                    
                                                    {msg.text && <p className="text-[11px] md:text-xs text-slate-500 italic text-center max-w-xs">{msg.text}</p>}
                                                    
                                                    {/* INTERACTIVE ACTIONS BUBBLE */}
                                                    {isActionable && (
                                                        <div className="mt-3 flex gap-2 md:gap-3 animate-in zoom-in duration-300">
                                                            <button 
                                                                onClick={() => confirmReservation()}
                                                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 ring-2 ring-offset-2 ring-transparent hover:ring-blue-200"
                                                            >
                                                                <ThumbsUp size={14} />
                                                                Confirm
                                                            </button>
                                                            <button 
                                                                onClick={() => rejectReservation()}
                                                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                                                            >
                                                                <ThumbsDown size={14} />
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    /* NORMAL MESSAGE RENDERER */
                                    (() => {
                                        const isMe = msg.senderId === 'me';
                                        return (
                                            <div 
                                                className={`message-wrapper flex gap-2 md:gap-3 max-w-[90%] md:max-w-[70%] animate-in fade-in slide-in-from-bottom-2 duration-200 ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}
                                                data-id={msg.id}
                                                data-status={msg.status}
                                                data-sender={msg.senderId}
                                            >
                                                {!isMe && (
                                                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white border border-slate-200 flex-shrink-0 flex items-center justify-center text-[10px] md:text-xs font-bold text-slate-600 shadow-sm mt-auto">
                                                        {activeChat.user.name[0]}
                                                    </div>
                                                )}
                                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className={`px-3 py-2 md:px-4 md:py-3 shadow-sm text-[13px] md:text-sm leading-relaxed ${
                                                        isMe 
                                                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-blue-100' 
                                                        : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm shadow-sm'
                                                    }`}>
                                                        {msg.text}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-1 px-1 text-[9px] md:text-xs text-slate-400 font-medium select-none">
                                                        {isMe && msg.status === 'read' && <CheckCheck size={12} className="text-blue-500" />}
                                                        {isMe && msg.status === 'sent' && <Check size={12} />}
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
                <div className="p-3 md:p-4 border-t border-slate-200 shrink-0 bg-white z-10 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                    <form 
                        className="relative flex items-center gap-2"
                        onSubmit={handleSend}
                        autoComplete="off"
                    >
                        <button type="button" className="p-2 md:p-3 text-slate-400 hover:bg-slate-100 rounded-full transition-colors md:hidden">
                             <ImageIcon size={20} />
                        </button>
                        <input 
                            type="text" 
                            name="message"
                            className="flex-1 bg-slate-100 border-transparent focus:bg-white border focus:border-blue-300 rounded-full py-2.5 md:py-3 pl-4 md:pl-5 pr-10 md:pr-12 text-base md:text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
                            placeholder={t('chat_type_message', lang)}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                        />
                        <div className="absolute right-14 md:right-14 flex gap-2 text-slate-400 hidden md:flex">
                             <button type="button" className="hover:text-blue-600 transition-colors p-1"><ImageIcon size={20} /></button>
                             <button type="button" className="hover:text-blue-600 transition-colors p-1"><Smile size={20} /></button>
                        </div>
                        <button 
                            type="submit"
                            disabled={!messageInput.trim()}
                            className="bg-blue-600 text-white p-2.5 md:p-3 rounded-full hover:bg-blue-700 transition-all shadow-md flex-shrink-0 disabled:opacity-50 disabled:shadow-none active:scale-95"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
            ) : (
                <div className={`${roomClasses} items-center justify-center flex-col gap-6 text-slate-400 bg-slate-50`}>
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-3 animate-in fade-in duration-500">
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                            <p className="text-sm font-medium text-slate-500">Loading conversation...</p>
                        </div>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm border border-slate-200">
                                <Smile size={40} />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-bold text-slate-600">No Chat Selected</h3>
                                <p className="text-sm max-w-xs mx-auto">Select a conversation from the sidebar or search for a reservation ID to start.</p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* RIGHT SIDEBAR: Lease Mini-Editor & Profile */}
            {activeChat && (
            <div className={`bg-white border-l border-slate-100 hidden xl:flex flex-col h-full shadow-lg z-20 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? 'w-[320px] opacity-100' : 'w-0 opacity-0 border-none'}`}>
                 <div className="w-[320px] h-full flex flex-col">
                    {/* Sidebar Tabs */}
                    <div className="flex border-b border-slate-200 bg-slate-50/50 p-1 gap-1 m-2 rounded-xl shrink-0">
                        <button 
                            onClick={() => setSidebarTab('details')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${sidebarTab === 'details' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                        >
                            <FileEdit size={14} /> Details
                        </button>
                        <button 
                            onClick={() => setSidebarTab('profile')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${sidebarTab === 'profile' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                        >
                            <UserIcon size={14} /> Profile
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                        
                        {/* DETAILS TAB (Mini-Editor) */}
                        {sidebarTab === 'details' && (
                            <div className="p-4">
                                <LeaseForm 
                                    data={currentLeaseData} 
                                    handlers={leaseHandlers} 
                                    lang={lang}
                                    compact={true} 
                                />
                            </div>
                        )}

                        {/* PROFILE TAB */}
                        {sidebarTab === 'profile' && (
                            <div className="p-4 space-y-6">
                                {/* Header: The Person we are talking to */}
                                <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-full bg-white mb-3 overflow-hidden flex items-center justify-center font-bold text-3xl text-slate-300 border-4 border-slate-50 shadow-md relative">
                                        {activeChat.user.avatar ? (
                                            <img src={activeChat.user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                        ) : activeChat.user.name[0]}
                                    </div>
                                    <h3 className="font-bold text-xl text-slate-800 text-center">{activeChat.user.name}</h3>
                                    <div className="flex gap-2 mt-2">
                                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-green-200">
                                            {t('chat_active', lang)}
                                        </span>
                                        <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-slate-200">
                                            {activeChat.user.role}
                                        </span>
                                    </div>
                                </div>

                                {/* SECTION 1: RIDER / RENTER (Customer) */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 px-1 flex items-center gap-1.5">
                                        <UserIcon size={12} /> Rider (Customer)
                                    </h4>
                                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>
                                        
                                        <InputGroup 
                                            label="Full Name *"
                                            value={currentLeaseData.renter.surname || activeChat.user.name}
                                            onChange={(v) => leaseHandlers.updateLease('renter', 'surname', v)}
                                            placeholder="Enter Rider Name"
                                        />

                                        <InputGroup 
                                            label="Contact Info *"
                                            value={currentLeaseData.renter.contact || ''}
                                            onChange={(v) => leaseHandlers.updateLease('renter', 'contact', v)}
                                            placeholder="Phone or Email"
                                        />

                                        <InputGroup 
                                            label="Passport / ID"
                                            value={currentLeaseData.renter.passport || ''}
                                            onChange={(v) => leaseHandlers.updateLease('renter', 'passport', v)}
                                            placeholder="Passport Number"
                                        />
                                    </div>
                                </div>

                                {/* SECTION 2: OWNER (Business/You) */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 px-1 flex items-center gap-1.5">
                                        <BadgeCheck size={12} className="text-blue-500" /> Owner (Business)
                                    </h4>
                                    <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3">
                                        <InputGroup 
                                            label="Rent Service Name *"
                                            value={currentLeaseData.owner.surname}
                                            onChange={(v) => leaseHandlers.updateLease('owner', 'surname', v)}
                                            helperText="Shown on contract header"
                                            className="bg-white"
                                        />

                                        <InputGroup 
                                            label="Business Address"
                                            value={currentLeaseData.owner.address}
                                            onChange={(v) => leaseHandlers.updateLease('owner', 'address', v)}
                                            placeholder="Full Address"
                                            className="bg-white"
                                        />

                                         <InputGroup 
                                            label="Contact Info"
                                            value={currentLeaseData.owner.contact}
                                            onChange={(v) => leaseHandlers.updateLease('owner', 'contact', v)}
                                            placeholder="Phone / Email"
                                            className="bg-white"
                                        />
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};