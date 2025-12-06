

import { LeaseData, INITIAL_LEASE, LeaseStatus } from "../types";
import { authService } from "./authService";
import QRCode from 'qrcode';

// @ts-ignore
const BASE_RESERVATION_URL = process.env.OWNIMA_API_URL || 'https://stage.ownima.com/api/v1/reservation';
// Derive API V1 Root by removing /reservation
const API_V1_ROOT = BASE_RESERVATION_URL.replace(/\/reservation\/?$/, '');

const INVOICE_ENDPOINT = `${API_V1_ROOT}/finance/invoice`;
const OWNER_PROFILE_ENDPOINT = `${API_V1_ROOT}/rider/owner`;
const CHAT_BASE_URL = 'https://stage.ownima.com'; // Dedicated Chat/Ntfy domain
const AVATAR_BASE_URL = 'https://stage.ownima.com';

interface OwnerProfile {
    id: string;
    username: string;
    name: string;
    address: string;
    rent_service_name?: string;
    bio?: string;
}

const humanizeSource = (source: string | null | undefined): string => {
    if (!source) return '';
    const map: Record<string, string> = {
        'SOURCE_ONLINE_RIDER_APP': 'Rider App',
        'SOURCE_ONLINE_BOOKING_WEB': 'Website',
        'SOURCE_OFFLINE_WALK_IN': 'Walk-in'
    };
    
    if (map[source]) return map[source];
    
    // Generic fallback: SOURCE_SOME_THING -> Some Thing
    return source
        .replace(/^SOURCE_/, '')
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
};

const mapApiStatus = (rawStatus: string | undefined): LeaseStatus => {
    if (!rawStatus) return 'pending';
    
    const s = rawStatus.toUpperCase();
    
    if (s.includes('COLLECTED')) return 'collected';
    if (s.includes('COMPLETED')) return 'completed';
    if (s.includes('CONFIRMED')) return 'confirmed';
    if (s.includes('OVERDUE')) return 'overdue';
    if (s.includes('CANCELLED')) return 'cancelled';
    if (s.includes('MAINTENANCE')) return 'maintenance';
    if (s.includes('CONFLICT')) return 'conflict';
    if (s.includes('NO_RESPONSE')) return 'no_response';
    
    // Confirmation states logic
    if (s.includes('CONFIRMATION')) {
        if (s.includes('RIDER')) return 'confirmation_rider';
        if (s.includes('OWNER')) return 'confirmation_owner';
        return 'pending'; // Fallback or old "RESERVATION_CONFIRMATION"
    }
    
    // Fallback logic for generic pending
    if (s.includes('PENDING')) return 'pending';

    return 'pending';
};

