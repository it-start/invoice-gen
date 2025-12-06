

import { create } from 'zustand';
import { ChatSession, ChatMessage, LeaseData, NtfyMessage, LeaseStatus } from '../types';
import { fetchReservationHistory, fetchNtfyMessages, sendNtfyMessage, loadLeaseData, HistoryEvent, getChatSseUrl } from '../services/ownimaApi';

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
    
    // Store as raw timestamp (ms)
    const timestamp = ntfy.time * 1000;

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

    const timestamp = new Date(event.confirmation_date).getTime();

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
    activeEventSource: EventSource | null; // Track active SSE connection
    
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
    activeEventSource: null,

    loadChatSession: async (reservationId: string) => {
        // Close existing connection if switching
        const { activeEventSource } = get();
        if (activeEventSource) {
            activeEventSource.close();
            set({ activeEventSource: null });
        }

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
            const allMessages = [
                ...historyEvents.map(h => historyToChatMessage(h)),
                ...ntfyData.map((n: any) => ntfyToChatMessage(n))
            ];
            
            allMessages.sort((a, b) => a.timestamp - b.timestamp);

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
                messages: allMessages,
                lastMessage: allMessages.length > 0 ? allMessages[allMessages.length - 1].text : 'No messages',
                lastMessageTime: allMessages.length > 0 ? allMessages[allMessages.length - 1].timestamp : 0,
                unreadCount: 0
            };

            // 6. Update Store with Session
            set(state => {
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

            // 7. Establish SSE Connection for Live Updates
            const sseUrl = getChatSseUrl(topicId);
            const eventSource = new EventSource(sseUrl);
            
            eventSource.onmessage = (event) => {
                try {
                    const ntfyMsg = JSON.parse(event.data);
                    if (ntfyMsg.event !== 'message') return;
                    
                    const chatMsg = ntfyToChatMessage(ntfyMsg);
                    
                    set(state => {
                        const sessionIndex = state.sessions.findIndex(s => s.id === topicId);
                        if (sessionIndex === -1) return {};

                        const session = state.sessions[sessionIndex];
                        // Deduplicate based on ID
                        if (session.messages.some(m => m.id === chatMsg.id)) return {};

                        const updatedMessages = [...session.messages, chatMsg];
                        const updatedSession = {
                            ...session,
                            messages: updatedMessages,
                            lastMessage: chatMsg.text,
                            lastMessageTime: chatMsg.timestamp
                        };
                        
                        const newSessions = [...state.sessions];
                        newSessions[sessionIndex] = updatedSession;
                        
                        return { sessions: newSessions };
                    });
                } catch (e) {
                    console.error("SSE Parse Error", e);
                }
            };
            
            eventSource.onerror = (err) => {
                console.error("SSE Connection Error", err);
                // Standard browser behavior handles many reconnects, 
                // but we could implement backoff here if needed.
            };

            set({ activeEventSource: eventSource });

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
        const now = Date.now();
        const newMsg: ChatMessage = {
            id: tempId,
            senderId: 'me',
            text: text,
            timestamp: now,
            type: 'text',
            status: 'sent'
        };

        const updatedSessions = sessions.map(session => {
            if (session.id === activeSessionId) {
                return {
                    ...session,
                    messages: [...session.messages, newMsg],
                    lastMessage: text,
                    lastMessageTime: now
                };
            }
            return session;
        });

        set({ sessions: updatedSessions });

        // Send to API
        try {
            await sendNtfyMessage(activeSessionId, text);
            // Re-fetching is handled by the live SSE stream which will eventually bring the confirmed message
        } catch (e) {
            console.error("Failed to send message", e);
        }
    },

    getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find(s => s.id === activeSessionId);
    }
}));