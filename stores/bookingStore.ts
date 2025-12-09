
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BookingV2 } from '../types';

interface BookingStore {
  bookings: BookingV2[];
  addBooking: (booking: BookingV2) => void;
  updateBooking: (id: string, updates: Partial<BookingV2>) => void;
  deleteBooking: (id: string) => void;
  getBookingsByAsset: (assetId: string) => BookingV2[];
}

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      bookings: [],
      addBooking: (booking) => set((state) => ({ bookings: [booking, ...state.bookings] })),
      updateBooking: (id, updates) => set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b))
      })),
      deleteBooking: (id) => set((state) => ({
        bookings: state.bookings.filter((b) => b.id !== id)
      })),
      getBookingsByAsset: (assetId) => get().bookings.filter((b) => b.assetId === assetId),
    }),
    {
      name: 'ownima_booking_inventory',
    }
  )
);
