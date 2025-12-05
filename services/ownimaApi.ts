
import { LeaseData } from "../types";
import { authService } from "./authService";

// @ts-ignore
const BASE_RESERVATION_URL = process.env.OWNIMA_API_URL || 'https://stage.ownima.com/api/v1/reservation';
// Derive API V1 Root by removing /reservation
const API_V1_ROOT = BASE_RESERVATION_URL.replace(/\/reservation\/?$/, '');

const INVOICE_ENDPOINT = `${API_V1_ROOT}/finance/invoice`;

const mapResponseToLeaseData = (json: any): Partial<LeaseData> => {
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

        // Extra Options Parsing
        // The API returns selected_extra_options as an array of objects wrapping the actual option and calculation
        const rawOptions = r.selected_extra_options || [];
        const extraOptions = rawOptions.map((item: any) => ({
            name: item.extra_option?.name || 'Option',
            price: item.calculated_price ?? 0
        }));

        return {
            reservationId: r.id,
            source: r.humanized?.source || r.source,
            createdDate: r.created_date ? r.created_date.split('T').join(' ').slice(0, 16) : '',
            vehicle: {
                name: `${brand} ${model}, ${year}`.trim(),
                details: [body, trans, color].filter(Boolean).join(' • '),
                plate: info.reg_number || ''
            },
            pickup: {
                date: r.date_from ? r.date_from.split('T')[0] : '',
                time: pickupTime
            },
            dropoff: {
                date: r.date_to ? r.date_to.split('T')[0] : '',
                time: dropoffTime
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
                passport: '' 
            },
            owner: {
                surname: 'Your Surname',
                contact: '+000000000',
                address: 'Address line'
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
        return mapResponseToLeaseData(data);

    } catch (error) {
        console.error("Fetch Reservation Error", error);
        throw error;
    }
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
