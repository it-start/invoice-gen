
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Phone, Send, Smile, Image as ImageIcon, CheckCheck, Check, ArrowLeft, Car, Play, Clock, Target, CircleDashed, Loader2, User as UserIcon, FileEdit, ThumbsUp, ThumbsDown, X, MoreVertical, PanelRightClose, PanelRightOpen, BadgeCheck, Wrench, Ban, AlertTriangle, HelpCircle, CalendarClock, Sparkles, MapPin, Navigation, FileText, ExternalLink } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
// @ts-ignore
import { VariableSizeList as List, ListChildComponentProps } from 'react-window';
import { LeaseData, Language, LeaseStatus, ChatSession, ChatMessage, INITIAL_LEASE } from '../../types';
import { t } from '../../utils/i18n';
import { humanizeTime, formatShortDate } from '../../utils/dateUtils';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useChatStore } from '../../stores/chatStore';
import LeaseForm from '../forms/LeaseForm';
import InputGroup from '../ui/InputGroup';
import { SwipeableRow } from '../ui/SwipeableRow';

// --- PIVOT: RIDER MODE ---
const IS_RIDER_MODE = true; 

// --- STATUS CONFIGURATION ---
const STATUS_CONFIG: Record<LeaseStatus, { bg: string, text: string, border: string, icon: React.ReactNode, label: string, accent: string }> = {
    collected: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        accent: 'bg-emerald-500',
        icon: <Play size={10} fill="currentColor" />,
        label: 'Active Trip'
    },
    completed: {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
        accent: 'bg-slate-500',
        icon: <Check size={10} strokeWidth={3} />,
        label: 'Completed'
    },
    overdue: {
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        border: 'border-rose-200',
        accent: 'bg-rose-500',
        icon: <Clock size={10} />,
        label: 'Overdue'
    },
    confirmed: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        accent: 'bg-indigo-500',
        icon: <Target size={10} />,
        label: 'Confirmed'
    },
    pending: {
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-200',
        accent: 'bg-amber-500',
        icon: <CircleDashed size={10} />,
        label: 'Requested'
    },
    confirmation_owner: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        accent: 'bg-blue-500',
        icon: <CheckCheck size={10} />,
        label: 'Host Review'
    },
    confirmation_rider: {
        bg: 'bg-violet-50',
        text: 'text-violet-600',
        border: 'border-violet-200',
        accent: 'bg-violet-500',
        icon: <Check size={10} />,
        label: 'Confirm Now'
    },
    rejected: {
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-200',
        accent: 'bg-red-500',
        icon: <X size={10} />,
        label: 'Declined'
    },
    maintenance: {
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-200',
        accent: 'bg-gray-500',
        icon: <Wrench size={10} />,
        label: 'Maintenance'
    },
    cancelled: {
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-200',
        accent: 'bg-red-500',
        icon: <Ban size={10} />,
        label: 'Cancelled'
    },
    conflict: {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        accent: 'bg-orange-500',
        icon: <AlertTriangle size={10} />,
        label: 'Issue'
    },
    no_response: {
        bg: 'bg-slate-50',
        text: 'text-slate-500',
        border: 'border-slate-200',
        accent: 'bg-slate-400',
        icon: <HelpCircle size={10} />,
        label: 'No Response'
    }
};

