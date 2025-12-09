
import React, { useState } from 'react';
import { BookingV2 } from '../../types';
import InputGroup from '../ui/InputGroup';
import { Plus, Calendar, Clock, Trash2, AlertCircle, X } from 'lucide-react';
import { checkDateOverlap } from '../../utils/dateUtils';

interface AssetScheduleManagerProps {
    assetId: string;
    bookings: BookingV2[];
    onAddBooking: (booking: BookingV2) => void;
    onDeleteBooking: (id: string) => void;
}

const STATUS_BADGES: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-slate-100 text-slate-600 border-slate-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
};

export const AssetScheduleManager: React.FC<AssetScheduleManagerProps> = ({ assetId, bookings, onAddBooking, onDeleteBooking }) => {
    const [showForm, setShowForm] = useState(false);
    const [newBooking, setNewBooking] = useState<Partial<BookingV2>>({
        userId: '',
        startDatetime: new Date().toISOString().split('T')[0],
        endDatetime: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        status: 'confirmed',
        pricing: { totalAmount: 0, currencyCode: 'THB' }
    });

    // Validations
    const hasConflict = showForm && bookings.some(b => 
        b.status !== 'cancelled' && 
        checkDateOverlap(newBooking.startDatetime!, newBooking.endDatetime!, b.startDatetime, b.endDatetime)
    );

    const handleCreate = () => {
        if (!newBooking.userId || !newBooking.startDatetime || !newBooking.endDatetime) return;
        if (new Date(newBooking.endDatetime) <= new Date(newBooking.startDatetime)) {
            alert("End date must be after start date");
            return;
        }

        const booking: BookingV2 = {
            id: `bkg_${Math.random().toString(36).substr(2, 9)}`,
            assetId: assetId,
            userId: newBooking.userId,
            startDatetime: newBooking.startDatetime,
            endDatetime: newBooking.endDatetime,
            status: newBooking.status as any,
            pricing: newBooking.pricing as any
        };
        
        onAddBooking(booking);
        setShowForm(false);
        // Reset form
        setNewBooking({
            userId: '',
            startDatetime: new Date().toISOString().split('T')[0],
            endDatetime: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            status: 'confirmed',
            pricing: { totalAmount: 0, currencyCode: 'THB' }
        });
    };

    // Stats Calculation
    const revenue = bookings.reduce((acc, b) => acc + (b.pricing?.totalAmount || 0), 0);
    const occupancy = bookings.length > 0 ? Math.min(100, bookings.length * 10) + '%' : '0%';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
                <StatCard label="Bookings" value={bookings.length.toString()} color="blue" />
                <StatCard label="Revenue" value={revenue.toLocaleString()} color="emerald" />
                <StatCard label="Occupancy" value={occupancy} color="purple" />
            </div>

            {/* New Booking Form Toggle */}
            {!showForm ? (
                <button 
                    onClick={() => setShowForm(true)}
                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={20} /> Add Manual Booking
                </button>
            ) : (
                <div className={`bg-white border rounded-2xl p-6 shadow-lg transition-all ${hasConflict ? 'border-red-300 shadow-red-50' : 'border-blue-200 shadow-blue-50'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                            <Calendar size={16} className="text-blue-600" /> New Reservation
                        </h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                    </div>
                    
                    <div className="space-y-4">
                        <InputGroup label="Customer Name" value={newBooking.userId || ''} onChange={v => setNewBooking({...newBooking, userId: v})} placeholder="John Doe" />
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Start Date" type="date" value={newBooking.startDatetime || ''} onChange={v => setNewBooking({...newBooking, startDatetime: v})} />
                            <InputGroup label="End Date" type="date" value={newBooking.endDatetime || ''} onChange={v => setNewBooking({...newBooking, endDatetime: v})} />
                        </div>
                        
                        {hasConflict && (
                            <div className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">
                                <AlertCircle size={16} /> Warning: Dates overlap with an existing booking.
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Total Amount" type="number" value={newBooking.pricing?.totalAmount || 0} onChange={v => setNewBooking({...newBooking, pricing: { ...newBooking.pricing!, totalAmount: Number(v) }})} />
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">Status</label>
                                <select 
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-4 focus:ring-blue-100"
                                    value={newBooking.status}
                                    onChange={e => setNewBooking({...newBooking, status: e.target.value as any})}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>
                        <button 
                            onClick={handleCreate} 
                            disabled={hasConflict}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Booking
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">History</h3>
                {bookings.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">No bookings yet.</div>
                ) : (
                    bookings.sort((a,b) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime()).map(booking => (
                        <BookingItem key={booking.id} booking={booking} onDelete={() => onDeleteBooking(booking.id)} />
                    ))
                )}
            </div>
        </div>
    );
};

// Sub-components for cleaner render
const StatCard = ({ label, value, color }: { label: string, value: string, color: string }) => (
    <div className={`bg-${color}-50 p-4 rounded-xl border border-${color}-100`}>
        <div className={`text-${color}-500 text-xs font-bold uppercase mb-1`}>{label}</div>
        <div className={`text-2xl font-bold text-${color}-900 truncate`}>{value}</div>
    </div>
);

const BookingItem = ({ booking, onDelete }: { booking: BookingV2, onDelete: () => void }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between hover:border-blue-300 transition-colors group gap-3">
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-500 bg-slate-100 shrink-0`}>
                {booking.userId.charAt(0).toUpperCase()}
            </div>
            <div>
                <div className="font-bold text-slate-800 text-sm">{booking.userId}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Clock size={12} />
                    {new Date(booking.startDatetime).toLocaleDateString()} 
                    <span className="text-slate-300">→</span> 
                    {new Date(booking.endDatetime).toLocaleDateString()}
                </div>
            </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-14 sm:pl-0">
            <div className="text-left sm:text-right">
                <div className="font-bold text-slate-900">{booking.pricing.totalAmount.toLocaleString()} <span className="text-[10px] text-slate-400">{booking.pricing.currencyCode}</span></div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wide inline-block mt-1 ${STATUS_BADGES[booking.status] || 'bg-slate-100 text-slate-500'}`}>
                    {booking.status}
                </span>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                title="Delete Booking"
            >
                <Trash2 size={16} />
            </button>
        </div>
    </div>
);
