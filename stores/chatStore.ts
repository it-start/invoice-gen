
import { create } from 'zustand';
import { ChatSession, ChatMessage, LeaseData, NtfyMessage, LeaseStatus } from '../types';
import { fetchReservationHistory, fetchNtfyMessages, sendNtfyMessage, loadLeaseData, HistoryEvent, getChatSseUrl } from '../services/ownimaApi';
import { authService } from '../services/authService';
import { dbService } from '../services/dbService';

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

// --- STORE DEFINITION ---

interface ChatState {
    sessions: ChatSession[];
    isHydrated: boolean;
    activeSessionId: string | null;
    isLoading: boolean;
    error: string | null;
    leaseContext: LeaseData | null; // Store the lease data associated with current chat
    activeEventSource: EventSource | null; // Track active SSE connection
    
    // Actions
    hydrate: () => Promise<void>;
    loadChatSession: (reservationId: string) => Promise<void>;
    setActiveSession: (id: string) => void;
    sendMessage: (text: string) => Promise<void>;
    getActiveSession: () => ChatSession | undefined;
    confirmReservation: () => Promise<void>;
    rejectReservation: () => Promise<void>;
    markAsRead: (sessionId: string) => void;
    markMessageAsRead: (sessionId: string, messageId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    sessions: [],
    isHydrated: false,
    activeSessionId: null,
    isLoading: false,
    error: null,
    leaseContext: null,
    activeEventSource: null,

    hydrate: async () => {
        if (get().isHydrated) return;
        
        try {
            const storedSessions = await dbService.getAllSessions();
            set({ sessions: storedSessions, isHydrated: true });
        } catch (e) {
            console.error("Hydration failed", e);
            set({ isHydrated: true }); // Mark as hydrated anyway so we don't block
        }
    },

    loadChatSession: async (reservationId: string) => {
        // Ensure store is hydrated first to check for existing data
        if (!get().isHydrated) {
            await get().hydrate();
        }

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

            // Create a map of existing messages to preserve status (read/sent)
            const localMsgMap = new Map(existingSession?.messages.map(m => [m.id, m]));

            // 4. Merge & Sort
            const allMessages = [
                ...historyEvents.map(h => historyToChatMessage(h)),
                ...ntfyData.map((n: any) => {
                    const local = localMsgMap.get(n.id);
                    // Use local status if available (preserve 'read' state)
                    // If new message (fresh load), default to 'read' (history) unless we want to assume unread.
                    // For typical "load history" behavior, we treat fetched history as read if we don't know otherwise.
                    const status = local ? local.status : 'read';
                    return ntfyToChatMessage(n, status);
                })
            ];
            
            allMessages.sort((a, b) => a.timestamp - b.timestamp);

            // Recalculate unread count (incoming 'other' messages with status 'sent')
            const unreadCount = allMessages.filter(m => m.senderId !== 'me' && m.senderId !== 'system' && m.status === 'sent').length;

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
                unreadCount: unreadCount 
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
                
                return {
                    sessions: newSessions,
                    // Ensure activeSessionId is set (in case we did SWR update or full load)
                    activeSessionId: topicId,
                    isLoading: false
                };
            });
            
            // Async Save to DB
            await dbService.saveSession(newSession);

            // 7. Establish SSE Connection for Live Updates
            const sseUrl = getChatSseUrl(topicId);
            const eventSource = new EventSource(sseUrl);
            
            eventSource.onmessage = (event) => {
                try {
                    const ntfyMsg = JSON.parse(event.data);
                    if (ntfyMsg.event !== 'message') return;
                    
                    // Always mark incoming live messages as 'sent' (unread) initially.
                    // The UI IntersectionObserver will mark them as 'read' when visible.
                    const status = 'sent';

                    const chatMsg = ntfyToChatMessage(ntfyMsg, status);
                    
                    set(state => {
                        const sessionIndex = state.sessions.findIndex(s => s.id === topicId);
                        if (sessionIndex === -1) return {};

                        const session = state.sessions[sessionIndex];
                        // Deduplicate based on ID
                        if (session.messages.some(m => m.id === chatMsg.id)) return {};

                        const updatedMessages = [...session.messages, chatMsg];
                        
                        // Increment unread count (if message is not from me)
                        // Note: ntfyToChatMessage handles senderId logic. 
                        // If I sent it (via another device), senderId is 'me', so unreadCount shouldn't increase.
                        const isIncoming = chatMsg.senderId !== 'me' && chatMsg.senderId !== 'system';
                        const newUnreadCount = isIncoming ? (session.unreadCount || 0) + 1 : (session.unreadCount || 0);

                        const updatedSession = {
                            ...session,
                            messages: updatedMessages,
                            lastMessage: chatMsg.text,
                            lastMessageTime: chatMsg.timestamp,
                            unreadCount: newUnreadCount
                        };
                        
                        const newSessions = [...state.sessions];
                        newSessions[sessionIndex] = updatedSession;
                        
                        // Async Save (fire and forget for UI responsiveness)
                        dbService.saveSession(updatedSession);
                        
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
        // NOTE: We no longer auto-mark as read here. Visibility observer handles it.
    },

    markAsRead: (sessionId: string) => {
        set(state => {
            const sessionIdx = state.sessions.findIndex(s => s.id === sessionId);
            if (sessionIdx === -1) return {};
            
            const session = state.sessions[sessionIdx];
            // Mark all messages as read
            const newMessages = session.messages.map(m => ({ ...m, status: 'read' as const }));
            
            const newSession = { ...session, messages: newMessages, unreadCount: 0 };
            const newSessions = [...state.sessions];
            newSessions[sessionIdx] = newSession;
            
            dbService.saveSession(newSession);
            return { sessions: newSessions };
        });
    },

    markMessageAsRead: (sessionId: string, messageId: string) => {
        set(state => {
            const sessionIdx = state.sessions.findIndex(s => s.id === sessionId);
            if (sessionIdx === -1) return {};

            const session = state.sessions[sessionIdx];
            const msgIdx = session.messages.findIndex(m => m.id === messageId);
            
            // If message not found or already read, do nothing
            if (msgIdx === -1 || session.messages[msgIdx].status === 'read') return {};

            const newMessages = [...session.messages];
            newMessages[msgIdx] = { ...newMessages[msgIdx], status: 'read' };

            // Decrement unread count, ensure it doesn't go below 0
            const newUnreadCount = Math.max(0, session.unreadCount - 1);

            const newSession = {
                ...session,
                messages: newMessages,
                unreadCount: newUnreadCount
            };

            const newSessions = [...state.sessions];
            newSessions[sessionIdx] = newSession;

            dbService.saveSession(newSession);

            return { sessions: newSessions };
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

        let updatedSession: ChatSession | undefined;

        const updatedSessions = sessions.map(session => {
            if (session.id === activeSessionId) {
                updatedSession = {
                    ...session,
                    messages: [...session.messages, newMsg],
                    lastMessage: text,
                    lastMessageTime: now
                };
                return updatedSession;
            }
            return session;
        });

        set({ sessions: updatedSessions });
        
        if (updatedSession) {
            await dbService.saveSession(updatedSession);
        }

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
