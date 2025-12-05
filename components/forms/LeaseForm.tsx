
import React from 'react';
import { LeaseData } from '../../types';
import InputGroup from '../ui/InputGroup';
import { Plus, Trash2, CloudDownload, Loader2 } from 'lucide-react';
import { WizardContainer } from '../ui/WizardContainer';

interface LeaseFormProps {
  data: LeaseData;
  handlers: {
      updateLease: (section: keyof LeaseData | null, field: string, value: any) => void;
      addExtraOption: () => void;
      updateExtraOption: (index: number, field: 'name' | 'price', value: any) => void;
      removeExtraOption: (index: number) => void;
      loadFromApi: () => void;
      isLoading: boolean;
  }
}

const LeaseForm: React.FC<LeaseFormProps> = ({ data, handlers }) => {
  const { updateLease, addExtraOption, updateExtraOption, removeExtraOption, loadFromApi, isLoading } = handlers;

  // Step 1: Info & Vehicle
  const VehicleStep = (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
           <InputGroup label="Res ID" value={data.reservationId} onChange={(v) => updateLease(null, 'reservationId', v)}>
               <button 
                  onClick={loadFromApi}
                  disabled={isLoading}
                  className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  title="Load from Ownima"
               >
                   {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CloudDownload size={16} />}
               </button>
           </InputGroup>
           <InputGroup label="Template ID" value={data.contractTemplateId || ''} onChange={(v) => updateLease(null, 'contractTemplateId', v)} placeholder="Optional" />
        </div>
        <div className="grid grid-cols-2 gap-3">
            <InputGroup label="Source" value={data.source} onChange={(v) => updateLease(null, 'source', v)} />
            <InputGroup label="Created On" value={data.createdDate} onChange={(v) => updateLease(null, 'createdDate', v)} />
        </div>
        
        <div className="pt-4 border-t border-slate-200 mt-4">
             <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 bg-slate-100 p-1 pl-2 rounded">Vehicle Details</h4>
             <InputGroup label="Model Name" value={data.vehicle.name} onChange={(v) => updateLease('vehicle', 'name', v)} />
             <InputGroup label="Details (Type, Color)" value={data.vehicle.details} onChange={(v) => updateLease('vehicle', 'details', v)} />
             <InputGroup label="Plate Number" value={data.vehicle.plate} onChange={(v) => updateLease('vehicle', 'plate', v)} />
        </div>
      </div>
  );

  // Step 2: Schedule
  const ScheduleStep = (
      <div className="space-y-4">
         <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-blue-600 uppercase block mb-3">Pick-up (Start)</span>
            <div className="grid grid-cols-2 gap-3">
                <InputGroup label="Date" type="date" value={data.pickup.date} onChange={(v) => updateLease('pickup', 'date', v)} />
                <InputGroup label="Time" value={data.pickup.time} onChange={(v) => updateLease('pickup', 'time', v)} />
            </div>
         </div>
         <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-red-600 uppercase block mb-3">Return (End)</span>
             <div className="grid grid-cols-2 gap-3">
                <InputGroup label="Date" type="date" value={data.dropoff.date} onChange={(v) => updateLease('dropoff', 'date', v)} />
                <InputGroup label="Time" value={data.dropoff.time} onChange={(v) => updateLease('dropoff', 'time', v)} />
            </div>
         </div>
      </div>
  );

  // Step 3: Financials
  const FinancialsStep = (
      <div className="space-y-4">
             <div className="grid grid-cols-2 gap-3">
                <InputGroup label="Regular Days" type="number" value={data.pricing.daysRegular} onChange={(v) => updateLease('pricing', 'daysRegular', Number(v))} />
                <InputGroup label="Regular Price" type="number" value={data.pricing.priceRegular} onChange={(v) => updateLease('pricing', 'priceRegular', Number(v))} />
             </div>
             <div className="grid grid-cols-2 gap-3">
                <InputGroup label="Season Days" type="number" value={data.pricing.daysSeason} onChange={(v) => updateLease('pricing', 'daysSeason', Number(v))} />
                <InputGroup label="Season Price" type="number" value={data.pricing.priceSeason} onChange={(v) => updateLease('pricing', 'priceSeason', Number(v))} />
             </div>
             
             <div className="pt-4 border-t border-slate-200 mt-2">
                 <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase">Extra Options</span>
                    <button onClick={addExtraOption} className="text-blue-600 bg-blue-50 p-1 rounded hover:bg-blue-100"><Plus size={16}/></button>
                 </div>
                 {data.extraOptions.map((opt, i) => (
                     <div key={i} className="flex gap-2 mb-2 items-center">
                         <input className="flex-1 text-sm p-2 border rounded" value={opt.name} onChange={e => updateExtraOption(i, 'name', e.target.value)} placeholder="Option Name" />
                         <input className="w-20 text-sm p-2 border rounded" type="number" value={opt.price} onChange={e => updateExtraOption(i, 'price', Number(e.target.value))} placeholder="0" />
                         <button onClick={() => removeExtraOption(i)} className="text-red-400 p-1"><Trash2 size={16} /></button>
                     </div>
                 ))}
             </div>

             <div className="grid grid-cols-2 gap-3 border-t pt-4 mt-2 bg-slate-100 p-2 rounded">
                <InputGroup label="Deposit Amount" type="number" value={data.pricing.deposit} onChange={(v) => updateLease('pricing', 'deposit', Number(v))} />
                <InputGroup label="TOTAL PAID" type="number" value={data.pricing.total} onChange={(v) => updateLease('pricing', 'total', Number(v))} className="font-bold" />
             </div>
      </div>
  );

  // Step 4: Parties & Terms
  const PartiesStep = (
      <div className="space-y-5">
             <div>
                 <span className="text-xs font-bold text-gray-500 block mb-2 uppercase bg-slate-100 p-1 rounded">Owner (Lessor)</span>
                 <InputGroup label="Surname" value={data.owner.surname} onChange={(v) => updateLease('owner', 'surname', v)} />
                 <InputGroup label="Contact" value={data.owner.contact} onChange={(v) => updateLease('owner', 'contact', v)} />
                 <InputGroup label="Address" value={data.owner.address} onChange={(v) => updateLease('owner', 'address', v)} />
             </div>
             <div className="border-t pt-4">
                 <span className="text-xs font-bold text-gray-500 block mb-2 uppercase bg-slate-100 p-1 rounded">Rider (Tenant)</span>
                 <InputGroup label="Surname" value={data.renter.surname} onChange={(v) => updateLease('renter', 'surname', v)} />
                 <InputGroup label="Contact" value={data.renter.contact} onChange={(v) => updateLease('renter', 'contact', v)} />
                 <InputGroup label="Passport No" value={data.renter.passport} onChange={(v) => updateLease('renter', 'passport', v)} />
             </div>
             <div className="border-t pt-4">
                <span className="text-xs font-bold text-gray-500 block mb-2 uppercase">Legal Terms</span>
                <textarea 
                    className="w-full h-32 text-[10px] p-2 border rounded font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    value={data.terms}
                    onChange={(e) => updateLease(null, 'terms', e.target.value)}
                />
            </div>
      </div>
  );

  const steps = [
      { title: 'Vehicle & Info', content: VehicleStep },
      { title: 'Schedule (Dates)', content: ScheduleStep },
      { title: 'Financials', content: FinancialsStep },
      { title: 'Parties & Terms', content: PartiesStep },
  ];

  return <WizardContainer steps={steps} />;
};

export default LeaseForm;