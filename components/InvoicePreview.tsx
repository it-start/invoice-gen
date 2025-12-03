import React, { useMemo } from 'react';
import { InvoiceData } from '../types';

interface InvoicePreviewProps {
  data: InvoiceData;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' руб.';
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ data }) => {
  const totals = useMemo(() => {
    const subtotal = data.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const vatAmount = data.vatRate > 0 ? subtotal * (data.vatRate / 100) : 0;
    const total = subtotal + vatAmount;
    return { subtotal, vatAmount, total };
  }, [data.items, data.vatRate]);

  return (
    <div className="bg-white shadow-lg p-8 max-w-[210mm] mx-auto min-h-[297mm] text-xs md:text-sm font-serif leading-relaxed text-black">
      
      {/* Top Header Section (Matches Screenshot) */}
      <div className="flex justify-between items-start mb-6 border-b-2 border-transparent">
        <div className="w-2/3 pr-4">
            <h2 className="font-bold text-lg mb-1">{data.seller.name}</h2>
            <div className="text-gray-600 text-xs">Получатель</div>
        </div>
        <div className="w-1/3 text-right">
            <h2 className="font-bold text-xl mb-1">{formatCurrency(totals.total)}</h2>
            <div className="text-gray-600 text-xs">{data.vatRate === -1 ? 'Без НДС' : `В т.ч. НДС ${data.vatRate}%`}</div>
        </div>
      </div>

      {/* Bank Details Table */}
      <div className="mb-8">
        <table className="w-full border-collapse border border-black text-xs">
            <tbody>
                <tr>
                    <td className="border border-black p-2 w-1/2 align-top" rowSpan={2} colSpan={2}>
                        <div className="text-[10px] text-gray-500 mb-1">Банк получателя</div>
                        <div className="font-medium">{data.seller.bankName}</div>
                    </td>
                    <td className="border border-black p-2 w-[10%] align-top">
                         <div className="text-[10px] text-gray-500">БИК</div>
                    </td>
                    <td className="border border-black p-2 align-top align-bottom">
                        {data.seller.bik}
                    </td>
                </tr>
                <tr>
                    <td className="border border-black p-2 align-top">
                        <div className="text-[10px] text-gray-500">Кор. Счёт</div>
                    </td>
                    <td className="border border-black p-2 align-top align-bottom">
                        {data.seller.correspondentAccount}
                    </td>
                </tr>
                <tr>
                    <td className="border border-black p-2 w-[20%] align-top">
                         <div className="text-[10px] text-gray-500">ИНН</div>
                         <div className="mt-1">{data.seller.inn}</div>
                    </td>
                    <td className="border border-black p-2 w-[30%] align-top">
                        <div className="text-[10px] text-gray-500">КПП</div>
                        <div className="mt-1">{data.seller.kpp || '—'}</div>
                    </td>
                    <td className="border border-black p-2 align-top" rowSpan={2}>
                        <div className="text-[10px] text-gray-500">Счёт</div>
                    </td>
                    <td className="border border-black p-2 align-top" rowSpan={2}>
                       <div className="flex items-end h-full"> {data.seller.accountNumber}</div>
                    </td>
                </tr>
                <tr>
                    <td className="border border-black p-2 align-top" colSpan={2}>
                        <div className="text-[10px] text-gray-500 mb-1">Получатель</div>
                        <div className="font-semibold">{data.seller.name}</div>
                    </td>
                </tr>
            </tbody>
        </table>
      </div>

      {/* Header Info */}
      <div className="mb-8">
         <h1 className="text-2xl font-bold mb-4">Счёт № {data.number} от {formatDate(data.date)}</h1>
         
         <div className="space-y-3 pl-0">
            <div className="flex">
                <span className="w-24 shrink-0 text-gray-600">Поставщик:</span>
                <span className="font-bold">
                    {data.seller.name}, ИНН {data.seller.inn}, {data.seller.address}
                </span>
            </div>
            <div className="flex">
                <span className="w-24 shrink-0 text-gray-600">Плательщик:</span>
                <span className="font-bold">
                    {data.buyer.name}, ИНН {data.buyer.inn}, {data.buyer.address}
                </span>
            </div>
         </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse border-t-2 border-black mb-6 text-xs md:text-sm">
        <thead>
          <tr className="border-b border-black">
            <th className="p-2 w-10 text-center font-semibold">№</th>
            <th className="p-2 text-left font-semibold">Название товара или услуги</th>
            <th className="p-2 w-20 text-center font-semibold">Кол-во</th>
            <th className="p-2 w-16 text-center font-semibold">Ед. Изм.</th>
            <th className="p-2 w-28 text-right font-semibold">Цена</th>
            <th className="p-2 w-28 text-right font-semibold">Сумма</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={item.id} className="border-b border-gray-300 last:border-black">
              <td className="p-2 text-center">{index + 1}</td>
              <td className="p-2">{item.name}</td>
              <td className="p-2 text-center">{item.quantity}</td>
              <td className="p-2 text-center">шт</td>
              <td className="p-2 text-right">{formatCurrency(item.price)}</td>
              <td className="p-2 text-right font-medium">{formatCurrency(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="mb-8">
        <p className="mb-2 text-sm">Всего наименований {data.items.length} на сумму {formatCurrency(totals.total)}</p>
        <div className="flex justify-end items-baseline gap-4 mb-2">
            <span className="font-bold">Итог к оплате:</span>
            <span className="text-xl font-bold">{formatCurrency(totals.total)}</span>
        </div>
         <div className="flex justify-end text-sm text-gray-600">
            {data.vatRate === -1 ? 'Без НДС' : `В т.ч. НДС ${formatCurrency(totals.vatAmount)}`}
        </div>
      </div>

      {/* Signatures */}
      <div className="pt-8 mt-12">
        {data.sellerType === 'person' ? (
             /* Self Employed / IP Signature */
             <div className="flex justify-between items-start gap-8">
                <div className="w-1/2">
                    <div className="flex items-end mb-1">
                        <span className="font-bold mr-2 whitespace-nowrap">Получатель:</span>
                        <div className="border-b border-black flex-grow"></div>
                    </div>
                    <div className="text-xs text-center text-gray-500 pl-20">
                         Индивидуальный предприниматель<br/>{data.seller.name}
                    </div>
                </div>
                <div className="w-1/2">
                    <div className="flex items-end mb-1">
                        <span className="font-bold mr-2 whitespace-nowrap">Плательщик:</span>
                        <div className="border-b border-black flex-grow"></div>
                    </div>
                </div>
             </div>
        ) : (
            /* Company Signature (Original) */
            <div className="flex justify-between items-start border-t-2 border-black pt-6">
                <div className="w-[45%]">
                    <div className="flex items-end mb-4">
                        <span className="font-bold mr-2">Руководитель</span>
                        <div className="border-b border-black flex-grow mx-2"></div>
                        <span className="min-w-[100px] text-center italic text-xs">{data.director || '___________'}</span>
                    </div>
                </div>
                <div className="w-[45%]">
                    <div className="flex items-end mb-4">
                        <span className="font-bold mr-2">Бухгалтер</span>
                        <div className="border-b border-black flex-grow mx-2"></div>
                        <span className="min-w-[100px] text-center italic text-xs">{data.accountant || '___________'}</span>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default InvoicePreview;