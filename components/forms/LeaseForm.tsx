
import React from 'react';
import { LeaseData, Language } from '../../types';
import InputGroup from '../ui/InputGroup';
import SignaturePad from '../ui/SignaturePad';
import { Plus, Trash2, MessageCircle } from 'lucide-react';
import { WizardContainer } from '../ui/WizardContainer';
import { t } from '../../utils/i18n';

interface LeaseFormProps {
  data: LeaseData;
  lang: Language;
  handlers: {
      updateLease: (section: keyof LeaseData | null, field: string, value: any) => void;
      addExtraOption: () => void;
      updateExtraOption: (index: number, field: 'name' | 'price', value: any) => void;
      removeExtraOption: (index: number) => void;
      // loadFromApi removed as we load via chat context
      isLoading: boolean;
  }
}

const LeaseForm: React.FC<LeaseFormProps> = ({ data, lang, handlers }) => {
  const { updateLease, addExtraOption, updateExtraOption, removeExtraOption } = handlers;

  // Step 1: Info & Vehicle
  const VehicleStep = (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
           <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1 tracking-wide">{t('lbl_res_id', lang)}</label>
               <div className="relative group">
                   <input 
                      disabled
                      value={data.reservationId} 
                      className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                   />
                   <div className="absolute right-3 top-3 text-slate-400">
                       <MessageCircle size={16} />
                   </div>
               </div>
               <p className="text-[10px] text-slate-400 mt-1 ml-1">Select chat to change reservation</p>
           </div>
           
           <InputGroup label={t('lbl_template_id', lang)} value={data.contractTemplateId || ''} onChange={(v) => updateLease(null, 'contractTemplateId', v)} placeholder={t('lbl_optional', lang)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
            <InputGroup label={t('lbl_source', lang)} value={data.source} onChange={(v) => updateLease(null, 'source', v)} />
            <InputGroup label={t('lbl_created', lang)} value={data.createdDate} onChange={(v) => updateLease(null, 'createdDate', v)} />
        </div>
        
        <div className="pt-4 border-t border-slate-200 mt-4">
             <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 bg-slate-100 p-1 pl-2 rounded">{t('grp_vehicle', lang)}</h4>
             <InputGroup label={t('lbl_model', lang)} value={data.vehicle.name} onChange={(v) => updateLease('vehicle', 'name', v)} />
             <InputGroup label={t('lbl_details', lang)} value={data.vehicle.details} onChange={(v) => updateLease('vehicle', 'details', v)} />
             <InputGroup label={t('lbl_plate', lang)} value={data.vehicle.plate} onChange={(v) => updateLease('vehicle', 'plate', v)} />
        </div>
      </div>
  );

  // Step 2: Schedule
  const ScheduleStep = (
      <div className="space-y-4">
         <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-blue-600 uppercase block mb-3">{t('grp_pickup', lang)}</span>
            <div className="grid grid-cols-2 gap-3 mb-2">
                <InputGroup label={t('lbl_date', lang)} type="date" value={data.pickup.date} onChange={(v) => updateLease('pickup', 'date', v)} />
                <InputGroup label={t('lbl_time', lang)} value={data.pickup.time} onChange={(v) => updateLease('pickup', 'time', v)} />
            </div>
            <InputGroup label={t('lbl_fee', lang)} type="number" value={data.pickup.fee} onChange={(v) => updateLease('pickup', 'fee', Number(v))} placeholder="0" />
         </div>
         <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-red-600 uppercase block mb-3">{t('grp_return', lang)}</span>
             <div className="grid grid-cols-2 gap-3 mb-2">
                <InputGroup label={t('lbl_date', lang)} type="date" value={data.dropoff.date} onChange={(v) => updateLease('dropoff', 'date', v)} />
                <InputGroup label={t('lbl_time', lang)} value={data.dropoff.time} onChange={(v) => updateLease('dropoff', 'time', v)} />
            </div>
            <InputGroup label={t('lbl_fee', lang)} type="number" value={data.dropoff.fee} onChange={(v) => updateLease('dropoff', 'fee', Number(v))} placeholder="0" />
         </div>
      </div>
  );

  // Step 3: Financials
  const FinancialsStep = (
      <div className="space-y-4">
             <div className="grid grid-cols-2 gap-3">
                <InputGroup label={t('lbl_reg_days', lang)} type="number" value={data.pricing.daysRegular} onChange={(v) => updateLease('pricing', 'daysRegular', Number(v))} />
                <InputGroup label={t('lbl_reg_price', lang)} type="number" value={data.pricing.priceRegular} onChange={(v) => updateLease('pricing', 'priceRegular', Number(v))} />
             </div>
             <div className="grid grid-cols-2 gap-3">
                <InputGroup label={t('lbl_seas_days', lang)} type="number" value={data.pricing.daysSeason} onChange={(v) => updateLease('pricing', 'daysSeason', Number(v))} />
                <InputGroup label={t('lbl_seas_price', lang)} type="number" value={data.pricing.priceSeason} onChange={(v) => updateLease('pricing', 'priceSeason', Number(v))} />
             </div>
             
             <div className="pt-4 border-t border-slate-200 mt-2">
                 <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase">{t('grp_extra', lang)}</span>
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
                <InputGroup label={t('lbl_deposit', lang)} type="number" value={data.pricing.deposit} onChange={(v) => updateLease('pricing', 'deposit', Number(v))} />
                <InputGroup label={t('lbl_total_paid', lang)} type="number" value={data.pricing.total} onChange={(v) => updateLease('pricing', 'total', Number(v))} className="font-bold" />
             </div>
      </div>
  );

  // Step 4: Parties & Terms
  const PartiesStep = (
      <div className="space-y-5">
             <div>
                 <span className="text-xs font-bold text-gray-500 block mb-2 uppercase bg-slate-100 p-1 rounded">{t('grp_owner', lang)}</span>
                 <InputGroup label={t('lbl_surname', lang)} value={data.owner.surname} onChange={(v) => updateLease('owner', 'surname', v)} />
                 <InputGroup label={t('lbl_contact', lang)} value={data.owner.contact} onChange={(v) => updateLease('owner', 'contact', v)} />
                 <InputGroup label={t('lbl_address', lang)} value={data.owner.address} onChange={(v) => updateLease('owner', 'address', v)} />
             </div>
             <div className="border-t pt-4">
                 <span className="text-xs font-bold text-gray-500 block mb-2 uppercase bg-slate-100 p-1 rounded">{t('grp_renter', lang)}</span>
                 <InputGroup label={t('lbl_surname', lang)} value={data.renter.surname} onChange={(v) => updateLease('renter', 'surname', v)} />
                 <InputGroup label={t('lbl_contact', lang)} value={data.renter.contact} onChange={(v) => updateLease('renter', 'contact', v)} />
                 <InputGroup label={t('lbl_passport', lang)} value={data.renter.passport} onChange={(v) => updateLease('renter', 'passport', v)} />
             </div>
             <div className="border-t pt-4">
                <span className="text-xs font-bold text-gray-500 block mb-2 uppercase">{t('lbl_terms', lang)}</span>
                <textarea 
                    className="w-full h-32 text-[10px] p-2 border rounded font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    value={data.terms}
                    onChange={(e) => updateLease(null, 'terms', e.target.value)}
                />
            </div>
      </div>
  );

  // Step 5: Signatures
  const SignaturesStep = (
      <div className="space-y-6">
          <SignaturePad 
              label={t('lbl_sign_owner', lang)} 
              value={data.owner.signature} 
              onChange={(dataUrl) => updateLease('owner', 'signature', dataUrl)}
              onClear={() => updateLease('owner', 'signature', undefined)}
              savedLabel={t('msg_sign_saved', lang)}
              clearLabel={t('btn_clear', lang)}
          />
          <SignaturePad 
              label={t('lbl_sign_renter', lang)} 
              value={data.renter.signature} 
              onChange={(dataUrl) => updateLease('renter', 'signature', dataUrl)}
              onClear={() => updateLease('renter', 'signature', undefined)}
              savedLabel={t('msg_sign_saved', lang)}
              clearLabel={t('btn_clear', lang)}
          />
      </div>
  );

  const steps = [
      { title: t('step_vehicle', lang), content: VehicleStep },
      { title: t('step_schedule', lang), content: ScheduleStep },
      { title: t('step_financials', lang), content: FinancialsStep },
      { title: t('step_parties', lang), content: PartiesStep },
      { title: t('step_signatures', lang), content: SignaturesStep },
  ];

  return <WizardContainer steps={steps} lang={lang} />;
};

export default LeaseForm;
