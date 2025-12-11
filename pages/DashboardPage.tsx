import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssetStore } from '../stores/assetStore';
import { useBookingStore } from '../stores/bookingStore';
import { BrandLogo } from '../components/ui/BrandLogo';
import { StatCard } from '../components/dashboard/StatCard';
import { BarChart3, TrendingUp, Users, Wallet, ArrowRight, Car, Home, Hammer, Building2, Calendar } from 'lucide-react';
import { DomainType } from '../types';

const DOMAIN_ICONS: Record<DomainType, React.ReactNode> = {
  vehicle: <Car size={16} />,
  property: <Home size={16} />,
  equipment: <Hammer size={16} />,
  coworking: <Building2 size={16} />,
};

const DOMAIN_COLORS: Record<DomainType, string> = {
  vehicle: 'bg-blue-500',
  property: 'bg-emerald-500',
  equipment: 'bg-amber-500',
  coworking: 'bg-purple-500',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { assets } = useAssetStore();
  const { bookings } = useBookingStore();

  // --- AGGREGATION LOGIC ---
  const stats = useMemo(() => {
    const totalAssets = assets.length;
    const totalRevenue = bookings.reduce((acc, b) => acc + (b.pricing.totalAmount || 0), 0);
    const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'collected').length;
    
    // Revenue by Domain
    const revenueByDomain: Record<string, number> = { vehicle: 0, property: 0, equipment: 0, coworking: 0 };
    bookings.forEach(b => {
        const asset = assets.find(a => a.id === b.assetId);
        if (asset) {
            revenueByDomain[asset.domainType] = (revenueByDomain[asset.domainType] || 0) + (b.pricing.totalAmount || 0);
        }
    });

    // Upcoming Activity (Next 5 bookings)
    const upcoming = bookings
        .filter(b => new Date(b.startDatetime) > new Date())
        .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())
        .slice(0, 5)
        .map(b => {
            const asset = assets.find(a => a.id === b.assetId);
            return { ...b, assetName: asset?.name || 'Unknown Asset', domain: asset?.domainType };
        });

    return { totalAssets, totalRevenue, activeBookings, revenueByDomain, upcoming };
  }, [assets, bookings]);

  const maxRevenue = Math.max(...(Object.values(stats.revenueByDomain) as number[]), 1);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
            <BrandLogo className="h-6 text-slate-900" />
            <div className="h-6 w-px bg-slate-200"></div>
            <h1 className="font-bold text-slate-700 text-lg flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-600" /> Command Center
            </h1>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => navigate('/v2/inventory')} 
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
            >
                Inventory
            </button>
            <button 
                onClick={() => navigate('/v2/scheduler')} 
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
            >
                Scheduler
            </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                label="Total Revenue" 
                value={`$${stats.totalRevenue.toLocaleString()}`} 
                icon={<Wallet size={24} />} 
                color="emerald"
                trend="↗ 12% vs last month"
                trendDirection="up"
            />
            <StatCard 
                label="Active Rentals" 
                value={stats.activeBookings.toString()} 
                icon={<TrendingUp size={24} />} 
                color="blue"
                trend="↗ 4 active now"
                trendDirection="up"
            />
            <StatCard 
                label="Total Assets" 
                value={stats.totalAssets.toString()} 
                icon={<Car size={24} />} 
                color="purple"
            />
            <StatCard 
                label="Unique Customers" 
                value={new Set(bookings.map(b => b.userId)).size.toString()} 
                icon={<Users size={24} />} 
                color="amber"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Revenue Breakdown Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 text-lg">Revenue by Vertical</h3>
                    <button className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                        View Report
                    </button>
                </div>
                
                <div className="space-y-4">
                    {(Object.keys(stats.revenueByDomain) as DomainType[]).map(domain => {
                        const amount = stats.revenueByDomain[domain];
                        const percentage = (amount / maxRevenue) * 100;
                        
                        return (
                            <div key={domain} className="group">
                                <div className="flex justify-between text-sm font-medium mb-1.5">
                                    <div className="flex items-center gap-2 text-slate-700 capitalize">
                                        {DOMAIN_ICONS[domain]} {domain}
                                    </div>
                                    <div className="font-bold text-slate-900">${amount.toLocaleString()}</div>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${DOMAIN_COLORS[domain]}`} 
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Upcoming Activity */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
                <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                    <Calendar size={18} className="text-slate-400" /> Upcoming Hand-overs
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                    {stats.upcoming.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 italic text-sm">
                            No upcoming activity.
                        </div>
                    ) : (
                        stats.upcoming.map(b => (
                            <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-200 transition-colors cursor-pointer group" onClick={() => navigate(`/v2/assets?id=${b.assetId}`)}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 font-bold shrink-0`}>
                                    {new Date(b.startDatetime).getDate()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-slate-800 truncate">{b.assetName}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        <span className="font-medium text-slate-700">{b.userId}</span> • {new Date(b.startDatetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}