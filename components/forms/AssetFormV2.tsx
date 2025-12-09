
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Asset, DomainType } from '../../types';
import InputGroup from '../ui/InputGroup';
import { Car, Home, Hammer, Building2, Save, Wand2, Sparkles, ArrowLeft, Calendar, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useAiAssistant } from '../../hooks/useAiAssistant';
import { AiModal } from '../modals/AiModal';
import { useAssetStore } from '../../stores/assetStore';
import { useBookingStore } from '../../stores/bookingStore';
import { AssetAttributesEditor } from './AssetAttributesEditor';
import { AssetScheduleManager } from './AssetScheduleManager';

// Initial state generator
const createEmptyAsset = (domain: DomainType = 'vehicle'): Asset => ({
  id: Math.random().toString(36).substr(2, 9),
  organizationId: 'org_1',
  name: '',
  domainType: domain,
  attributes: {},
  images: [],
  status: 'available'
});

const DOMAINS: { type: DomainType; label: string; icon: React.ReactNode }[] = [
  { type: 'vehicle', label: 'Vehicle', icon: <Car size={16} /> },
  { type: 'property', label: 'Property', icon: <Home size={16} /> },
  { type: 'equipment', label: 'Equipment', icon: <Hammer size={16} /> },
  { type: 'coworking', label: 'Coworking', icon: <Building2 size={16} /> },
];

const EXAMPLE_TEXT = `New Inventory Arrival:
2023 Tesla Model Y Long Range
VIN: 7G234672346123456
Color: Pearl White
Mileage: 12,450 km
Type: Electric Vehicle (EV)
Please register this car and set status to Available.`;