// Status Badge Component
const StatusBadge = ({ status, className = "" }: { status: LeaseStatus, className?: string }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['pending'];
    return (
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border} ${className}`}>
            {config.icon}
            <span className="truncate">{config.label}</span>
        </div>
    );
};

// --- HELPER: Timeline Progress ---
const getLeaseProgress = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    const now = Date.now();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
};

// --- HELPER: Smart Time Text ---
const getTimeRemaining = (endStr: string, status: LeaseStatus) => {
    if (!endStr) return '';
    const end = new Date(endStr);
    const now = new Date();
    const diffHours = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffHours / 24);

    if (status === 'completed' || status === 'cancelled') return 'Ended';
    if (status === 'overdue') return `Overdue ${Math.abs(diffDays)}d`;
    
    if (diffHours < 0) return 'Ending now';
    if (diffHours < 24) return `${Math.floor(diffHours)}h left`;
    return `${diffDays} days left`;
};

// Interface for Virtual List Data
interface ChatListData {
    sessions: ChatSession[];
    activeSessionId: string | null;
    handleChatSelect: (id: string) => void;
    archiveSession: (id: string) => void;
    lang: Language;
}

// --- VIRTUAL ROW COMPONENT ---
const ChatRow = React.memo(({ index, style, data }: ListChildComponentProps) => {
    const { sessions, activeSessionId, handleChatSelect, archiveSession, lang } = data as ChatListData;
    const chat = sessions[index];
    const isActive = activeSessionId === chat.id;

    const displayTitle = IS_RIDER_MODE && chat.reservationSummary ? chat.reservationSummary.vehicleName : chat.user.name;
    const displaySubtitle = IS_RIDER_MODE ? `Host: ${chat.user.name}` : chat.lastMessage;

    // Determine status color safely
    let statusColor = 'bg-slate-400';
    if (chat.reservationSummary?.status) {
        const config = STATUS_CONFIG[chat.reservationSummary.status as LeaseStatus];
        if (config) {
            statusColor = config.accent.replace('text-', 'bg-');
        }
    }

    return (
        <div style={style}>
            <SwipeableRow onArchive={() => archiveSession(chat.id)} className="h-full">
                <div 
                    onClick={() => handleChatSelect(chat.id)}
                    className={`relative p-3 flex gap-3 cursor-pointer transition-all h-full border-b border-slate-100 hover:bg-slate-50
                        ${isActive ? 'bg-blue-50/60' : 'bg-white'}
                    `}
                >
                    {/* Active Indicator Line */}
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r"></div>}

                    {/* Avatar */}
                    <div className="relative shrink-0 pt-1">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-sm border border-slate-100 overflow-hidden transition-all
                            ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                            {IS_RIDER_MODE ? <Car size={22} strokeWidth={1.5} /> : (chat.user.avatar ? <img src={chat.user.avatar} alt={chat.user.name} className="w-full h-full object-cover" /> : chat.user.name[0])}
                        </div>
                        {/* Status Dot */}
                        {chat.unreadCount > 0 ? (
                             <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                <span className="text-[9px] text-white font-bold">{chat.unreadCount}</span>
                             </div>
                        ) : (
                             <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${statusColor}`}></div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5 justify-center">
                        {/* Top Line */}
                        <div className="flex justify-between items-start">
                            <h3 className={`font-bold text-sm truncate leading-tight ${isActive ? 'text-slate-900' : 'text-slate-800'}`}>
                                {displayTitle}
                            </h3>
                            <span className={`text-[10px] font-medium whitespace-nowrap ml-2 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                                {chat.lastMessageTime > 0 ? humanizeTime(chat.lastMessageTime, lang) : ''}
                            </span>
                        </div>

                        {/* Middle Line */}
                        <p className="text-xs text-slate-500 truncate leading-tight">
                            {displaySubtitle}
                        </p>

                        {/* Bottom Line (Tags) */}
                        {chat.reservationSummary && (
                            <div className="mt-1.5 flex items-center justify-between">
                                <StatusBadge status={chat.reservationSummary.status} />
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 rounded border border-slate-100">
                                    {chat.reservationSummary.plateNumber}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </SwipeableRow>
        </div>
    );
});

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
    const [sidebarTab, setSidebarTab] = useState<'profile' | 'details'>('profile'); // Default to Profile/Host info for Rider
    const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
    
    // Virtual List Dimension State
    const listContainerRef = useRef<HTMLDivElement>(null);
    const [listDimensions, setListDimensions] = useState({ width: 0, height: 0 });
    const listRef = useRef<any>(null);

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

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevChatIdRef = useRef<string | null>(null);
    const prevMessageCountRef = useRef<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { 
        sessions, 
        activeSessionId, 
        isLoading, 
        sendMessage, 
        sendImage,
        setActiveSession,
        markMessageAsRead,
        confirmReservation, 
        rejectReservation, 
        leaseContext,
        hydrate,
        isHydrated,
        archiveSession
    } = useChatStore();

    useEffect(() => {
        if (!isHydrated) {
            hydrate();
        }
    }, [isHydrated, hydrate]);
    
    useEffect(() => {
        if (routeId) {
            if (isMobile) setMobileView('room');
        } else {
            setMobileView('list');
        }
    }, [routeId, isMobile]);

    useEffect(() => {
        if (!listContainerRef.current) return;
        
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                setListDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });
        
        observer.observe(listContainerRef.current);
        return () => observer.disconnect();
    }, []);

    const currentActiveId = routeId || activeSessionId;
    const activeChat = sessions.find((c: ChatSession) => c.id === currentActiveId);
    
    const resolveDisplayData = (): LeaseData => {
        if (leaseContext && (leaseContext.id === currentActiveId || leaseContext.reservationId === currentActiveId)) {
            return leaseContext;
        }
        if (leaseData.id === currentActiveId || leaseData.reservationId === currentActiveId) {
            return leaseData;
        }
        if (activeChat && activeChat.reservationSummary) {
            return {
                ...INITIAL_LEASE,
                id: activeChat.id,
                reservationId: activeChat.id,
                status: activeChat.reservationSummary.status,
                vehicle: {
                    ...INITIAL_LEASE.vehicle,
                    name: activeChat.reservationSummary.vehicleName,
                    plate: activeChat.reservationSummary.plateNumber,
                },
                pricing: {
                    ...INITIAL_LEASE.pricing,
                    total: activeChat.reservationSummary.price
                },
                pickup: { ...INITIAL_LEASE.pickup, date: '' }, 
                dropoff: { ...INITIAL_LEASE.dropoff, date: '' }
            };
        }
        return { ...INITIAL_LEASE, reservationId: 'Loading...' };
    };

    const currentLeaseData = resolveDisplayData();

    useEffect(() => {
        if (!activeChat) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target as HTMLElement;
                    const id = el.dataset.id;
                    const status = el.dataset.status;
                    const sender = el.dataset.sender;
                    
                    if (id && status === 'sent' && sender !== 'me' && sender !== 'system') {
                        markMessageAsRead(activeChat.id, id);
                        observer.unobserve(el);
                    }
                }
            });
        }, {
            root: null,
            threshold: 0.5
        });

        const elements = document.querySelectorAll('.message-wrapper');
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [activeChat?.id, activeChat?.messages, markMessageAsRead]);

    useEffect(() => {
        if (activeChat && messagesEndRef.current) {
            const isChatSwitch = activeChat.id !== prevChatIdRef.current;
            const isNewMessage = activeChat.messages.length > prevMessageCountRef.current;
            
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
        setActiveSession(chatId);
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
        navigate('/');
    };

    const handleSend = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!messageInput.trim()) return;
        sendMessage(messageInput);
        setMessageInput('');
    };

    const handleImageClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            sendImage(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleStatusClick = () => {
        if (window.innerWidth >= 1280) { // xl breakpoint
            if (!isSidebarOpen) setIsSidebarOpen(true);
            setSidebarTab('profile'); // Rider wants to see Host info often
        } else {
            setIsMobileDetailsOpen(true);
            setSidebarTab('profile');
        }
    };

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

    const filteredSessions = useMemo(() => sessions.filter((s: ChatSession) => {
        const matchesSearch = !searchQuery || s.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.includes(searchQuery);
        const isVisible = searchQuery ? true : !s.isArchived;
        return matchesSearch && isVisible;
    }), [sessions, searchQuery]);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.resetAfterIndex(0);
        }
    }, [filteredSessions]);

    const getItemSize = (index: number) => {
        const s = filteredSessions[index];
        // 96px for items with vehicle details (3 rows), 72px for simple rows (2 rows)
        return s.reservationSummary ? 96 : 72;
    };

    const statusConfig = STATUS_CONFIG[currentLeaseData.status || 'pending'] || STATUS_CONFIG['pending'];
    const timelineProgress = getLeaseProgress(currentLeaseData.pickup.date, currentLeaseData.dropoff.date);
    const smartTime = getTimeRemaining(currentLeaseData.dropoff.date, currentLeaseData.status || 'pending');

    const renderProfileContent = () => (
        <div className="space-y-6">
            <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white mb-3 overflow-hidden flex items-center justify-center font-bold text-3xl text-slate-300 border-4 border-slate-50 shadow-md relative">
                    {/* IN RIDER MODE, THE AVATAR IS THE HOST (SHOP) */}
                    {activeChat && activeChat.user.avatar ? (
                        <img src={activeChat.user.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : <UserIcon size={32} />}
                </div>
                {/* RIDER MODE: This is the Host Name */}
                <h3 className="font-bold text-xl text-slate-800 text-center">{activeChat?.user.name}</h3>
                <div className="flex gap-2 mt-2">
                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-green-200">
                        {t('chat_active', lang)}
                    </span>
                    <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-slate-200">
                        {IS_RIDER_MODE ? "Host" : activeChat?.user.role}
                    </span>
                </div>
            </div>

            {/* RIDER MODE: HOST CARD & ACTIONS */}
            {IS_RIDER_MODE ? (
                <>
                    {/* QUICK ACTIONS ROW */}
                    <div className="grid grid-cols-3 gap-2">
                        <button className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                            <Navigation size={20} />
                            <span className="text-[10px] font-bold">Directions</span>
                        </button>
                        <button className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                            <Phone size={20} />
                            <span className="text-[10px] font-bold">Call</span>
                        </button>
                        <Link 
                            to={`/preview/lease/${currentLeaseData.reservationId}`} 
                            target="_blank"
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <FileText size={20} />
                            <span className="text-[10px] font-bold">Contract</span>
                        </Link>
                    </div>

                    {/* HOST LOCATION CARD */}
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 px-1 flex items-center gap-1.5">
                            <BadgeCheck size={12} className="text-blue-500" /> Host Location
                        </h4>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                            {/* Fake Map Visual */}
                            <div className="h-24 bg-slate-100 relative bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/100.0,13.0,12,0/300x150?access_token=pk.xxx')] bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-red-500 text-white p-1.5 rounded-full shadow-lg animate-bounce">
                                        <MapPin size={16} fill="currentColor" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="text-xs font-bold text-slate-800">{currentLeaseData.owner.surname}</p>
                                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{currentLeaseData.owner.address}</p>
                                <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-600 font-bold">
                                    <span>Open in Maps</span>
                                    <ExternalLink size={10} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MY INFO (Simplified) */}
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 px-1 flex items-center gap-1.5">
                            <UserIcon size={12} /> My Rider Details
                        </h4>
                        <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-[10px] text-slate-500">Name</span>
                                <span className="text-[10px] font-bold text-slate-800">{currentLeaseData.renter.surname}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[10px] text-slate-500">Contact</span>
                                <span className="text-[10px] font-bold text-slate-800">{currentLeaseData.renter.contact}</span>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* ORIGINAL OWNER VIEW */
                <>
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 px-1 flex items-center gap-1.5">
                            <UserIcon size={12} /> Rider (Customer)
                        </h4>
                        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>
                            <InputGroup 
                                label="Full Name *"
                                value={currentLeaseData.renter.surname || activeChat?.user.name || ''}
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
                </>
            )}
        </div>
    );

    return (
        <div className="flex h-full bg-white md:rounded-xl overflow-hidden md:border border-slate-200 md:shadow-sm relative">
            
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
            />

            {/* LEFT SIDEBAR: Chat List (Trips for Rider / Chats for Owner) */}
            {(!isMobile || mobileView === 'list') && (
                <div className={`flex flex-col bg-slate-50 relative ${
                    isMobile ? 'w-full' : 'w-80 border-r border-slate-200 shrink-0'
                }`}>
                    
                    {/* Command Bar */}
                    <div className="p-3 border-b border-slate-200/50 bg-white/80 backdrop-blur-md sticky top-0 z-30 shrink-0 pt-[env(safe-area-inset-top)]">
                        <form onSubmit={handleSearchSubmit} className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 -m-[1px] blur-[1px]" />
                            <div className="relative flex items-center bg-slate-100/50 border border-slate-200 rounded-xl group-focus-within:bg-white group-focus-within:border-transparent group-focus-within:shadow-md transition-all duration-300 overflow-hidden">
                                <div className="pl-3 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Search size={16} className="group-focus-within:hidden" />
                                    <Sparkles size={16} className="hidden group-focus-within:block animate-pulse" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder={IS_RIDER_MODE ? "Search trips..." : t('chat_search', lang)}
                                    className="w-full pl-2 pr-3 py-2.5 bg-transparent text-base md:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </form>
                    </div>

                    {/* Virtual List Container */}
                    <div className="flex-1 bg-white" ref={listContainerRef}>
                        {isLoading && sessions.length === 0 && (
                            <div className="p-8 flex flex-col items-center justify-center text-slate-400 gap-2 h-full">
                                <Loader2 className="animate-spin text-blue-500" />
                                <span className="text-xs">Loading {IS_RIDER_MODE ? 'trips' : 'chats'}...</span>
                            </div>
                        )}
                        
                        {filteredSessions.length === 0 && !isLoading && (
                            <div className="p-8 text-center text-xs text-slate-400 italic h-full">
                                No active {IS_RIDER_MODE ? 'trips' : 'chats'} found.
                            </div>
                        )}

                        {listDimensions.height > 0 && filteredSessions.length > 0 && (
                            <List
                                ref={listRef}
                                height={listDimensions.height}
                                width={listDimensions.width}
                                itemCount={filteredSessions.length}
                                itemSize={getItemSize}
                                itemData={{ sessions: filteredSessions, activeSessionId: currentActiveId, handleChatSelect, archiveSession, lang }}
                                className="custom-scrollbar"
                            >
                                {ChatRow}
                            </List>
                        )}
                    </div>
                </div>
            )}

            {/* MIDDLE: Chat Room */}
            {(!isMobile || mobileView === 'room') && (
                <div className={`flex flex-col bg-slate-50/30 relative ${
                    isMobile ? 'w-full' : 'flex-1 min-w-0'
                }`}>
                    {activeChat ? (
                    <>
                        {/* Header: Adjusted for Safe Area on Mobile */}
                        <div className={`
                            border-b border-slate-200 flex justify-between items-center px-3 md:px-6 shrink-0 bg-white shadow-sm z-20
                            h-[max(3.5rem,calc(3.5rem+env(safe-area-inset-top)))]
                            pt-[env(safe-area-inset-top)]
                        `}>
                            <div className="flex items-center gap-2 md:gap-3">
                                {isMobile && (
                                    <button onClick={handleBackToList} className="-ml-2 p-2 hover:bg-slate-100 rounded-full text-slate-600">
                                        <ArrowLeft size={20} />
                                    </button>
                                )}
                                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border border-slate-100 overflow-hidden">
                                    {activeChat.user.avatar ? <img src={activeChat.user.avatar} alt={activeChat.user.name} className="w-full h-full object-cover" /> : activeChat.user.name[0]}
                                </div>
                                <div>
                                    {/* RIDER MODE: Title is Host Name */}
                                    <h3 className="font-bold text-slate-800 text-sm">{activeChat.user.name}</h3>
                                    <p className="text-[10px] md:text-xs text-green-600 flex items-center gap-1 font-medium">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="hidden md:inline">{t('chat_active', lang)}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 text-slate-400 items-center">
                                {/* Actions */}
                                <button className="hidden md:block p-2 hover:bg-slate-100 rounded-full hover:text-slate-600 transition-colors"><Phone size={18} /></button>
                                
                                {/* RIDER MODE: Highlight "My Trip" Button */}
                                <button 
                                    onClick={() => {
                                        setSidebarTab('profile'); // Default to Host/Action view for Rider
                                        setIsMobileDetailsOpen(true);
                                    }}
                                    className={`md:hidden p-2 rounded-full transition-colors shadow-sm ${IS_RIDER_MODE ? 'bg-blue-600 text-white' : 'text-blue-600 bg-blue-50'}`}
                                >
                                    <Car size={18} />
                                </button>

                                <div className="h-6 w-px bg-slate-200 mx-1 hidden xl:block"></div>
                                <button 
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className={`p-2 rounded-full transition-colors hidden xl:block ${isSidebarOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 hover:text-slate-600'}`}
                                    title="Toggle Details"
                                >
                                    {isSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                                </button>

                                <button 
                                    onClick={() => setIsMobileDetailsOpen(true)}
                                    className="p-2 hover:bg-slate-100 rounded-full hover:text-slate-600 transition-colors xl:hidden"
                                >
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>

                        {/* --- SMART CONTEXT ISLAND (Compact) --- */}
                        <div className={`backdrop-blur-xl bg-white/90 border-b border-slate-200/50 pt-0 pb-0 shrink-0 z-10 sticky top-0 transition-all shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)]`} onClick={() => handleStatusClick()}>
                            <div className="px-3 py-1.5 md:px-4 md:py-3 flex justify-between items-center md:items-start gap-2 md:gap-4">
                                <div className="flex items-center md:items-start gap-3 min-w-0">
                                    <div className="relative shrink-0 hidden xs:block">
                                        <div className="w-8 h-8 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-sm flex items-center justify-center text-slate-500">
                                            <Car size={18} strokeWidth={1.5} className="md:w-5 md:h-5" />
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 rounded-full border-[2px] md:border-[3px] border-white ${statusConfig.accent}`}></div>
                                    </div>
                                    <div className="flex flex-col min-w-0 justify-center">
                                        <h4 className="text-sm font-bold text-slate-900 leading-tight truncate mt-0.5">
                                            {currentLeaseData.vehicle.name}
                                        </h4>
                                        <div className="mt-0.5 md:mt-1 flex items-center">
                                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50 whitespace-nowrap">
                                                {currentLeaseData.vehicle.plate}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden md:flex flex-col items-center justify-center min-w-0 px-2 flex-1">
                                    <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                                        <CalendarClock size={12} />
                                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">Timeline</span>
                                    </div>
                                    <div className="flex items-baseline gap-1.5 truncate w-full justify-center">
                                        <span className="text-xs font-semibold text-slate-800 truncate">
                                            {currentLeaseData.pickup.date ? (
                                                <>
                                                    {formatShortDate(currentLeaseData.pickup.date, lang)}
                                                    <span className="text-slate-300 mx-1.5">→</span>
                                                    {formatShortDate(currentLeaseData.dropoff.date, lang)}
                                                </>
                                            ) : (
                                                <span className="text-slate-400 italic">No dates set</span>
                                            )}
                                        </span>
                                        {currentLeaseData.dropoff.date && (
                                            <span className={`text-[10px] font-bold px-1.5 rounded-md ${
                                                (currentLeaseData.status === 'overdue' || currentLeaseData.status === 'cancelled') 
                                                    ? 'bg-red-100 text-red-700' 
                                                    : 'bg-blue-50 text-blue-700'
                                            }`}>
                                                {smartTime}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end shrink-0">
                                    <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                                        <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                                            #{currentLeaseData.reservationId}
                                        </span>
                                        <StatusBadge status={currentLeaseData.status || 'pending'} />
                                    </div>
                                    
                                    <div className="text-right">
                                        <span className="font-bold text-slate-800 text-sm font-sans">
                                            {currentLeaseData.pricing.total > 0 ? currentLeaseData.pricing.total.toLocaleString() : '-'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold ml-1">THB</span>
                                    </div>

                                    {/* Mobile Date Summary */}
                                    <div className="md:hidden mt-0.5 flex justify-end">
                                        {currentLeaseData.pickup.date ? (
                                            <div className="flex items-center text-[9px] font-medium text-slate-500">
                                                <span>{formatShortDate(currentLeaseData.pickup.date, lang)}</span>
                                                <span className="text-slate-300 mx-1">→</span>
                                                <span>{formatShortDate(currentLeaseData.dropoff.date, lang)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] text-slate-400 italic">No dates</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-[3px] bg-slate-100 relative overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ease-out ${statusConfig.accent}`} 
                                    style={{ width: `${timelineProgress}%` }}
                                >
                                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/50"></div>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-2 md:p-6 overflow-y-auto space-y-4 md:space-y-6 flex flex-col dark-scrollbar bg-slate-50/50 overscroll-contain">
                            
                            {activeChat.messages.map((msg: ChatMessage, index: number) => {
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

                                        {msg.type === 'system' ? (() => {
                                            const status = msg.metadata?.status as LeaseStatus | undefined;
                                            const style = status && STATUS_CONFIG[status] ? STATUS_CONFIG[status] : { bg: 'bg-slate-100', text: 'text-slate-600', icon: <CheckCheck size={12} />, label: 'System' };
                                            
                                            // RIDER MODE LOGIC: Riders can confirm if waiting for rider
                                            const isActionable = IS_RIDER_MODE 
                                                ? (status === 'confirmation_rider' && currentLeaseData.status !== 'confirmed')
                                                : (status === 'confirmation_owner' && currentLeaseData.status !== 'confirmed');

                                            return (
                                                <div className="flex flex-col gap-1 my-2 animate-in fade-in slide-in-from-bottom-2 duration-300 px-2 md:px-12">
                                                    <div className="flex items-start gap-3 w-full">
                                                        <div className="w-full flex flex-col items-center">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="h-px w-4 md:w-8 bg-slate-200"></div>
                                                                <div 
                                                                    onClick={() => status && handleStatusClick()}
                                                                    className={`${style.bg} ${style.text} px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1.5 border border-black/5 shadow-sm cursor-pointer hover:opacity-80 active:scale-95 transition-all`}
                                                                    role="button"
                                                                >
                                                                    {style.icon}
                                                                    {style.label}
                                                                </div>
                                                                <div className="h-px w-4 md:w-8 bg-slate-200"></div>
                                                            </div>
                                                            
                                                            <span className="text-[9px] md:text-[10px] text-slate-400 font-mono mb-1">
                                                                    {formatSystemDateTime(msg.timestamp)}
                                                            </span>
                                                            
                                                            {msg.text && <p className="text-[11px] md:text-xs text-slate-500 italic text-center max-w-xs">{msg.text}</p>}
                                                            
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
                                                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white border border-slate-200 flex-shrink-0 flex items-center justify-center text-[10px] md:text-xs font-bold text-slate-600 shadow-sm mt-auto overflow-hidden">
                                                                {activeChat.user.avatar ? <img src={activeChat.user.avatar} alt={activeChat.user.name} className="w-full h-full object-cover" /> : activeChat.user.name[0]}
                                                            </div>
                                                        )}
                                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                            
                                                            {msg.type === 'image' && msg.attachmentUrl ? (
                                                                <div className={`overflow-hidden rounded-2xl shadow-sm border border-black/5 ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                                                                    <img 
                                                                        src={msg.attachmentUrl} 
                                                                        alt="Attachment" 
                                                                        className="max-w-full max-h-[300px] object-cover bg-slate-100"
                                                                        loading="lazy"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className={`px-3 py-2 md:px-4 md:py-3 shadow-sm text-[13px] md:text-sm leading-relaxed ${
                                                                    isMe 
                                                                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-blue-100' 
                                                                    : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm shadow-sm'
                                                                }`}>
                                                                    {msg.text}
                                                                </div>
                                                            )}

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
                            <div ref={messagesEndRef} className="h-2" />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 md:p-4 border-t border-slate-200 shrink-0 bg-white z-10 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                            <form 
                                className="relative flex items-center gap-2"
                                onSubmit={handleSend}
                                autoComplete="off"
                            >
                                <button 
                                    type="button" 
                                    onClick={handleImageClick}
                                    className="p-2 md:p-3 text-slate-400 hover:bg-slate-100 rounded-full transition-colors md:hidden"
                                >
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
                                    <button 
                                        type="button" 
                                        onClick={handleImageClick}
                                        className="hover:text-blue-600 transition-colors p-1"
                                    >
                                        <ImageIcon size={20} />
                                    </button>
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
                    </>
                    ) : (
                        <div className="flex-1 h-full flex flex-col items-center justify-center gap-6 text-slate-400 bg-slate-50">
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-3 animate-in fade-in duration-500">
                                    <Loader2 className="animate-spin text-blue-500" size={48} />
                                    <p className="text-sm font-medium text-slate-500">Loading {IS_RIDER_MODE ? 'trip' : 'conversation'}...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm border border-slate-200">
                                        <Smile size={40} />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h3 className="text-lg font-bold text-slate-600">No {IS_RIDER_MODE ? 'Trip' : 'Chat'} Selected</h3>
                                        <p className="text-sm max-w-xs mx-auto">Select a {IS_RIDER_MODE ? 'trip' : 'conversation'} from the list to start.</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* RIGHT SIDEBAR: Lease Mini-Editor & Profile (Desktop Only) */}
            {activeChat && (
                <div className={`bg-white border-l border-slate-100 hidden xl:flex flex-col h-full shadow-lg z-20 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? 'w-[320px] opacity-100' : 'w-0 opacity-0 border-none'}`}>
                     <div className="w-[320px] h-full flex flex-col">
                        {/* Sidebar Tabs */}
                        <div className="flex border-b border-slate-200 bg-slate-50/50 p-1 gap-1 m-2 rounded-xl shrink-0">
                            <button 
                                onClick={() => setSidebarTab('profile')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${sidebarTab === 'profile' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                            >
                                <UserIcon size={14} /> {IS_RIDER_MODE ? 'Host' : 'Profile'}
                            </button>
                            <button 
                                onClick={() => setSidebarTab('details')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${sidebarTab === 'details' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                            >
                                <FileEdit size={14} /> {IS_RIDER_MODE ? 'Trip Info' : 'Details'}
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                            {sidebarTab === 'details' && (
                                <div className="p-4">
                                    <LeaseForm 
                                        data={currentLeaseData} 
                                        handlers={leaseHandlers} 
                                        lang={lang}
                                        compact={true}
                                        readOnly={IS_RIDER_MODE} 
                                    />
                                </div>
                            )}

                            {sidebarTab === 'profile' && (
                                <div className="p-4">
                                    {renderProfileContent()}
                                </div>
                            )}
                        </div>
                     </div>
                </div>
            )}

            {/* Mobile Details Sheet */}
            {isMobileDetailsOpen && (
                <div className="fixed inset-0 z-50 xl:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileDetailsOpen(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 pt-[calc(1rem+env(safe-area-inset-top))]">
                            <h3 className="font-bold text-slate-800">{IS_RIDER_MODE ? 'Trip Details' : 'Details'}</h3>
                            <button onClick={() => setIsMobileDetailsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        
                        {/* Reuse Sidebar Tabs logic */}
                        <div className="flex border-b border-slate-200 bg-slate-50/50 p-1 gap-1 m-2 rounded-xl shrink-0">
                            <button 
                                onClick={() => setSidebarTab('profile')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${sidebarTab === 'profile' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                            >
                                <UserIcon size={14} /> {IS_RIDER_MODE ? 'Host' : 'Profile'}
                            </button>
                            <button 
                                onClick={() => setSidebarTab('details')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${sidebarTab === 'details' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                            >
                                <FileEdit size={14} /> {IS_RIDER_MODE ? 'Trip Info' : 'Details'}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-[calc(1rem+env(safe-area-inset-bottom))]">
                             {sidebarTab === 'details' && (
                                <LeaseForm 
                                    data={currentLeaseData} 
                                    handlers={leaseHandlers} 
                                    lang={lang}
                                    compact={true}
                                    readOnly={IS_RIDER_MODE}
                                />
                            )}
                            {sidebarTab === 'profile' && renderProfileContent()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
