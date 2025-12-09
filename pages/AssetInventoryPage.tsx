
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssetStore } from '../stores/assetStore';
import { DomainType, LeaseStatus } from '../types';
import { Plus, Car, Home, Hammer, Building2, Search, Trash2, Edit2, MapPin, Hash, Zap } from 'lucide-react';
import { BrandLogo } from '../components/ui/BrandLogo';

const DOMAIN_ICONS: Record<DomainType, React.ReactNode> = {
  vehicle: <Car size={18} />,
  property: <Home size={18} />,
  equipment: <Hammer size={18} />,
  coworking: <Building2 size={18} />,
};

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  booked: 'bg-blue-100 text-blue-700 border-blue-200',
  maintenance: 'bg-orange-100 text-orange-700 border-orange-200',
};

export default function AssetInventoryPage() {
  const navigate = useNavigate();
  const { assets, deleteAsset } = useAssetStore();
  const [filter, setFilter] = useState<DomainType | 'all'>('all');
  const [search, setSearch] = useState('');

  const filteredAssets = assets.filter(a => {
    const matchesFilter = filter === 'all' || a.domainType === filter;
    const matchesSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || 
                          JSON.stringify(a.attributes).toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this asset?')) {
      deleteAsset(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-4">
                <BrandLogo className="h-6 text-slate-900" />
                <div className="h-6 w-px bg-slate-200"></div>
                <h1 className="font-bold text-slate-700 text-lg">Inventory <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full ml-2 align-middle">V2</span></h1>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => navigate('/')} 
                    className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                    Back to V1
                </button>
                <button 
                    onClick={() => navigate('/v2/assets')} 
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all active:scale-95"
                >
                    <Plus size={18} /> New Asset
                </button>
            </div>
        </header>

        {/* Controls */}
        <div className="px-6 py-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                {/* Search */}
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search assets..." 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto max-w-full">
                    <button 
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filter === 'all' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        All
                    </button>
                    {(['vehicle', 'property', 'equipment', 'coworking'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${filter === type ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {DOMAIN_ICONS[type]}
                            <span className="capitalize">{type}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {filteredAssets.map(asset => (
                    <div 
                        key={asset.id} 
                        onClick={() => navigate(`/v2/assets?id=${asset.id}`)}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group overflow-hidden relative flex flex-col h-[280px]"
                    >
                        {/* Type Indicator Stripe */}
                        <div className={`h-1.5 w-full ${asset.domainType === 'vehicle' ? 'bg-blue-500' : asset.domainType === 'property' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        
                        <div className="p-5 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2.5 rounded-xl ${asset.domainType === 'vehicle' ? 'bg-blue-50 text-blue-600' : asset.domainType === 'property' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {DOMAIN_ICONS[asset.domainType]}
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider ${STATUS_COLORS[asset.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                    {asset.status}
                                </span>
                            </div>

                            <h3 className="font-bold text-slate-900 text-lg mb-1 line-clamp-1">{asset.name || 'Unnamed Asset'}</h3>
                            <p className="text-xs text-slate-400 font-mono mb-4">ID: {asset.id.toUpperCase()}</p>

                            {/* Attributes Summary */}
                            <div className="space-y-2 mb-auto">
                                {asset.domainType === 'vehicle' && (
                                    <>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <Hash size={14} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{asset.attributes.plate || 'No Plate'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <Zap size={14} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{asset.attributes.fuelType || 'Unknown Fuel'}</span>
                                        </div>
                                    </>
                                )}
                                {asset.domainType === 'property' && (
                                    <>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <MapPin size={14} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{asset.attributes.address || 'No Address'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <Home size={14} className="text-slate-400 shrink-0" />
                                            <span>{asset.attributes.bedrooms || 0} Bed • {asset.attributes.bathrooms || 0} Bath</span>
                                        </div>
                                    </>
                                )}
                                {(asset.domainType === 'equipment' || asset.domainType === 'coworking') && (
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <Hash size={14} className="text-slate-400 shrink-0" />
                                        <span className="truncate">S/N: {asset.attributes.serialNumber || 'N/A'}</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] text-slate-400">Edited just now</span>
                                <div className="flex gap-2">
                                    <button 
                                        className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDelete(e, asset.id)}
                                        className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {filteredAssets.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                            <Search size={32} />
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg mb-2">No assets found</h3>
                        <p className="text-slate-500 text-sm max-w-xs mb-6">
                            {filter !== 'all' ? `No ${filter} assets found.` : 'Your inventory is empty.'} Try adding a new asset or using AI Import.
                        </p>
                        <button 
                            onClick={() => navigate('/v2/assets')} 
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all active:scale-95"
                        >
                            Create First Asset
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
