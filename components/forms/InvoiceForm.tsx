import React from 'react';
import { InvoiceData, VAT_RATES, SellerType } from '../../types';
import InputGroup from '../ui/InputGroup';
import { User, Building2, Plus, Trash2 } from 'lucide-react';

interface InvoiceFormProps {
  data: InvoiceData;
  handlers: {
      updateSeller: (field: string, value: string) => void;
      updateBuyer: (field: string, value: string) => void;
      handleSellerTypeChange: (type: SellerType) => void;
      addItem: () => void;
      updateItem: (id: string, field: string, value: any) => void;
      removeItem: (id: string) => void;
      setData: (data: InvoiceData) => void; // For simple fields like number/date/vat
  }
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ data, handlers }) => {
  const { updateSeller, updateBuyer, handleSellerTypeChange, addItem, updateItem, removeItem, setData } = handlers;

  return (
    <div className="space-y-6">
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex gap-1">
            <button 
                onClick={() => handleSellerTypeChange('person')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-medium transition-all ${data.sellerType === 'person' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
                <User size={14} /> Самозанятый / ИП
            </button>
            <button 
                onClick={() => handleSellerTypeChange('company')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-medium transition-all ${data.sellerType === 'company' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
                <Building2 size={14} /> Организация
            </button>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Общее</h3>
            <div className="grid grid-cols-2 gap-2">
            <InputGroup label="№ Счета" value={data.number} onChange={(v) => setData({...data, number: v})} />
            <InputGroup label="Дата" type="date" value={data.date} onChange={(v) => setData({...data, date: v})} />
            </div>
            {data.sellerType === 'company' && (
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">НДС</label>
                <select 
                className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
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

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Продавец</h3>
            <InputGroup label="Название" value={data.seller.name} onChange={(v) => updateSeller('name', v)} />
            <div className="grid grid-cols-2 gap-2">
                <InputGroup label="ИНН" value={data.seller.inn} onChange={(v) => updateSeller('inn', v)} />
                {data.sellerType === 'company' && (
                <InputGroup label="КПП" value={data.seller.kpp || ''} onChange={(v) => updateSeller('kpp', v)} />
                )}
            </div>
            <InputGroup label="Адрес" value={data.seller.address} onChange={(v) => updateSeller('address', v)} />
             <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-500 mb-2">Банковские реквизиты</h4>
                  <InputGroup label="Название Банка" value={data.seller.bankName || ''} onChange={(v) => updateSeller('bankName', v)} />
                  <div className="grid grid-cols-2 gap-2">
                     <InputGroup label="БИК" value={data.seller.bik || ''} onChange={(v) => updateSeller('bik', v)} />
                     <InputGroup label="Корр. счет" value={data.seller.correspondentAccount || ''} onChange={(v) => updateSeller('correspondentAccount', v)} />
                  </div>
                  <InputGroup label="Расчетный счет" value={data.seller.accountNumber || ''} onChange={(v) => updateSeller('accountNumber', v)} />
              </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Покупатель</h3>
            <InputGroup label="Название" value={data.buyer.name} onChange={(v) => updateBuyer('name', v)} />
            <InputGroup label="ИНН" value={data.buyer.inn} onChange={(v) => updateBuyer('inn', v)} />
            <InputGroup label="Адрес" value={data.buyer.address} onChange={(v) => updateBuyer('address', v)} />
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center mb-3 border-b pb-2">
                <h3 className="font-bold text-sm text-slate-700">Товары</h3>
                <button onClick={addItem} className="text-blue-600">
                <Plus size={18} />
                </button>
            </div>
            <div className="space-y-4">
                {data.items.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded shadow-sm border relative">
                     <button onClick={() => removeItem(item.id)} className="absolute top-2 right-2 text-red-400"><Trash2 size={16} /></button>
                     <InputGroup label="Наименование" value={item.name} onChange={(v) => updateItem(item.id, 'name', v)} className="mb-1" />
                     <div className="flex gap-2">
                        <InputGroup label="Кол-во" type="number" value={item.quantity} onChange={(v) => updateItem(item.id, 'quantity', Number(v))} />
                        <InputGroup label="Цена" type="number" value={item.price} onChange={(v) => updateItem(item.id, 'price', Number(v))} />
                     </div>
                </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default InvoiceForm;