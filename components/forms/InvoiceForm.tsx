
import React from 'react';
import { InvoiceData, VAT_RATES, SellerType, Language } from '../../types';
import InputGroup from '../ui/InputGroup';
import { User, Building2, Plus, Trash2 } from 'lucide-react';
import { WizardContainer } from '../ui/WizardContainer';
import { t } from '../../utils/i18n';

interface InvoiceFormProps {
  data: InvoiceData;
  lang: Language;
  handlers: {
      updateSeller: (field: string, value: string) => void;
      updateBuyer: (field: string, value: string) => void;
      handleSellerTypeChange: (type: SellerType) => void;
      addItem: () => void;
      updateItem: (id: string, field: string, value: any) => void;
      removeItem: (id: string) => void;
      setData: (data: InvoiceData) => void; 
  }
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ data, lang, handlers }) => {
  const { updateSeller, updateBuyer, handleSellerTypeChange, addItem, updateItem, removeItem, setData } = handlers;

  // Step 1: General Info & Type
  const GeneralStep = (
    <div className="space-y-6">
        <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1 mb-6">
            <button 
                onClick={() => handleSellerTypeChange('person')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${data.sellerType === 'person' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <User size={16} /> {t('type_person', lang)}
            </button>
            <button 
                onClick={() => handleSellerTypeChange('company')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${data.sellerType === 'company' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Building2 size={16} /> {t('type_company', lang)}
            </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <InputGroup label={t('lbl_invoice_no', lang)} value={data.number} onChange={(v) => setData({...data, number: v})} />
            <InputGroup label={t('lbl_date', lang)} type="date" value={data.date} onChange={(v) => setData({...data, date: v})} />
        </div>
        
        {data.sellerType === 'company' && (
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1 tracking-wide">{t('lbl_vat', lang)}</label>
            <select 
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
            value={data.vatRate}
            onChange={(e) => setData({...data, vatRate: Number(e.target.value)})}
            >
            {VAT_RATES.map(rate => (
                <option key={rate.value} value={rate.value}>{rate.label}</option>
            ))}
            </select>
        </div>
        )}
    </div>
  );

  // Step 2: Seller
  const SellerStep = (
    <div className="space-y-4">
        <InputGroup label={t('lbl_name_fio', lang)} value={data.seller.name} onChange={(v) => updateSeller('name', v)} placeholder="ИП Иванов И.И." />
        <div className="grid grid-cols-2 gap-4">
            <InputGroup label={t('lbl_inn', lang)} value={data.seller.inn} onChange={(v) => updateSeller('inn', v)} />
            {data.sellerType === 'company' && (
            <InputGroup label={t('lbl_kpp', lang)} value={data.seller.kpp || ''} onChange={(v) => updateSeller('kpp', v)} />
            )}
        </div>
        <InputGroup label={t('lbl_address', lang)} value={data.seller.address} onChange={(v) => updateSeller('address', v)} />
        
        <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 pl-1">{t('lbl_bank_details', lang)}</h4>
            <InputGroup label={t('lbl_bank_name', lang)} value={data.seller.bankName || ''} onChange={(v) => updateSeller('bankName', v)} />
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label={t('lbl_bik', lang)} value={data.seller.bik || ''} onChange={(v) => updateSeller('bik', v)} />
                <InputGroup label={t('lbl_corr_account', lang)} value={data.seller.correspondentAccount || ''} onChange={(v) => updateSeller('correspondentAccount', v)} />
            </div>
            <InputGroup label={t('lbl_account_number', lang)} value={data.seller.accountNumber || ''} onChange={(v) => updateSeller('accountNumber', v)} />
        </div>

        {data.sellerType === 'company' && (
             <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 pl-1">{t('lbl_signatories', lang)}</h4>
                <div className="grid grid-cols-2 gap-4">
                     <InputGroup label={t('lbl_director', lang)} value={data.director || ''} onChange={(v) => setData({...data, director: v})} />
                     <InputGroup label={t('lbl_accountant', lang)} value={data.accountant || ''} onChange={(v) => setData({...data, accountant: v})} />
                </div>
             </div>
        )}
    </div>
  );

  // Step 3: Buyer
  const BuyerStep = (
    <div className="space-y-4">
         <InputGroup label={t('lbl_buyer_name', lang)} value={data.buyer.name} onChange={(v) => updateBuyer('name', v)} />
         <InputGroup label={t('lbl_inn', lang)} value={data.buyer.inn} onChange={(v) => updateBuyer('inn', v)} />
         <InputGroup label={t('lbl_address', lang)} value={data.buyer.address} onChange={(v) => updateBuyer('address', v)} />
    </div>
  );

  // Step 4: Items
  const ItemsStep = (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-xs font-bold text-slate-500 uppercase">{t('lbl_service_list', lang)}</span>
            <button onClick={addItem} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-full transition-colors">
                <Plus size={20} />
            </button>
        </div>
        <div className="space-y-4">
            {data.items.map((item, idx) => (
            <div key={item.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group transition-all hover:border-blue-200">
                    <div className="absolute -top-2 -left-2 bg-slate-800 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ring-2 ring-white">
                        {idx + 1}
                    </div>
                    <button onClick={() => removeItem(item.id)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 p-1 transition-colors">
                        <Trash2 size={16} />
                    </button>
                    
                    <InputGroup label={t('lbl_item_name', lang)} value={item.name} onChange={(v) => updateItem(item.id, 'name', v)} className="mb-3" />
                    <div className="flex gap-4">
                    <div className="w-1/3">
                         <InputGroup label={t('lbl_qty', lang)} type="number" value={item.quantity} onChange={(v) => updateItem(item.id, 'quantity', Number(v))} />
                    </div>
                    <div className="w-2/3">
                         <InputGroup label={t('lbl_price', lang)} type="number" value={item.price} onChange={(v) => updateItem(item.id, 'price', Number(v))} />
                    </div>
                    </div>
                    <div className="text-right text-sm font-bold text-slate-700 mt-2 pt-2 border-t border-slate-200/50">
                        = {(item.quantity * item.price).toLocaleString('ru-RU')} руб.
                    </div>
            </div>
            ))}
        </div>
        {data.items.length === 0 && (
             <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-slate-50/50">
                 {t('msg_no_items', lang)}
             </div>
        )}
    </div>
  );

  const steps = [
      { title: t('step_general', lang), content: GeneralStep },
      { title: t('step_seller', lang), content: SellerStep },
      { title: t('step_buyer', lang), content: BuyerStep },
      { title: t('step_goods', lang), content: ItemsStep },
  ];

  return <WizardContainer steps={steps} lang={lang} />;
};

export default InvoiceForm;
