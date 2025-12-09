
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
    <div className="max-w-2xl mx-auto p-6 font-sans text-slate-900">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate('/v2/inventory')}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
                <ArrowLeft size={24} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-900">{assetId ? 'Manage Asset' : 'New Asset'}</h2>
                <p className="text-slate-500 text-sm flex items-center gap-2">
                    {asset.domainType.charAt(0).toUpperCase() + asset.domainType.slice(1)} 
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    {assetId ? 'Active' : 'Draft'}
                </p>
            </div>
        </div>
        
        {/* Only show AI tools in Metadata mode */}
        {activeTab === 'metadata' && (
            <div className="flex gap-2">
                <button 
                    onClick={() => { ai.setInput(EXAMPLE_TEXT); ai.open(); }}
                    className="hidden md:flex items-center gap-2 text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl font-bold text-sm transition-all"
                >
                    <Sparkles size={16} /> Example
                </button>
                <button 
                    onClick={ai.open}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-purple-900/20 active:scale-95 transition-all"
                >
                    <Wand2 size={16} /> AI Import
                </button>
            </div>
        )}
      </div>

      {/* TABS (Only visible if asset exists) */}
      {assetId && (
          <div className="flex border-b border-slate-200 mb-6">
              <button 
                onClick={() => setActiveTab('metadata')}
                className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'metadata' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  <FileText size={16} /> Metadata
              </button>
              <button 
                onClick={() => setActiveTab('schedule')}
                className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'schedule' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  <Calendar size={16} /> Schedule
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px] ml-1">{assetBookings.length}</span>
              </button>
          </div>
      )}

      {/* TAB CONTENT */}
      {activeTab === 'metadata' ? (
          <>
            {/* DOMAIN SWITCHER */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
                {DOMAINS.map((d) => (
                <button
                    key={d.type}
                    onClick={() => handleDomainChange(d.type)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    asset.domainType === d.type 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
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
                
                <div className="grid grid-cols-2 gap-4">
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

            {/* IMAGE GALLERY */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Images</h3>
                    <span className="text-[10px] text-slate-400">{asset.images.length} items</span>
                </div>
                
                <div className="grid grid-cols-4 gap-3 mb-4">
                    {asset.images.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg bg-slate-100 overflow-hidden group border border-slate-200">
                            <img src={url} alt={`Asset ${idx}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleRemoveImage(idx)} className="text-white bg-red-500 p-1.5 rounded-full">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {asset.images.length === 0 && (
                        <div className="col-span-4 py-6 text-center text-slate-400 text-xs italic border-2 border-dashed border-slate-100 rounded-lg">
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
                            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                            value={imageUrlInput}
                            onChange={(e) => setImageUrlInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
                        />
                    </div>
                    <button 
                        onClick={handleAddImage}
                        disabled={!imageUrlInput}
                        className="bg-slate-900 text-white px-4 rounded-lg font-bold text-sm hover:bg-slate-800 disabled:opacity-50"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* DYNAMIC ATTRIBUTES EDITOR */}
            <AssetAttributesEditor 
                domain={asset.domainType} 
                attributes={asset.attributes} 
                onChange={updateAttribute} 
            />

            {/* DEBUG DATA VISUALIZER */}
            <div className="bg-slate-900 rounded-xl p-6 text-slate-300 font-mono text-xs overflow-hidden mb-8">
                <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                    <span className="font-bold text-slate-100">Live Data Model Preview</span>
                    <span className="text-[10px] opacity-50">Read-only</span>
                </div>
                <pre className="whitespace-pre-wrap">
                    {JSON.stringify(asset, null, 2)}
                </pre>
            </div>

            {/* ACTION BAR */}
            <div className="flex justify-end pb-12">
                <button 
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
                >
                    <Save size={18} />
                    {assetId ? 'Update Asset' : 'Save Asset'}
                </button>
            </div>
          </>
      ) : (
          /* SCHEDULE TAB DELEGATED TO MANAGER */
          assetId ? (
            <AssetScheduleManager 
                assetId={assetId} 
                bookings={assetBookings} 
                onAddBooking={addBooking} 
                onDeleteBooking={deleteBooking} 
            />
          ) : <div>Please save asset first</div>
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
