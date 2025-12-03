
import { LeaseData } from "../types";

const API_BASE_URL = 'https://stage.ownima.com/api/v1/reservation';

const mapResponseToLeaseData = (json: any): Partial<LeaseData> => {
    try {
        const r = json.reservation;
        const v = r.vehicle;
        const i = r.invoice;
        const p = r.pick_up;
        const d = r.drop_off;
        const rider = r.rider;

        // Construct vehicle details
        const brand = v.general_info?.brand || '';
        const model = v.general_info?.model || '';
        const year = v.general_info?.year || '';
        const body = v.general_info?.body_type || '';
        const trans = v.specification_info?.transmission || '';
        const color = v.general_info?.color || '';

        return {
            reservationId: r.id,
            source: r.humanized?.source || r.source,
            createdDate: r.created_date ? r.created_date.split('T').join(' ').slice(0, 16) : '',
            vehicle: {
                name: `${brand} ${model}, ${year}`.trim(),
                details: [body, trans, color].filter(Boolean).join(' • '),
                plate: v.general_info?.reg_number || ''
            },
            pickup: {
                date: r.date_from ? r.date_from.split('T')[0] : '',
                time: p.collect_time ? `${p.collect_time.start} - ${p.collect_time.end}` : ''
            },
            dropoff: {
                date: r.date_to ? r.date_to.split('T')[0] : '',
                time: d.return_time ? `${d.return_time.start} - ${d.return_time.end}` : ''
            },
            pricing: {
                daysRegular: i.prices?.regular_price_days || 0,
                priceRegular: i.prices?.regular_price_total || 0,
                daysSeason: i.prices?.season_price_days || 0,
                priceSeason: i.prices?.season_price_total || 0,
                // Use template deposit as fallback if reservation deposit is 0 (common in some API states)
                deposit: v.price_templates?.deposit_amount || 0,
                total: i.total_price || r.total_price || 0
            },
            renter: {
                surname: rider.name || '',
                contact: [rider.phone, rider.email].filter(Boolean).join(' • '),
                passport: '' // Not provided in this API endpoint usually
            },
            // Reset owner to default or keep empty as it's not strictly in this JSON
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

export const fetchReservation = async (id: string): Promise<Partial<LeaseData> | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            headers: {
                'accept': 'application/json'
            }
        });

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
