
import { create } from 'zustand';
import { ChatSession, ChatMessage, LeaseData, NtfyMessage, LeaseStatus } from '../types';
import { fetchReservationHistory, fetchNtfyMessages, sendNtfyMessage, loadLeaseData, HistoryEvent } from '../services/ownimaApi';

// --- HELPERS ---

const ntfyToChatMessage = (ntfy: NtfyMessage): ChatMessage => {
    let senderId = 'other';
    // Assume user is 'Me' if title matches, or logic can be improved based on Auth
    // Since Ntfy is anonymous mostly, we rely on Title.
    // However, when *we* send, we don't see our own messages immediately unless we read back.
    // For now, treat unknown titles as 'other'.
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
    // Map API status format (STATUS_COLLECTED) to LeaseStatus (collected)
    const rawStatus = event.status || '';
    const statusKey = rawStatus.toLowerCase().replace('status_', '') as LeaseStatus;
    
    const date = new Date(event.created_date);
    const timestamp = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    // Friendly text based on status
    let text = `Status changed to ${statusKey}`;
    if (statusKey === 'collected') text = 'Vehicle collected by Rider';
    if (statusKey === 'completed') text = 'Lease completed successfully';
    if (statusKey === 'confirmed') text = 'Reservation confirmed';

    return {
        id: `hist_${event.id || Math.random()}`,
        senderId: 'system',
        text,
        timestamp,
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
            // This is crucial to know who we are talking to.
            const leaseData = await loadLeaseData(reservationId);
            set({ leaseContext: leaseData });

            // 2. Fetch History (System Messages)
            const historyEvents = await fetchReservationHistory(reservationId);
            const historyMessages = historyEvents.map(historyToChatMessage);

            // 3. Fetch Ntfy Messages (User Chat)
            // We use the reservation UUID as the topic ID
            const ntfyData = await fetchNtfyMessages(reservationId);
            const chatMessages = ntfyData.map((n: any) => ntfyToChatMessage(n));

            // 4. Merge
            // History timestamps are ISO strings, Ntfy are unix epoch.
            // Concatenate them. Sorting would require parsing timestamps to comparable objects, 
            // but ChatMessage currently only holds a string representation.
            const combined = [...historyMessages, ...chatMessages];

            // 5. Create Session
            const newSession: ChatSession = {
                id: reservationId,
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
                const existingIdx = state.sessions.findIndex(s => s.id === reservationId);
                let newSessions = [...state.sessions];
                
                if (existingIdx >= 0) {
                    newSessions[existingIdx] = newSession;
                } else {
                    newSessions.push(newSession);
                }
                
                return {
                    sessions: newSessions,
                    activeSessionId: reservationId,
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
