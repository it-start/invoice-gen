
import { create } from 'zustand';
import { ChatSession, ChatMessage, LeaseData, NtfyMessage, LeaseStatus } from '../types';
import { fetchReservationHistory, fetchNtfyMessages, sendNtfyMessage, loadLeaseData, HistoryEvent } from '../services/ownimaApi';

// --- HELPERS ---

const ntfyToChatMessage = (ntfy: NtfyMessage): ChatMessage => {
    let senderId = 'other';
    // Assume user is 'Me' if title matches, or logic can be improved based on Auth
    if (ntfy.title === 'Me') senderId = 'me';
    
    // System messages detection
    if (ntfy.title === 'System' || ntfy.tags?.includes('system')) senderId = 'system';

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
        status: 'read', // Assume historical messages are read
        metadata: {
            status: statusMetadata
        }
    };
};

const historyToChatMessage = (event: HistoryEvent): ChatMessage => {
    // Map API confirmation event to System Message
    // Use meta.reason_hint as status key if available
    let statusKey: LeaseStatus | undefined = undefined;
    
    if (event.meta?.reason_hint) {
        // Map "reservation_pending" -> "pending"
        // Map "reservation_confirmation_by_rider" -> "confirmation_rider"
        let hint = event.meta.reason_hint.replace('reservation_', '');
        hint = hint.replace('_by_', '_'); // Normalize "confirmation_by_rider" to "confirmation_rider"
        
        // Validate against known statuses or cast if dynamic
        statusKey = hint as LeaseStatus; 
    } else if (typeof event.status === 'string') {
        statusKey = event.status.toLowerCase().replace('status_', '') as LeaseStatus;
    }

    const date = new Date(event.confirmation_date);
    const timestamp = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const fullDate = date.toLocaleDateString();

    // Friendly text based on status or note
    let text = event.confirmation_note || `Status changed`;
    
    // Clean up "Reason:" prefix if present
    if (text.startsWith('Reason: ')) {
        text = text.substring(8);
    }
    
    // Provide nice defaults if note is empty
    if (!event.confirmation_note && statusKey) {
        if (statusKey === 'collected') text = 'Vehicle collected by Rider';
        if (statusKey === 'completed') text = 'Lease completed successfully';
        if (statusKey === 'confirmed') text = 'Reservation confirmed';
        if (statusKey === 'pending') text = 'Reservation is pending';
        if (statusKey === 'confirmation_owner') text = 'Waiting for Owner confirmation';
        if (statusKey === 'confirmation_rider') text = 'Waiting for Rider confirmation';
    }

    return {
        id: `hist_${event.confirmation_date}_${Math.random()}`,
        senderId: 'system',
        text,
        timestamp: `${fullDate} ${timestamp}`,
        type: 'system',
        status: 'read',
        metadata: {
            status: statusKey
        }
    };
};

// --- STORE DEFINITION ---

interface ChatState {
    sessions: ChatSession[];
    activeSessionId: string | null;
    isLoading: boolean;
    error: string | null;
    leaseContext: LeaseData | null; // Store the lease data associated with current chat
    
    // Actions
    loadChatSession: (reservationId: string) => Promise<void>;
    setActiveSession: (id: string) => void;
    sendMessage: (text: string) => Promise<void>;
    getActiveSession: () => ChatSession | undefined;
}

export const useChatStore = create<ChatState>((set, get) => ({
    sessions: [],
    activeSessionId: null,
    isLoading: false,
    error: null,
    leaseContext: null,

    loadChatSession: async (reservationId: string) => {
        set({ isLoading: true, error: null });
        try {
            // 1. Fetch Lease Data to get Renter/Owner context
            const leaseData = await loadLeaseData(reservationId);
            set({ leaseContext: leaseData });

            // 2. Fetch History (System Messages)
            const historyEvents = await fetchReservationHistory(leaseData.id || reservationId);
            
            // 3. Fetch Ntfy Messages (User Chat)
            // Use the real UUID (leaseData.id) for the chat topic if available, otherwise input
            const topicId = leaseData.id || reservationId;
            const ntfyData = await fetchNtfyMessages(topicId);
            
            // 4. Merge & Sort
            // Combine arrays and sort by timestamp (approximated via ID or parsed Date)
            const allMessages = [
                ...historyEvents.map(h => ({ msg: historyToChatMessage(h), time: new Date(h.confirmation_date).getTime() })),
                ...ntfyData.map((n: any) => ({ msg: ntfyToChatMessage(n), time: n.time * 1000 }))
            ];
            
            allMessages.sort((a, b) => a.time - b.time);
            const combined = allMessages.map(item => item.msg);

            // 5. Create Session
            const newSession: ChatSession = {
                id: topicId, // Use UUID as session ID
                user: {
                    id: leaseData.renter.surname, // simplified ID
                    name: leaseData.renter.surname || 'Renter',
                    contact: leaseData.renter.contact,
                    role: 'Renter',
                    status: 'online',
                    avatar: ''
                },
                messages: combined,
                lastMessage: combined.length > 0 ? combined[combined.length - 1].text : 'No messages',
                lastMessageTime: combined.length > 0 ? combined[combined.length - 1].timestamp : '',
                unreadCount: 0
            };

            // 6. Update Store
            set(state => {
                // Check if session exists
                const existingIdx = state.sessions.findIndex(s => s.id === topicId);
                let newSessions = [...state.sessions];
                
                if (existingIdx >= 0) {
                    newSessions[existingIdx] = newSession;
                } else {
                    newSessions.push(newSession);
                }
                
                return {
                    sessions: newSessions,
                    activeSessionId: topicId,
                    isLoading: false
                };
            });

        } catch (e: any) {
            console.error("Load Chat Error", e);
            set({ isLoading: false, error: e.message || "Failed to load chat" });
        }
    },

    setActiveSession: (id: string) => {
        set({ activeSessionId: id });
    },

    sendMessage: async (text: string) => {
        const { activeSessionId, sessions } = get();
        if (!activeSessionId || !text.trim()) return;

        // Optimistic UI Update
        const tempId = Math.random().toString();
        const newMsg: ChatMessage = {
            id: tempId,
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

        // Send to API
        try {
            await sendNtfyMessage(activeSessionId, text);
            // Optionally: re-fetch messages to confirm receipt and get real timestamp/ID
        } catch (e) {
            console.error("Failed to send message", e);
            // Could add error state to message here
        }
    },

    getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find(s => s.id === activeSessionId);
    }
}));
