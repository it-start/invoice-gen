
import React from 'react';
import { InvoiceData, VAT_RATES, SellerType } from '../../types';
import InputGroup from '../ui/InputGroup';
import { User, Building2, Plus, Trash2 } from 'lucide-react';
import { WizardContainer } from '../ui/WizardContainer';

interface InvoiceFormProps {
  data: InvoiceData;
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

const InvoiceForm: React.FC<InvoiceFormProps> = ({ data, handlers }) => {
  const { updateSeller, updateBuyer, handleSellerTypeChange, addItem, updateItem, removeItem, setData } = handlers;

  // Step 1: General Info & Type
  const GeneralStep = (
    <div className="space-y-6">
        <div className="bg-white p-2 rounded-lg border border-slate-200 flex gap-1 mb-4">
            <button 
                onClick={() => handleSellerTypeChange('person')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded text-xs font-medium transition-all ${data.sellerType === 'person' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <User size={16} /> Самозанятый / ИП
            </button>
            <button 
                onClick={() => handleSellerTypeChange('company')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded text-xs font-medium transition-all ${data.sellerType === 'company' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <Building2 size={16} /> Организация
            </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
  );

  // Step 2: Seller
  const SellerStep = (
    <div className="space-y-3">
        <InputGroup label="Название / ФИО" value={data.seller.name} onChange={(v) => updateSeller('name', v)} placeholder="ИП Иванов И.И." />
        <div className="grid grid-cols-2 gap-3">
            <InputGroup label="ИНН" value={data.seller.inn} onChange={(v) => updateSeller('inn', v)} />
            {data.sellerType === 'company' && (
            <InputGroup label="КПП" value={data.seller.kpp || ''} onChange={(v) => updateSeller('kpp', v)} />
            )}
        </div>
        <InputGroup label="Юр. Адрес" value={data.seller.address} onChange={(v) => updateSeller('address', v)} />
        
        <div className="mt-6 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 bg-slate-100 p-1 pl-2 rounded">Банковские реквизиты</h4>
            <InputGroup label="Название Банка" value={data.seller.bankName || ''} onChange={(v) => updateSeller('bankName', v)} />
            <div className="grid grid-cols-2 gap-3">
                <InputGroup label="БИК" value={data.seller.bik || ''} onChange={(v) => updateSeller('bik', v)} />
                <InputGroup label="Корр. счет" value={data.seller.correspondentAccount || ''} onChange={(v) => updateSeller('correspondentAccount', v)} />
            </div>
            <InputGroup label="Расчетный счет" value={data.seller.accountNumber || ''} onChange={(v) => updateSeller('accountNumber', v)} />
        </div>

        {data.sellerType === 'company' && (
             <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 bg-slate-100 p-1 pl-2 rounded">Подписанты</h4>
                <div className="grid grid-cols-2 gap-3">
                     <InputGroup label="Руководитель" value={data.director || ''} onChange={(v) => setData({...data, director: v})} />
                     <InputGroup label="Бухгалтер" value={data.accountant || ''} onChange={(v) => setData({...data, accountant: v})} />
                </div>
             </div>
        )}
    </div>
  );

  // Step 3: Buyer
  const BuyerStep = (
    <div className="space-y-3">
         <InputGroup label="Название компании" value={data.buyer.name} onChange={(v) => updateBuyer('name', v)} />
         <InputGroup label="ИНН" value={data.buyer.inn} onChange={(v) => updateBuyer('inn', v)} />
         <InputGroup label="Адрес" value={data.buyer.address} onChange={(v) => updateBuyer('address', v)} />
    </div>
  );

  // Step 4: Items
  const ItemsStep = (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Список услуг</span>
            <button onClick={addItem} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-full transition-colors">
                <Plus size={20} />
            </button>
        </div>
        <div className="space-y-4">
            {data.items.map((item, idx) => (
            <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 relative">
                    <div className="absolute -top-2 -left-2 bg-slate-800 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                        {idx + 1}
                    </div>
                    <button onClick={() => removeItem(item.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1">
                        <Trash2 size={16} />
                    </button>
                    
                    <InputGroup label="Наименование" value={item.name} onChange={(v) => updateItem(item.id, 'name', v)} className="mb-2" />
                    <div className="flex gap-3">
                    <div className="w-1/3">
                         <InputGroup label="Кол-во" type="number" value={item.quantity} onChange={(v) => updateItem(item.id, 'quantity', Number(v))} />
                    </div>
                    <div className="w-2/3">
                         <InputGroup label="Цена (руб)" type="number" value={item.price} onChange={(v) => updateItem(item.id, 'price', Number(v))} />
                    </div>
                    </div>
                    <div className="text-right text-sm font-bold text-slate-700 mt-1">
                        = {(item.quantity * item.price).toLocaleString('ru-RU')} руб.
                    </div>
            </div>
            ))}
        </div>
        {data.items.length === 0 && (
             <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                 Нет товаров
             </div>
        )}
    </div>
  );

  const steps = [
      { title: 'Общая информация', content: GeneralStep },
      { title: 'Продавец (Исполнитель)', content: SellerStep },
      { title: 'Покупатель (Заказчик)', content: BuyerStep },
      { title: 'Товары и Услуги', content: ItemsStep },
  ];

  return <WizardContainer steps={steps} />;
};

export default InvoiceForm;
