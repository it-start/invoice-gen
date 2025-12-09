
import { LeaseData, Asset, BookingV2, LeaseStatus } from '../types';

/**
 * Maps a Legacy V1 LeaseData object to the new V2 Asset and Booking structures.
 * This implements the "Vehicle -> Generic Asset" mapping strategy.
 */
export const mapLeaseToV2 = (lease: LeaseData, organizationId: string = 'org_1'): { asset: Asset, booking: BookingV2 } => {
    // 1. Generate IDs
    const assetId = `ast_${Math.random().toString(36).substr(2, 9)}`;
    const bookingId = `bkg_${Math.random().toString(36).substr(2, 9)}`;

    // 2. Map Status (V1 -> V2 Asset Status)
    let assetStatus: 'available' | 'booked' | 'maintenance' = 'available';
    const activeStatuses: LeaseStatus[] = ['collected', 'confirmed', 'confirmation_rider', 'confirmation_owner'];
    if (lease.status && activeStatuses.includes(lease.status)) {
        assetStatus = 'booked';
    } else if (lease.status === 'maintenance') {
        assetStatus = 'maintenance';
    }

    // 3. Create Asset (Vehicle Domain)
    const asset: Asset = {
        id: assetId,
        organizationId,
        name: lease.vehicle.name || 'Unnamed Vehicle',
        domainType: 'vehicle',
        status: assetStatus,
        images: [], // V1 doesn't consistently store image URLs in top-level, would need extraction
        attributes: {
            plate: lease.vehicle.plate,
            details: lease.vehicle.details,
            // Attempt to parse details for things like color or type if possible
            importedFromV1: true,
            originalReservationId: lease.reservationId
        }
    };

    // 4. Create Booking
    const booking: BookingV2 = {
        id: bookingId,
        assetId: assetId,
        userId: lease.renter.surname || 'Unknown User', // V1 doesn't have strict User IDs
        status: lease.status || 'pending',
        startDatetime: combineDateTime(lease.pickup.date, lease.pickup.time),
        endDatetime: combineDateTime(lease.dropoff.date, lease.dropoff.time),
        pricing: {
            totalAmount: lease.pricing.total,
            currencyCode: lease.pricing.currency || 'THB',
            details: {
                deposit: lease.pricing.deposit,
                priceRegular: lease.pricing.priceRegular
            }
        },
        contractTermsHash: 'legacy_v1_terms' // Placeholder
    };

    return { asset, booking };
};

// Helper to combine date (YYYY-MM-DD) and time (HH:MM - HH:MM) strings into ISO
const combineDateTime = (dateStr: string, timeStr: string): string => {
    if (!dateStr) return new Date().toISOString();
    
    // Extract first time if range (e.g., "14:00 - 15:00" -> "14:00")
    const time = timeStr ? timeStr.split('-')[0].trim().replace(/\(.*\)/, '').trim() : '12:00';
    
    try {
        return new Date(`${dateStr}T${time}:00`).toISOString();
    } catch (e) {
        return new Date().toISOString();
    }
};