export const AssetFormV2: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assetId = searchParams.get('id');
  const { addAsset, updateAsset, getAsset } = useAssetStore();
  const { getBookingsByAsset, addBooking, deleteBooking } = useBookingStore();
  
  const [activeTab, setActiveTab] = useState<'metadata' | 'schedule'>('metadata');
  const [imageUrlInput, setImageUrlInput] = useState('');
  
  // Use English for V2 Beta
  const ai = useAiAssistant('en');

  // Initialize State (Edit vs Create)
  const [asset, setAsset] = useState<Asset>(() => {
      if (assetId) {
          const existing = getAsset(assetId);
          if (existing) return existing;
      }
      return createEmptyAsset('vehicle');
  });

  const assetBookings = assetId ? getBookingsByAsset(assetId) : [];

  const handleDomainChange = (type: DomainType) => {
    // Preserve name, reset attributes when switching domain
    setAsset(prev => ({
      ...prev,
      domainType: type,
      attributes: {} 
    }));
  };

  const handleAiParse = async () => {
    const result = await ai.parse('asset');
    if (result) {
        const assetData = result as Partial<Asset>;
        setAsset(prev => ({
            ...prev,
            domainType: assetData.domainType || prev.domainType,
            name: assetData.name || prev.name,
            attributes: { ...prev.attributes, ...assetData.attributes }
        }));
    }
  };

  const handleSave = () => {
      if (asset.name.trim() === '') {
          alert('Asset name is required');
          return;
      }
      if (assetId) {
          updateAsset(assetId, asset);
      } else {
          addAsset(asset);
      }
      navigate('/v2/inventory');
  };

  const handleAddImage = () => {
      if (!imageUrlInput.trim()) return;
      setAsset(prev => ({
          ...prev,
          images: [...(prev.images || []), imageUrlInput]
      }));
      setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
      setAsset(prev => ({
          ...prev,
          images: prev.images.filter((_, i) => i !== index)
      }));
  };

  const updateAttribute = (key: string, value: string | number) => {
    setAsset(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: value
      }
    }));
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 font-sans text-slate-900">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate('/v2/inventory')}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors border border-slate-200"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-900">{assetId ? 'Manage Asset' : 'New Asset'}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {asset.domainType}
                    </span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${assetId ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {assetId ? 'Active' : 'Draft'}
                    </span>
                </div>
            </div>
        </div>
        
        {/* Only show AI tools in Metadata mode */}
        {activeTab === 'metadata' && (
            <div className="flex gap-2 w-full md:w-auto">
                <button 
                    onClick={() => { ai.setInput(EXAMPLE_TEXT); ai.open(); }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border border-purple-100"
                >
                    <Sparkles size={16} /> Example
                </button>
                <button 
                    onClick={ai.open}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-200 active:scale-95 transition-all"
                >
                    <Wand2 size={16} /> AI Import
                </button>
            </div>
        )}
      </div>

      {/* TABS (Only visible if asset exists) */}
      {assetId && (
          <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
              <button 
                onClick={() => setActiveTab('metadata')}
                className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'metadata' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  <FileText size={16} /> Metadata
              </button>
              <button 
                onClick={() => setActiveTab('schedule')}
                className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'schedule' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  <Calendar size={16} /> Schedule
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px] ml-1">{assetBookings.length}</span>
              </button>
          </div>
      )}

      {/* TAB CONTENT */}
      {activeTab === 'metadata' ? (
          <div className="animate-in fade-in duration-300">
            {/* DOMAIN SWITCHER */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1 bg-slate-100 rounded-xl mb-8">
                {DOMAINS.map((d) => (
                <button
                    key={d.type}
                    onClick={() => handleDomainChange(d.type)}
                    className={`py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    asset.domainType === d.type 
                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                >
                    {d.icon}
                    <span className="hidden sm:inline">{d.label}</span>
                </button>
                ))}
            </div>

            {/* CORE FIELDS (Shared) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Core Metadata</h3>
                <InputGroup 
                    label="Asset Name" 
                    value={asset.name} 
                    onChange={(v) => setAsset(prev => ({ ...prev, name: v }))}
                    placeholder={asset.domainType === 'vehicle' ? 'e.g. BMW X5' : asset.domainType === 'property' ? 'e.g. Seaside Villa' : 'e.g. Excavator 3000'} 
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputGroup 
                        label="Organization ID" 
                        value={asset.organizationId} 
                        onChange={() => {}} 
                        readOnly
                    />
                    <div className="mb-4">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">
                            Status
                        </label>
                        <select 
                            className="w-full px-3 py-2.5 border rounded-lg text-base md:text-sm bg-white outline-none focus:ring-4 focus:ring-blue-500/10 border-slate-300"
                            value={asset.status}
                            onChange={(e) => setAsset(prev => ({ ...prev, status: e.target.value as any }))}
                        >
                            <option value="available">Available</option>
                            <option value="booked">Booked</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* DYNAMIC ATTRIBUTES EDITOR */}
            <AssetAttributesEditor 
                domain={asset.domainType} 
                attributes={asset.attributes} 
                onChange={updateAttribute} 
            />

            {/* IMAGE GALLERY */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Images</h3>
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">{asset.images.length}</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {asset.images.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl bg-slate-100 overflow-hidden group border border-slate-200">
                            <img src={url} alt={`Asset ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <button onClick={() => handleRemoveImage(idx)} className="text-white bg-red-500 p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {asset.images.length === 0 && (
                        <div className="col-span-full py-8 text-center text-slate-400 text-xs italic border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <ImageIcon size={24} className="mx-auto mb-2 opacity-30" />
                            No images added yet.
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Paste image URL..."
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all"
                            value={imageUrlInput}
                            onChange={(e) => setImageUrlInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
                        />
                    </div>
                    <button 
                        onClick={handleAddImage}
                        disabled={!imageUrlInput}
                        className="bg-slate-900 text-white px-5 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* DEBUG DATA VISUALIZER */}
            <div className="bg-slate-900 rounded-2xl p-6 text-slate-300 font-mono text-xs overflow-hidden mb-8 shadow-inner">
                <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-3">
                    <span className="font-bold text-slate-100 flex items-center gap-2">
                        <FileText size={12} /> Live Data Model
                    </span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Read-only</span>
                </div>
                <pre className="whitespace-pre-wrap text-[10px] leading-relaxed opacity-80">
                    {JSON.stringify(asset, null, 2)}
                </pre>
            </div>

            {/* ACTION BAR */}
            <div className="sticky bottom-4 flex justify-end">
                <button 
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-blue-600/30 active:scale-95 transition-all transform hover:-translate-y-0.5"
                >
                    <Save size={18} />
                    {assetId ? 'Update Asset' : 'Create Asset'}
                </button>
            </div>
          </div>
      ) : (
          /* SCHEDULE TAB DELEGATED TO MANAGER */
          assetId ? (
            <AssetScheduleManager 
                assetId={assetId} 
                bookings={assetBookings} 
                onAddBooking={addBooking} 
                onDeleteBooking={deleteBooking} 
            />
          ) : <div className="text-center py-12 text-slate-400">Please save the asset first to manage schedule.</div>
      )}

      <AiModal 
        isOpen={ai.isOpen}
        onClose={ai.close}
        onParse={handleAiParse}
        input={ai.input}
        setInput={ai.setInput}
        isLoading={ai.isLoading}
        error={ai.error}
        apiKeyMissing={ai.apiKeyMissing}
        lang="en"
      />
    </div>
  );
};
