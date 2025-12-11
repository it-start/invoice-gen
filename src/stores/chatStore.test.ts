import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { useChatStore } from './chatStore';
import { dbService } from '../services/dbService';
import { authService } from '../services/authService';
import { 
    loadLeaseData, 
    fetchReservationHistory, 
    fetchNtfyMessages, 
    sendNtfyMessage,
    getChatSseUrl
} from '../services/ownimaApi';
import { INITIAL_LEASE } from '../types';

// Mock Dependencies
vi.mock('../services/dbService', () => ({
    dbService: {
        getAllSessions: vi.fn(),
        saveSession: vi.fn(),
    }
}));

vi.mock('../services/authService', () => ({
    authService: {
        getUsername: vi.fn(),
    }
}));

vi.mock('../services/ownimaApi', () => ({
    loadLeaseData: vi.fn(),
    fetchReservationHistory: vi.fn(),
    fetchNtfyMessages: vi.fn(),
    sendNtfyMessage: vi.fn(),
    sendNtfyImage: vi.fn(),
    getChatSseUrl: vi.fn(),
}));

// Mock EventSource
globalThis.EventSource = vi.fn(() => ({
    onmessage: null,
    onerror: null,
    close: vi.fn(),
})) as any;

describe('chatStore', () => {
    beforeEach(() => {
        useChatStore.setState({
            sessions: [],
            isHydrated: false,
            activeSessionId: null,
            isLoading: false,
            error: null,
            leaseContext: null,
            activeEventSource: null,
            currentLoadToken: 0,
        });
        vi.clearAllMocks();
    });

    it('hydrate should load sessions from DB', async () => {
        const mockSessions = [{ id: '1', user: { name: 'Test' } }];
        (dbService.getAllSessions as Mock).mockResolvedValue(mockSessions);

        await useChatStore.getState().hydrate();

        expect(dbService.getAllSessions).toHaveBeenCalled();
        expect(useChatStore.getState().sessions).toEqual(mockSessions);
        expect(useChatStore.getState().isHydrated).toBe(true);
    });

    it('loadChatSession should fetch data and populate store', async () => {
        const reservationId = 'res-123';
        
        // Mock API responses
        (loadLeaseData as Mock).mockResolvedValue({
            ...INITIAL_LEASE,
            id: reservationId,
            renter: { surname: 'John Doe', contact: '123', avatar: '' },
            vehicle: { name: 'Tesla', plate: 'ABC' },
            status: 'confirmed'
        });
        (fetchReservationHistory as Mock).mockResolvedValue([]);
        (fetchNtfyMessages as Mock).mockResolvedValue([
            { id: 'msg1', time: 1000, event: 'message', message: 'Hello', title: 'John Doe' }
        ]);
        (authService.getUsername as Mock).mockReturnValue('OwnerUser');

        await useChatStore.getState().loadChatSession(reservationId);

        const state = useChatStore.getState();
        expect(state.activeSessionId).toBe(reservationId);
        expect(state.sessions.length).toBe(1);
        
        const session = state.sessions[0];
        expect(session.id).toBe(reservationId);
        expect(session.user.name).toBe('John Doe');
        expect(session.messages.length).toBe(1);
        expect(session.messages[0].text).toBe('Hello');
        expect(session.reservationSummary).toEqual({
            vehicleName: 'Tesla',
            plateNumber: 'ABC',
            status: 'confirmed',
            price: 6904 // from INITIAL_LEASE default
        });
        
        // Verify DB save
        expect(dbService.saveSession).toHaveBeenCalledWith(expect.objectContaining({
            id: reservationId
        }));
    });

    it('sendMessage should update store optimistically and call API', async () => {
        const sessionId = 'session-1';
        const initialSession = {
            id: sessionId,
            user: { name: 'Renter', id: 'r1', role: 'Renter' as const, status: 'online' as const, avatar: '' },
            messages: [],
            lastMessage: '',
            lastMessageTime: 0,
            unreadCount: 0
        };

        useChatStore.setState({
            sessions: [initialSession],
            activeSessionId: sessionId
        });

        await useChatStore.getState().sendMessage('Hello World');

        const state = useChatStore.getState();
        const session = state.sessions.find(s => s.id === sessionId);
        
        // Check optimistic update
        expect(session?.messages.length).toBe(1);
        expect(session?.messages[0].text).toBe('Hello World');
        expect(session?.messages[0].senderId).toBe('me');
        expect(session?.lastMessage).toBe('Hello World');

        // Check API call
        expect(sendNtfyMessage).toHaveBeenCalledWith(sessionId, 'Hello World');
        
        // Check DB persist
        expect(dbService.saveSession).toHaveBeenCalled();
    });

    it('markMessageAsRead should update status and decrement unread count', () => {
        const sessionId = 'session-1';
        const msgId = 'msg-1';
        const initialSession = {
            id: sessionId,
            user: { name: 'Renter', id: 'r1', role: 'Renter' as const, status: 'online' as const, avatar: '' },
            messages: [
                { id: msgId, text: 'Hi', senderId: 'other', status: 'sent', timestamp: 100, type: 'text' as const }
            ],
            lastMessage: 'Hi',
            lastMessageTime: 100,
            unreadCount: 1
        };

        useChatStore.setState({
            sessions: [initialSession],
            activeSessionId: sessionId
        });

        useChatStore.getState().markMessageAsRead(sessionId, msgId);

        const state = useChatStore.getState();
        const session = state.sessions.find(s => s.id === sessionId);

        expect(session?.messages[0].status).toBe('read');
        expect(session?.unreadCount).toBe(0);
        expect(dbService.saveSession).toHaveBeenCalled();
    });
});