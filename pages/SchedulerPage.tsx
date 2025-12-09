
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssetStore } from '../stores/assetStore';
import { useBookingStore } from '../stores/bookingStore';
import { DomainType } from '../types';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, User, DollarSign } from 'lucide-react';
import { BrandLogo } from '../components/ui/BrandLogo';

const DOMAIN_COLORS: Record<DomainType, string> = {
  vehicle: 'bg-blue-500 border-blue-600 text-white',
  property: 'bg-emerald-500 border-emerald-600 text-white',
  equipment: 'bg-amber-500 border-amber-600 text-white',
  coworking: 'bg-purple-500 border-purple-600 text-white',
};

const DOMAIN_LABELS: Record<DomainType, string> = {
  vehicle: 'Vehicles',
  property: 'Properties',
  equipment: 'Equipment',
  coworking: 'Spaces',
};

export default function SchedulerPage() {
  const navigate = useNavigate();
  const { assets } = useAssetStore();
  const { bookings } = useBookingStore();
  
  const [startDate, setStartDate] = useState(new Date());
  const [activeDomains, setActiveDomains] = useState<DomainType[]>(['vehicle', 'property', 'equipment', 'coworking']);

  // Generate 30 days window
  const days = useMemo(() => {
    const dates = [];
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // Normalize
    for (let i = 0; i < 30; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [startDate]);

  const filteredAssets = useMemo(() => {
    return assets.filter(a => activeDomains.includes(a.domainType));
  }, [assets, activeDomains]);

  const handleDomainToggle = (type: DomainType) => {
    setActiveDomains(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const shiftDate = (daysToAdd: number) => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + daysToAdd);
    setStartDate(newDate);
  };

  // Helper to calculate position and width of booking bar
  const getBookingStyle = (start: string, end: string) => {
    const timelineStart = days[0].getTime();
    const timelineEnd = days[days.length - 1].getTime() + 86400000; // End of last day
    const bookingStart = new Date(start).getTime();
    const bookingEnd = new Date(end).getTime();

    // Intersection check
    if (bookingEnd < timelineStart || bookingStart > timelineEnd) return null;

    // Clamp dates to timeline view
    const visibleStart = Math.max(bookingStart, timelineStart);
    const visibleEnd = Math.min(bookingEnd, timelineEnd);

    const totalTimelineMs = timelineEnd - timelineStart;
    const startPercent = ((visibleStart - timelineStart) / totalTimelineMs) * 100;
    const widthPercent = ((visibleEnd - visibleStart) / totalTimelineMs) * 100;

    return {
      left: `${startPercent}%`,
      width: `${widthPercent}%`
    };
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/v2/inventory')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <ArrowLeft size={20} />
            </button>
            <BrandLogo className="h-6 text-slate-900 hidden md:block" />
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <h1 className="font-bold text-slate-700 text-lg flex items-center gap-2">
                <Calendar size={18} /> Scheduler
            </h1>
        </div>

        <div className="flex items-center gap-4">
            {/* Date Controls */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button onClick={() => shiftDate(-7)} className="p-1.5 hover:bg-white rounded-md text-slate-500 transition-all"><ChevronLeft size={16}/></button>
                <span className="px-3 text-xs font-bold text-slate-700 min-w-[100px] text-center">
                    {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <button onClick={() => shiftDate(7)} className="p-1.5 hover:bg-white rounded-md text-slate-500 transition-all"><ChevronRight size={16}/></button>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {(Object.keys(DOMAIN_LABELS) as DomainType[]).map(type => (
                    <button
                        key={type}
                        onClick={() => handleDomainToggle(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            activeDomains.includes(type) 
                                ? `${DOMAIN_COLORS[type]} border-transparent shadow-sm` 
                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                    >
                        {DOMAIN_LABELS[type]}
                    </button>
                ))}
            </div>
        </div>
      </header>

      {/* Scheduler Body */}
      <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar (Assets) */}
          <div className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
              <div className="h-12 border-b border-slate-200 bg-slate-50/50 flex items-center px-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Asset</span>
              </div>
              <div className="flex-1 overflow-y-hidden">
                  {/* Sync scroll with timeline happens via ref logic or simple matching heights */}
                  <div className="flex flex-col">
                      {filteredAssets.map(asset => (
                          <div key={asset.id} className="h-16 border-b border-slate-100 flex items-center px-4 hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => navigate(`/v2/assets?id=${asset.id}`)}>
                              <div>
                                  <div className="font-bold text-sm text-slate-800 line-clamp-1">{asset.name || 'Unnamed'}</div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 group-hover:text-blue-500 transition-colors">
                                      {asset.domainType === 'vehicle' ? asset.attributes.plate : 
                                       asset.domainType === 'property' ? 'Property' : 'Item'}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          {/* Timeline Grid */}
          <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
              <div className="min-w-max">
                  {/* Date Header */}
                  <div className="flex h-12 border-b border-slate-200 bg-white sticky top-0 z-10">
                      {days.map((date, i) => {
                          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                          const isToday = new Date().toDateString() === date.toDateString();
                          return (
                              <div key={i} className={`w-12 md:w-24 shrink-0 border-r border-slate-100 flex flex-col items-center justify-center ${isWeekend ? 'bg-slate-50/50' : ''} ${isToday ? 'bg-blue-50/30' : ''}`}>
                                  <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                  </span>
                                  <span className={`text-sm font-bold ${isToday ? 'text-blue-700' : 'text-slate-700'}`}>
                                      {date.getDate()}
                                  </span>
                              </div>
                          );
                      })}
                  </div>

                  {/* Rows */}
                  <div className="relative">
                      {/* Grid Lines Background */}
                      <div className="absolute inset-0 flex pointer-events-none">
                          {days.map((_, i) => (
                              <div key={i} className="w-12 md:w-24 shrink-0 border-r border-slate-100 h-full"></div>
                          ))}
                      </div>

                      {/* Data Rows */}
                      {filteredAssets.map(asset => {
                          const assetBookings = bookings.filter(b => b.assetId === asset.id);
                          
                          return (
                              <div key={asset.id} className="h-16 border-b border-slate-100 relative w-max">
                                  {/* Just a spacer to match width of headers */}
                                  <div className="flex h-full opacity-0 pointer-events-none">
                                      {days.map((_, i) => (
                                          <div key={i} className="w-12 md:w-24 shrink-0"></div>
                                      ))}
                                  </div>

                                  {/* Booking Bars */}
                                  {assetBookings.map(booking => {
                                      const style = getBookingStyle(booking.startDatetime, booking.endDatetime);
                                      if (!style) return null;

                                      return (
                                          <div 
                                              key={booking.id}
                                              className={`absolute top-2.5 bottom-2.5 rounded-lg shadow-sm border border-white/20 transition-all hover:brightness-95 hover:scale-[1.01] hover:z-10 group cursor-pointer overflow-hidden ${DOMAIN_COLORS[asset.domainType]} ${booking.status === 'pending' ? 'opacity-60 border-dashed' : ''}`}
                                              style={style}
                                              title={`${booking.userId} • ${new Date(booking.startDatetime).toLocaleDateString()} - ${new Date(booking.endDatetime).toLocaleDateString()}`}
                                          >
                                              <div className="px-2 h-full flex items-center gap-2">
                                                  <User size={12} className="opacity-70 shrink-0" />
                                                  <span className="text-[10px] font-bold truncate">{booking.userId}</span>
                                              </div>
                                              
                                              {/* Tooltip */}
                                              <div className="opacity-0 group-hover:opacity-100 absolute top-full mt-1 left-0 bg-slate-800 text-white text-xs p-2 rounded shadow-xl z-50 whitespace-nowrap pointer-events-none transition-opacity delay-100">
                                                  <div className="font-bold mb-1">{asset.name}</div>
                                                  <div className="text-slate-300 mb-1">{new Date(booking.startDatetime).toLocaleDateString()} — {new Date(booking.endDatetime).toLocaleDateString()}</div>
                                                  <div className="flex items-center gap-1 text-emerald-400 font-mono">
                                                      <DollarSign size={10} />
                                                      {booking.pricing.totalAmount.toLocaleString()} {booking.pricing.currencyCode}
                                                  </div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
