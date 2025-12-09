
import React, { useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAssetStore } from '../../stores/assetStore';
import { useBookingStore } from '../../stores/bookingStore';
import { mapLeaseToV2 } from '../../utils/domainMapping';
import { LeaseData, ChatSession } from '../../types';
import { X, ArrowRight, CheckCircle, Car, AlertCircle } from 'lucide-react';

interface MigrationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({ isOpen, onClose }) => {
    const { sessions } = useChatStore();
    const { addAsset } = useAssetStore();
    const { addBooking } = useBookingStore();
    
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<{asset: any, booking: any} | null>(null);
    const [migratedIds, setMigratedIds] = useState<string[]>([]);

    if (!isOpen) return null;

    // Filter sessions that look like rentals
    const rentalSessions = sessions.filter(s => s.reservationSummary && s.reservationSummary.vehicleName);

    const handleSelect = (session: ChatSession) => {
        setSelectedSessionId(session.id);
        
        // Reconstruct a temporary LeaseData object from the summary for mapping
        // In a real app, we might want to load the full lease data from DB/API
        const tempLease: LeaseData = {
            ...session.reservationSummary as any, // unsafe cast for demo, mostly needs vehicle/status
            reservationId: session.id,
            vehicle: {
                name: session.reservationSummary?.vehicleName || '',
                plate: session.reservationSummary?.plateNumber || '',
                details: ''
            },
            status: session.reservationSummary?.status,
            pickup: { date: new Date().toISOString().split('T')[0], time: '12:00', fee: 0 }, // Mock dates if missing in summary
            dropoff: { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '12:00', fee: 0 },
            pricing: { total: session.reservationSummary?.price || 0, currency: 'THB' } as any,
            renter: { surname: session.user.name, contact: '' } as any
        };

        const mapped = mapLeaseToV2(tempLease);
        setPreviewData(mapped);
    };

    const handleMigrate = () => {
        if (!previewData || !selectedSessionId) return;
        
        addAsset(previewData.asset);
        addBooking(previewData.booking);
        
        setMigratedIds(prev => [...prev, selectedSessionId]);
        setPreviewData(null);
        setSelectedSessionId(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden">
                
                {/* Left: List */}
                <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col">
                    <div className="p-4 border-b border-slate-200">
                        <h3 className="font-bold text-slate-800">Legacy Rentals</h3>
                        <p className="text-xs text-slate-500">{rentalSessions.length} active sessions</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {rentalSessions.map(session => (
                            <button
                                key={session.id}
                                onClick={() => handleSelect(session)}
                                disabled={migratedIds.includes(session.id)}
                                className={`w-full text-left p-3 rounded-xl border transition-all ${
                                    selectedSessionId === session.id 
                                        ? 'bg-white border-blue-500 ring-2 ring-blue-100 shadow-md' 
                                        : 'bg-white border-slate-200 hover:border-blue-300'
                                } ${migratedIds.includes(session.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-xs text-slate-700 truncate">{session.reservationSummary?.vehicleName}</span>
                                    {migratedIds.includes(session.id) && <CheckCircle size={14} className="text-green-500" />}
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-500">
                                    <span>{session.reservationSummary?.plateNumber}</span>
                                    <span className="uppercase">{session.reservationSummary?.status}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Preview & Action */}
                <div className="flex-1 flex flex-col bg-white relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400">
                        <X size={20} />
                    </button>

                    <div className="flex-1 p-8 flex flex-col items-center justify-center">
                        {!previewData ? (
                            <div className="text-center text-slate-400">
                                <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Select a rental to preview migration</p>
                            </div>
                        ) : (
                            <div className="w-full max-w-lg">
                                <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Migration Preview</h2>
                                
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 opacity-60">
                                        <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Legacy (V1)</div>
                                        <div className="font-bold text-slate-700">{previewData.asset.name}</div>
                                        <div className="text-xs text-slate-500">LeaseData Object</div>
                                    </div>
                                    
                                    <ArrowRight size={24} className="text-blue-500" />
                                    
                                    <div className="flex-1 bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                                        <div className="text-[10px] font-bold uppercase text-blue-400 mb-1">Target (V2)</div>
                                        <div className="font-bold text-blue-900">{previewData.asset.name}</div>
                                        <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                                            <Car size={12} /> Asset Created
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-hidden">
                                        <div className="text-slate-500 mb-2">class Asset {'{'}</div>
                                        <div className="pl-4">
                                            <span className="text-purple-400">domainType:</span> <span className="text-green-400">"vehicle"</span>,<br/>
                                            <span className="text-purple-400">status:</span> <span className="text-green-400">"{previewData.asset.status}"</span>,<br/>
                                            <span className="text-purple-400">attributes:</span> {'{'} <br/>
                                            <span className="pl-4 text-blue-300">plate: "{previewData.asset.attributes.plate}"</span><br/>
                                            {'}'}
                                        </div>
                                        <div className="text-slate-500 mt-2">{'}'}</div>
                                    </div>

                                    <button 
                                        onClick={handleMigrate}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        Migrate to V2
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