const mapResponseToLeaseData = (json: any, ownerProfile?: OwnerProfile | null): Partial<LeaseData> => {
    try {
        const r = json.reservation;
        if (!r) return {};

        const v = r.vehicle || {};
        const i = r.invoice || {};
        const p = r.pick_up || {};
        const d = r.drop_off || {};
        const rider = r.rider || {};

        // Construct vehicle details
        const info = v.general_info || {};
        const specs = v.specification_info || {};
        
        const brand = info.brand || '';
        const model = info.model || '';
        const year = info.year || '';
        const body = info.body_type || '';
        const trans = specs.transmission || '';
        const color = info.color || '';

        // Time Formatting with Highlighting
        const formatTime = (timeObj: any, early: boolean, late: boolean) => {
            if (!timeObj || !timeObj.start || !timeObj.end) return '';
            let t = `${timeObj.start} - ${timeObj.end}`;
            if (early) t += ' (Early)';
            if (late) t += ' (Late)';
            return t;
        };

        const pickupTime = formatTime(p.collect_time, p.asked_early_pickup, p.asked_late_pickup);
        const dropoffTime = formatTime(d.return_time, d.asked_early_return, d.asked_late_return);

        // Determine Display ID (Humanized)
        let reservationId = r.id;
        if (r.humanized?.owner_id && r.humanized?.id) {
            reservationId = `${r.humanized.owner_id}-${r.humanized.id}`;
        }

        // Map Status
        const statusRaw = r.humanized?.status || r.status;
        const status = mapApiStatus(statusRaw);

        // Extra Options Parsing
        // The API returns selected_extra_options as an array of objects wrapping the actual option and calculation
        const rawOptions = r.selected_extra_options || [];
        const extraOptions = rawOptions.map((item: any) => ({
            name: item.extra_option?.name || 'Option',
            price: item.calculated_price ?? 0
        }));

        // Owner Info Mapping
        const ownerSurname = ownerProfile?.rent_service_name || ownerProfile?.name || 'Your Surname';
        const ownerAddress = ownerProfile?.address || 'Address line';
        // Use username or bio as contact placeholder since phone/email are not explicitly in profile schema
        const ownerContact = ownerProfile?.username || '+000000000';

        // Pickup/Dropoff Fees logic
        const pickupFee = (p.asked_early_pickup || p.asked_late_pickup) ? (p.extra_price || 0) : 0;
        const dropoffFee = (d.asked_early_return || d.asked_late_return) ? (d.extra_price || 0) : 0;

        // Avatar Mapping
        const avatarPath = rider.avatar;
        const avatarUrl = avatarPath ? `${AVATAR_BASE_URL}${avatarPath}` : undefined;

        return {
            id: r.id, // Store real UUID for API calls
            reservationId: reservationId, // Store humanized ID for Display
            status: status,
            source: humanizeSource(r.humanized?.source),
            createdDate: r.created_date ? r.created_date.split('T').join(' ').slice(0, 16) : '',
            vehicle: {
                name: `${brand} ${model}, ${year}`.trim(),
                details: [body, trans, color].filter(Boolean).join(' • '),
                plate: info.reg_number || ''
            },
            pickup: {
                date: r.date_from ? r.date_from.split('T')[0] : '',
                time: pickupTime,
                fee: pickupFee
            },
            dropoff: {
                date: r.date_to ? r.date_to.split('T')[0] : '',
                time: dropoffTime,
                fee: dropoffFee
            },
            pricing: {
                daysRegular: i.prices?.regular_price_days || 0,
                priceRegular: i.prices?.regular_price_total || 0,
                daysSeason: i.prices?.season_price_days || 0,
                priceSeason: i.prices?.season_price_total || 0,
                // Use template deposit as fallback if reservation deposit is 0
                deposit: v.price_templates?.deposit_amount || 0,
                total: i.total_price || r.total_price || 0
            },
            extraOptions: extraOptions,
            renter: {
                surname: rider.name || '',
                contact: [rider.phone, rider.email].filter(Boolean).join(' • '),
                passport: '',
                avatar: avatarUrl
            },
            owner: {
                surname: ownerSurname,
                contact: ownerContact,
                address: ownerAddress
            }
        };
    } catch (error) {
        console.error("Mapping Error", error);
        return {};
    }
};

