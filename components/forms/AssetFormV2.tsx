
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Asset, DomainType, BookingV2 } from '../../types';
import InputGroup from '../ui/InputGroup';
import { Car, Home, Hammer, Building2, Save, RotateCcw, Wand2, Sparkles, ArrowLeft, Calendar, FileText, Plus, User, Clock, CheckCircle } from 'lucide-react';
import { useAiAssistant } from '../../hooks/useAiAssistant';
import { AiModal } from '../modals/AiModal';
import { useAssetStore } from '../../stores/assetStore';
import { useBookingStore } from '../../stores/bookingStore';

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

const STATUS_BADGES: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-slate-100 text-slate-600 border-slate-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
    collected: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

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
  const { getBookingsByAsset, addBooking } = useBookingStore();
  
  const [activeTab, setActiveTab] = useState<'metadata' | 'schedule'>('metadata');
  const [showBookingForm, setShowBookingForm] = useState(false);

  // New Booking State
  const [newBooking, setNewBooking] = useState<Partial<BookingV2>>({
      userId: '',
      startDatetime: new Date().toISOString().split('T')[0],
      endDatetime: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: 'confirmed',
      pricing: { totalAmount: 0, currencyCode: 'THB' }
  });
  
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
        
        // Use functional state update to ensure latest state
        setAsset(prev => ({
            ...prev,
            // If AI detects a domain, switch to it
            domainType: assetData.domainType || prev.domainType,
            name: assetData.name || prev.name,
            // Deep merge attributes: keep existing, overwrite with new AI data
            attributes: { ...prev.attributes, ...assetData.attributes }
        }));
    }
  };

  const handleLoadExample = () => {
    ai.setInput(EXAMPLE_TEXT);
    ai.open();
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

  const handleCreateBooking = () => {
      if (!assetId || !newBooking.userId) return;
      
      const booking: BookingV2 = {
          id: `bkg_${Math.random().toString(36).substr(2, 9)}`,
          assetId: assetId,
          userId: newBooking.userId,
          startDatetime: newBooking.startDatetime!,
          endDatetime: newBooking.endDatetime!,
          status: newBooking.status as any,
          pricing: newBooking.pricing as any
      };
      
      addBooking(booking);
      setShowBookingForm(false);
      setNewBooking({
        userId: '',
        startDatetime: new Date().toISOString().split('T')[0],
        endDatetime: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        status: 'confirmed',
        pricing: { totalAmount: 0, currencyCode: 'THB' }
      });
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

  // --- DYNAMIC FIELD RENDERERS ---

  const renderVehicleFields = () => (
    <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
      <InputGroup 
        label="License Plate" 
        value={asset.attributes.plate || ''} 
        onChange={(v) => updateAttribute('plate', v)} 
        placeholder="e.g. ABC-1234"
      />
      <InputGroup 
        label="VIN / Chassis No." 
        value={asset.attributes.vin || ''} 
        onChange={(v) => updateAttribute('vin', v)} 
        placeholder="17 Characters"
      />
      <InputGroup 
        label="Mileage (km)" 
        value={asset.attributes.mileage || ''} 
        onChange={(v) => updateAttribute('mileage', Number(v))} 
        type="number"
      />
      <InputGroup 
        label="Fuel Type" 
        value={asset.attributes.fuelType || ''} 
        onChange={(v) => updateAttribute('fuelType', v)} 
        placeholder="Petrol, Diesel, EV"
      />
    </div>
  );

  const renderPropertyFields = () => (
    <div className="space-y-4 animate-in fade-in duration-300">
      <InputGroup 
        label="Full Address" 
        value={asset.attributes.address || ''} 
        onChange={(v) => updateAttribute('address', v)} 
        placeholder="Street, City, Zip"
      />
      <div className="grid grid-cols-3 gap-4">
        <InputGroup 
          label="Bedrooms" 
          value={asset.attributes.bedrooms || ''} 
          onChange={(v) => updateAttribute('bedrooms', Number(v))} 
          type="number"
        />
        <InputGroup 
          label="Bathrooms" 
          value={asset.attributes.bathrooms || ''} 
          onChange={(v) => updateAttribute('bathrooms', Number(v))} 
          type="number"
        />
        <InputGroup 
          label="Area (sq m)" 
          value={asset.attributes.area || ''} 
          onChange={(v) => updateAttribute('area', Number(v))} 
          type="number"
        />
      </div>
    </div>
  );

  const renderEquipmentFields = () => (
    <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
      <InputGroup 
        label="Serial Number" 
        value={asset.attributes.serialNumber || ''} 
        onChange={(v) => updateAttribute('serialNumber', v)} 
      />
      <InputGroup 
        label="Model Year" 
        value={asset.attributes.modelYear || ''} 
        onChange={(v) => updateAttribute('modelYear', Number(v))} 
        type="number"
      />
      <div className="col-span-2">
        <InputGroup 
            label="Technical Specs" 
            value={asset.attributes.specs || ''} 
            onChange={(v) => updateAttribute('specs', v)} 
            placeholder="Weight, Power, Dimensions..."
        />
      </div>
    </div>
  );

  const renderScheduleTab = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="text-blue-500 text-xs font-bold uppercase mb-1">Total Bookings</div>
                  <div className="text-2xl font-bold text-blue-900">{assetBookings.length}</div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div className="text-emerald-500 text-xs font-bold uppercase mb-1">Revenue</div>
                  <div className="text-2xl font-bold text-emerald-900">
                      {assetBookings.reduce((acc, b) => acc + (b.pricing?.totalAmount || 0), 0).toLocaleString()}
                  </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <div className="text-purple-500 text-xs font-bold uppercase mb-1">Status</div>
                  <div className="text-2xl font-bold text-purple-900 capitalize">{asset.status}</div>
              </div>
          </div>

          {/* New Booking Action */}
          {!showBookingForm ? (
              <button 
                onClick={() => setShowBookingForm(true)}
                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                  <Plus size={20} /> Add Manual Booking
              </button>
          ) : (
              <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-lg shadow-blue-50">
                  <h3 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center gap-2">
                      <Calendar size={16} className="text-blue-600" /> New Reservation
                  </h3>
                  <div className="space-y-4">
                      <InputGroup label="Customer Name" value={newBooking.userId || ''} onChange={v => setNewBooking({...newBooking, userId: v})} placeholder="John Doe" />
                      <div className="grid grid-cols-2 gap-4">
                          <InputGroup label="Start Date" type="date" value={newBooking.startDatetime?.split('T')[0] || ''} onChange={v => setNewBooking({...newBooking, startDatetime: v})} />
                          <InputGroup label="End Date" type="date" value={newBooking.endDatetime?.split('T')[0] || ''} onChange={v => setNewBooking({...newBooking, endDatetime: v})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <InputGroup label="Total Amount" type="number" value={newBooking.pricing?.totalAmount || 0} onChange={v => setNewBooking({...newBooking, pricing: { ...newBooking.pricing!, totalAmount: Number(v) }})} />
                          <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">Status</label>
                              <select 
                                className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white outline-none"
                                value={newBooking.status}
                                onChange={e => setNewBooking({...newBooking, status: e.target.value as any})}
                              >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="completed">Completed</option>
                              </select>
                          </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                          <button onClick={() => setShowBookingForm(false)} className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
                          <button onClick={handleCreateBooking} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Create Booking</button>
                      </div>
                  </div>
              </div>
          )}

          {/* Booking List */}
          <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Booking History</h3>
              {assetBookings.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">No bookings yet.</div>
              ) : (
                  assetBookings.map(booking => (
                      <div key={booking.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:border-blue-300 transition-colors cursor-default">
                          <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-500 bg-slate-100`}>
                                  {booking.userId.charAt(0)}
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
                          <div className="text-right">
                              <div className="font-bold text-slate-900">{booking.pricing.totalAmount.toLocaleString()} <span className="text-[10px] text-slate-400">{booking.pricing.currencyCode}</span></div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wide inline-block mt-1 ${STATUS_BADGES[booking.status] || 'bg-slate-100 text-slate-500'}`}>
                                  {booking.status}
                              </span>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
  );

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
                    onClick={handleLoadExample}
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

            {/* DYNAMIC ATTRIBUTES */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                    asset.domainType === 'vehicle' ? 'bg-blue-500' : 
                    asset.domainType === 'property' ? 'bg-emerald-500' : 
                    'bg-amber-500'
                }`}></div>
                
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex justify-between">
                    <span>{asset.domainType} Attributes</span>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">JSONB Mapped</span>
                </h3>
                
                {asset.domainType === 'vehicle' && renderVehicleFields()}
                {asset.domainType === 'property' && renderPropertyFields()}
                {(asset.domainType === 'equipment' || asset.domainType === 'coworking') && renderEquipmentFields()}
            </div>

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
          renderScheduleTab()
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
