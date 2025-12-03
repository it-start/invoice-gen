import React from 'react';
import { LeaseData } from '../../types';
import InputGroup from '../ui/InputGroup';
import { Plus, Trash2 } from 'lucide-react';

interface LeaseFormProps {
  data: LeaseData;
  handlers: {
      updateLease: (section: keyof LeaseData | null, field: string, value: any) => void;
      addExtraOption: () => void;
      updateExtraOption: (index: number, field: 'name' | 'price', value: any) => void;
      removeExtraOption: (index: number) => void;
  }
}

const LeaseForm: React.FC<LeaseFormProps> = ({ data, handlers }) => {
  const { updateLease, addExtraOption, updateExtraOption, removeExtraOption } = handlers;

  return (
    <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Meta Info</h3>
             <div className="grid grid-cols-2 gap-2">
                <InputGroup label="Res ID" value={data.reservationId} onChange={(v) => updateLease(null, 'reservationId', v)} />
                <InputGroup label="Source" value={data.source} onChange={(v) => updateLease(null, 'source', v)} />
             </div>
             <InputGroup label="Created On" value={data.createdDate} onChange={(v) => updateLease(null, 'createdDate', v)} />
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Vehicle</h3>
             <InputGroup label="Vehicle Name" value={data.vehicle.name} onChange={(v) => updateLease('vehicle', 'name', v)} />
             <InputGroup label="Details (Type, Color)" value={data.vehicle.details} onChange={(v) => updateLease('vehicle', 'details', v)} />
             <InputGroup label="Plate Number" value={data.vehicle.plate} onChange={(v) => updateLease('vehicle', 'plate', v)} />
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Schedule</h3>
             <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded border">
                    <span className="text-xs font-bold text-gray-400 block mb-2">Pick-up</span>
                    <InputGroup label="Date" type="date" value={data.pickup.date} onChange={(v) => updateLease('pickup', 'date', v)} />
                    <InputGroup label="Time" value={data.pickup.time} onChange={(v) => updateLease('pickup', 'time', v)} />
                </div>
                 <div className="bg-white p-2 rounded border">
                    <span className="text-xs font-bold text-gray-400 block mb-2">Return</span>
                    <InputGroup label="Date" type="date" value={data.dropoff.date} onChange={(v) => updateLease('dropoff', 'date', v)} />
                    <InputGroup label="Time" value={data.dropoff.time} onChange={(v) => updateLease('dropoff', 'time', v)} />
                </div>
             </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Financials (THB)</h3>
             <div className="grid grid-cols-2 gap-2 mb-2">
                <InputGroup label="Regular Days" type="number" value={data.pricing.daysRegular} onChange={(v) => updateLease('pricing', 'daysRegular', Number(v))} />
                <InputGroup label="Regular Price" type="number" value={data.pricing.priceRegular} onChange={(v) => updateLease('pricing', 'priceRegular', Number(v))} />
             </div>
             <div className="grid grid-cols-2 gap-2 mb-2">
                <InputGroup label="Season Days" type="number" value={data.pricing.daysSeason} onChange={(v) => updateLease('pricing', 'daysSeason', Number(v))} />
                <InputGroup label="Season Price" type="number" value={data.pricing.priceSeason} onChange={(v) => updateLease('pricing', 'priceSeason', Number(v))} />
             </div>
             <div className="grid grid-cols-2 gap-2 border-t pt-2">
                <InputGroup label="Deposit" type="number" value={data.pricing.deposit} onChange={(v) => updateLease('pricing', 'deposit', Number(v))} />
                <InputGroup label="TOTAL" type="number" value={data.pricing.total} onChange={(v) => updateLease('pricing', 'total', Number(v))} />
             </div>
             
             {/* Extra Options */}
             <div className="mt-4">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Extras</span>
                    <button onClick={addExtraOption} className="text-blue-600"><Plus size={16}/></button>
                 </div>
                 {data.extraOptions.map((opt, i) => (
                     <div key={i} className="flex gap-2 mb-2">
                         <input className="w-2/3 text-sm p-1 border rounded" value={opt.name} onChange={e => updateExtraOption(i, 'name', e.target.value)} placeholder="Name" />
                         <input className="w-1/3 text-sm p-1 border rounded" type="number" value={opt.price} onChange={e => updateExtraOption(i, 'price', Number(e.target.value))} placeholder="Price" />
                         <button onClick={() => removeExtraOption(i)} className="text-red-400"><Trash2 size={16} /></button>
                     </div>
                 ))}
             </div>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Parties</h3>
             <div className="mb-4">
                 <span className="text-xs font-bold text-gray-400 block mb-2">Owner (Lessor)</span>
                 <InputGroup label="Surname" value={data.owner.surname} onChange={(v) => updateLease('owner', 'surname', v)} />
                 <InputGroup label="Contact" value={data.owner.contact} onChange={(v) => updateLease('owner', 'contact', v)} />
                 <InputGroup label="Address" value={data.owner.address} onChange={(v) => updateLease('owner', 'address', v)} />
             </div>
             <div>
                 <span className="text-xs font-bold text-gray-400 block mb-2">Rider (Tenant)</span>
                 <InputGroup label="Surname" value={data.renter.surname} onChange={(v) => updateLease('renter', 'surname', v)} />
                 <InputGroup label="Contact" value={data.renter.contact} onChange={(v) => updateLease('renter', 'contact', v)} />
                 <InputGroup label="Passport" value={data.renter.passport} onChange={(v) => updateLease('renter', 'passport', v)} />
             </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Terms & Conditions</h3>
             <textarea 
                className="w-full h-32 text-[10px] p-2 border rounded font-mono"
                value={data.terms}
                onChange={(e) => updateLease(null, 'terms', e.target.value)}
             />
        </div>
    </div>
  );
};

export default LeaseForm;