const getAuthHeaders = (): Record<string, string> => {
    const token = authService.getToken();
    const headers: Record<string, string> = {
        'accept': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const fetchOwnerProfile = async (ownerId: string): Promise<OwnerProfile | null> => {
    try {
        const response = await fetch(`${OWNER_PROFILE_ENDPOINT}/${ownerId}/profile`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            console.warn(`Failed to fetch owner profile: ${response.status}`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Fetch Owner Profile Error", error);
        return null;
    }
};

export const fetchReservation = async (id: string): Promise<Partial<LeaseData> | null> => {
    try {
        const response = await fetch(`${BASE_RESERVATION_URL}/${id}`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            throw new Error("Unauthorized");
        }

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        let ownerProfile = null;
        const ownerId = data.reservation?.owner_id;
        
        if (ownerId) {
            ownerProfile = await fetchOwnerProfile(ownerId);
        }

        return mapResponseToLeaseData(data, ownerProfile);

    } catch (error) {
        console.error("Fetch Reservation Error", error);
        throw error;
    }
};

/**
 * Loads full lease data including fetching from API, generating QR code,
 * and merging with default values to ensure a complete object.
 */
export const loadLeaseData = async (id: string): Promise<LeaseData> => {
    // 1. Fetch data from API (now includes owner profile fetch)
    const apiData = await fetchReservation(id);
    
    if (!apiData) {
        throw new Error("Reservation not found");
    }

    // 2. Generate QR Code
    let qrCodeUrl = undefined;
    try {
        const url = `https://stage.ownima.com/qr/${id}`;
        qrCodeUrl = await QRCode.toDataURL(url, { margin: 1, width: 200 });
    } catch (e) {
        console.error("QR Error", e);
    }

    // 3. Merge with default structure
    // Deep merge specific objects to avoid overwriting entire objects with partial data
    return {
        ...INITIAL_LEASE,
        ...apiData,
        // reservationId: id, // Ensure ID matches what was requested
        vehicle: { ...INITIAL_LEASE.vehicle, ...apiData.vehicle },
        pickup: { ...INITIAL_LEASE.pickup, ...apiData.pickup },
        dropoff: { ...INITIAL_LEASE.dropoff, ...apiData.dropoff },
        pricing: { ...INITIAL_LEASE.pricing, ...apiData.pricing },
        owner: { ...INITIAL_LEASE.owner, ...apiData.owner },
        renter: { ...INITIAL_LEASE.renter, ...apiData.renter },
        qrCodeUrl: qrCodeUrl
    };
};

export const fetchInvoiceHtml = async (reservationId: string, templateId: string): Promise<string> => {
    try {
        const url = `${INVOICE_ENDPOINT}/${reservationId}/${templateId}?output=html`;
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            throw new Error("Unauthorized");
        }

        if (!response.ok) {
             throw new Error(`Invoice API Error: ${response.status}`);
        }

        return await response.text();
    } catch (error) {
        console.error("Fetch Invoice HTML Error", error);
        throw error;
    }
};

export const fetchInvoicePdfBlob = async (reservationId: string, templateId: string): Promise<Blob> => {
    try {
        const url = `${INVOICE_ENDPOINT}/${reservationId}/${templateId}?output=pdf`;
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            throw new Error("Unauthorized");
        }

        if (!response.ok) {
             throw new Error(`Invoice API Error: ${response.status}`);
        }

        return await response.blob();
    } catch (error) {
        console.error("Fetch Invoice PDF Error", error);
        throw error;
    }
};

// --- CHAT & HISTORY API ---

export interface HistoryEvent {
    // Assuming structure based on "confirmations" array item
    confirmation_date: string;
    confirmation_note?: string;
    status: number | string;
    meta?: {
        reason_hint?: string;
        confirmed_by?: string;
        [key: string]: any;
    };
    [key: string]: any;
}

export const fetchReservationHistory = async (id: string): Promise<HistoryEvent[]> => {
    try {
        const response = await fetch(`${BASE_RESERVATION_URL}/${id}/history`, {
             headers: getAuthHeaders()
        });
        if (response.status === 401) throw new Error("Unauthorized");
        if (!response.ok) return [];
        
        const data = await response.json();
        
        // Handle nested structure: { history: { confirmations: [] } }
        // The API returns an object with a "history" key, which can be an object containing "confirmations"
        if (data.history) {
            if (Array.isArray(data.history.confirmations)) {
                return data.history.confirmations;
            }
            if (Array.isArray(data.history)) {
                return data.history;
            }
        }
        
        // Fallback or legacy support
        if (Array.isArray(data)) return data;

        return [];
    } catch (e) {
        console.error("History fetch error", e);
        return [];
    }
};

export const fetchNtfyMessages = async (topicId: string) => {
    // Uses Ntfy JSON format (NDJSON)
    try {
        const response = await fetch(`${CHAT_BASE_URL}/chat-${topicId}/json?poll=1&since=all`);
        if (!response.ok) return [];
        const text = await response.text();
        
        // Parse NDJSON (Newline Delimited JSON)
        return text.trim().split('\n')
            .map(line => {
                try { return JSON.parse(line); } catch(e) { return null; }
            })
            .filter((msg: any) => msg && msg.event === 'message'); // Filter for chat messages only
    } catch (e) {
        console.error("Chat fetch error", e);
        return [];
    }
};

export const sendNtfyMessage = async (topicId: string, message: string) => {
    try {
        await fetch(`${CHAT_BASE_URL}/chat-${topicId}`, {
            method: 'POST',
            body: message,
            headers: {
                'Priority': 'low'
            }
        });
    } catch (e) {
        console.error("Send chat error", e);
    }
};

export const getChatSseUrl = (topicId: string) => `${CHAT_BASE_URL}/chat-${topicId}/sse`;