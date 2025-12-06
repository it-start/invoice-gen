
import { create } from 'zustand';
import { ChatSession, ChatMessage, LeaseData, NtfyMessage, LeaseStatus } from '../types';
import { fetchReservationHistory, fetchNtfyMessages, sendNtfyMessage, loadLeaseData, HistoryEvent, getChatSseUrl } from '../services/ownimaApi';
import { authService } from '../services/authService';

const PERSIST_KEY = 'chat_sessions_v1';

// --- HELPERS ---

const ntfyToChatMessage = (ntfy: NtfyMessage, initialStatus: 'read' | 'sent' = 'read'): ChatMessage => {
    let senderId = 'other';
    const currentUser = authService.getUsername();

    // Strict Auth Matching
    if (currentUser && ntfy.title === currentUser) {
        senderId = 'me';
    } 
    // Fallback Legacy Matching
    else if (ntfy.title === 'Me') {
        senderId = 'me';
    }
    
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
        status: initialStatus,
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

const loadFromStorage = (): ChatSession[] => {
    try {
        const stored = localStorage.getItem(PERSIST_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.warn("Failed to load chat sessions from storage", e);
        return [];
    }
};

const saveToStorage = (sessions: ChatSession[]) => {
    try {
        // Optional: Limit storage size here if needed in future
        localStorage.setItem(PERSIST_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.warn("Failed to save chat sessions to storage", e);
    }
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
    confirmReservation: () => Promise<void>;
    rejectReservation: () => Promise<void>;
    markAsRead: (sessionId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    sessions: loadFromStorage(),
    activeSessionId: null,
    isLoading: false,
    error: null,
    leaseContext: null,
    activeEventSource: null,

    loadChatSession: async (reservationId: string) => {
        // Close existing connection if switching
        const { activeEventSource, sessions } = get();
        if (activeEventSource) {
            activeEventSource.close();
            set({ activeEventSource: null });
        }

        // Stale-While-Revalidate Strategy
        const existingSession = sessions.find(s => s.id === reservationId);
        
        // Always set active session immediately to update UI focus
        if (existingSession) {
            set({ activeSessionId: reservationId, isLoading: false, error: null });
        } else {
            set({ activeSessionId: reservationId, isLoading: true, error: null });
        }

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
                ...ntfyData.map((n: any) => ntfyToChatMessage(n, 'read')) // Initial load is always read
            ];
            
            allMessages.sort((a, b) => a.timestamp - b.timestamp);

            // 5. Create/Update Session
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
                unreadCount: 0 // Reset unread count on open
            };

            // 6. Update Store with Session & Persist
            set(state => {
                const existingIdx = state.sessions.findIndex(s => s.id === topicId);
                let newSessions = [...state.sessions];
                if (existingIdx >= 0) {
                    newSessions[existingIdx] = newSession;
                } else {
                    newSessions.push(newSession);
                }
                
                saveToStorage(newSessions);

                return {
                    sessions: newSessions,
                    // Ensure activeSessionId is set (in case we did SWR update or full load)
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
                    
                    // Check if this message belongs to the active session
                    // Note: Current arch only opens SSE for active, but safeguarding for future
                    const isActive = get().activeSessionId === topicId;
                    const status = isActive ? 'read' : 'sent';

                    const chatMsg = ntfyToChatMessage(ntfyMsg, status);
                    
                    set(state => {
                        const sessionIndex = state.sessions.findIndex(s => s.id === topicId);
                        if (sessionIndex === -1) return {};

                        const session = state.sessions[sessionIndex];
                        // Deduplicate based on ID
                        if (session.messages.some(m => m.id === chatMsg.id)) return {};

                        const updatedMessages = [...session.messages, chatMsg];
                        
                        // Increment unread count if not active, otherwise keep 0
                        const newUnreadCount = isActive ? 0 : (session.unreadCount || 0) + 1;

                        const updatedSession = {
                            ...session,
                            messages: updatedMessages,
                            lastMessage: chatMsg.text,
                            lastMessageTime: chatMsg.timestamp,
                            unreadCount: newUnreadCount
                        };
                        
                        const newSessions = [...state.sessions];
                        newSessions[sessionIndex] = updatedSession;
                        
                        saveToStorage(newSessions);
                        
                        return { sessions: newSessions };
                    });
                } catch (e) {
                    console.error("SSE Parse Error", e);
                }
            };
            
            eventSource.onerror = (err) => {
                console.error("SSE Connection Error", err);
            };

            set({ activeEventSource: eventSource });

        } catch (e: any) {
            console.error("Load Chat Error", e);
            // If we have existing session, error is less critical (we just show stale data)
            // But we should probably notify the user
            set(state => ({ 
                isLoading: false, 
                error: state.activeSessionId && state.sessions.find(s => s.id === state.activeSessionId) 
                    ? null // Hide error if we have data to show
                    : (e.message || "Failed to load chat")
            }));
        }
    },

    setActiveSession: (id: string) => {
        set({ activeSessionId: id });
        get().markAsRead(id);
    },

    markAsRead: (sessionId: string) => {
        set(state => {
            const sessions = state.sessions.map(s => {
                if (s.id === sessionId) {
                    // Reset unread count to 0
                    return { ...s, unreadCount: 0 };
                }
                return s;
            });
            saveToStorage(sessions);
            return { sessions };
        });
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
        saveToStorage(updatedSessions);

        // Send to API
        try {
            await sendNtfyMessage(activeSessionId, text);
            // Re-fetching is handled by the live SSE stream
        } catch (e) {
            console.error("Failed to send message", e);
        }
    },

    getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find(s => s.id === activeSessionId);
    },

    confirmReservation: async () => {
        const { sendMessage, leaseContext } = get();
        if (!leaseContext) return;
        
        // 1. Optimistically update Status in local store
        set(state => ({
            leaseContext: state.leaseContext ? { ...state.leaseContext, status: 'confirmed' } : null
        }));

        // 2. Send System Message via Ntfy
        await sendMessage("✅ Reservation confirmed by Owner");
    },

    rejectReservation: async () => {
         const { sendMessage, leaseContext } = get();
        if (!leaseContext) return;
        
        // 1. Optimistically update Status
        set(state => ({
            leaseContext: state.leaseContext ? { ...state.leaseContext, status: 'rejected' } : null
        }));

        // 2. Send System Message
        await sendMessage("❌ Reservation rejected by Owner");
    }
}));
