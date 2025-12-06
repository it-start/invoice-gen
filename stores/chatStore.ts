
import { create } from 'zustand';
import { ChatSession, ChatMessage, LeaseData, NtfyMessage, LeaseStatus } from '../types';

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

// --- HELPERS ---

const ntfyToChatMessage = (ntfy: NtfyMessage): ChatMessage => {
    let senderId = 'other';
    if (ntfy.title === 'Me') senderId = 'me';
    else if (ntfy.title === 'System' || ntfy.tags?.includes('system')) senderId = 'system';

    let type: any = 'text';
    let statusMetadata: LeaseStatus | undefined = undefined;

    if (ntfy.tags?.includes('system')) {
        type = 'system';
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

    if (sessions['lease-chat-renter']) {
        const vehicleName = leaseData.vehicle.name || 'Vehicle';
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

// --- STORE DEFINITION ---

interface ChatState {
    sessions: ChatSession[];
    activeSessionId: string;
    isInitialized: boolean;
    
    // Actions
    initialize: (data: LeaseData) => void;
    syncLeaseData: (data: LeaseData) => void;
    setActiveSession: (id: string) => void;
    sendMessage: (text: string) => void;
    getActiveSession: () => ChatSession | undefined;
}

export const useChatStore = create<ChatState>((set, get) => ({
    sessions: [],
    activeSessionId: 'lease-chat-renter',
    isInitialized: false,

    initialize: (data: LeaseData) => {
        if (get().isInitialized) return;
        
        const sessions = hydrateSessionsFromNtfy(data);
        set({ sessions, isInitialized: true });
    },

    syncLeaseData: (data: LeaseData) => {
        // Update user details (name/contact) in existing sessions without wiping messages
        set((state) => {
            if (!state.isInitialized) {
                return { sessions: hydrateSessionsFromNtfy(data), isInitialized: true };
            }

            const updatedSessions = state.sessions.map(session => {
                if (session.id === 'lease-chat-renter') {
                    return {
                        ...session,
                        user: {
                            ...session.user,
                            name: data.renter.surname || 'Renter',
                            contact: data.renter.contact
                        }
                    };
                }
                if (session.id === 'lease-chat-owner') {
                    return {
                        ...session,
                        user: {
                            ...session.user,
                            contact: data.owner.contact
                        }
                    };
                }
                return session;
            });
            return { sessions: updatedSessions };
        });
    },

    setActiveSession: (id: string) => {
        set({ activeSessionId: id });
    },

    sendMessage: (text: string) => {
        const { activeSessionId, sessions } = get();
        if (!text.trim()) return;

        const newMsg: ChatMessage = {
            id: Math.random().toString(),
            senderId: 'me',
            text: text,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            type: 'text',
            status: 'sent'
        };

        const updatedSessions = sessions.map(session => {
            if (session.id === activeSessionId) {
                return {
                    ...session,
                    messages: [...session.messages, newMsg],
                    lastMessage: text,
                    lastMessageTime: 'Just now'
                };
            }
            return session;
        });

        set({ sessions: updatedSessions });
    },

    getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find(s => s.id === activeSessionId);
    }
}));
