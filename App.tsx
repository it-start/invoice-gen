import React, { useState, useEffect } from 'react';
import { InvoiceData, INITIAL_INVOICE, VAT_RATES, InvoiceItem, SellerType } from './types';
import InvoicePreview from './components/InvoicePreview';
import { InvoicePdf } from './components/PdfDocument';
import { pdf } from '@react-pdf/renderer';
import { Plus, Trash2, Download, Wand2, Loader2, AlertCircle, Building2, User } from 'lucide-react';
import { parseInvoiceText } from './services/geminiService';

// Reusable Input Component
const InputGroup = ({ label, value, onChange, placeholder, type = "text", className = "" }: any) => (
  <div className={`mb-3 ${className}`}>
    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
    />
  </div>
);

function App() {
  const [data, setData] = useState<InvoiceData>(INITIAL_INVOICE);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    // Safe check for API Key
    let hasKey = false;
    try {
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            hasKey = true;
        }
    } catch (e) {
        // Ignore reference error if process is not defined
    }
    
    if (!hasKey) {
        setApiKeyMissing(true);
    }
  }, []);

  const handleSellerTypeChange = (type: SellerType) => {
    setData(prev => ({
      ...prev,
      sellerType: type,
      // If switching to person, remove KPP and set VAT to -1
      seller: {
        ...prev.seller,
        kpp: type === 'person' ? '' : prev.seller.kpp
      },
      vatRate: type === 'person' ? -1 : prev.vatRate,
      director: type === 'person' ? '' : prev.director,
      accountant: type === 'person' ? '' : prev.accountant
    }));
  };

  const updateSeller = (field: string, value: string) => {
    setData(prev => ({ ...prev, seller: { ...prev.seller, [field]: value } }));
  };

  const updateBuyer = (field: string, value: string) => {
    setData(prev => ({ ...prev, buyer: { ...prev.buyer, [field]: value } }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addItem = () => {
    setData(prev => ({
      ...prev,
      items: [...prev.items, { id: Math.random().toString(), name: '', quantity: 1, price: 0 }]
    }));
  };

  const removeItem = (id: string) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleSmartImport = async () => {
    if (!aiInputText.trim()) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const parsedData = await parseInvoiceText(aiInputText);
      if (parsedData) {
        setData(prev => ({
          ...prev,
          ...parsedData,
          seller: { ...prev.seller, ...parsedData.seller },
          buyer: { ...prev.buyer, ...parsedData.buyer },
          items: parsedData.items ? parsedData.items : prev.items // keep parsing safe
        }));
        setShowAiModal(false);
        setAiInputText('');
      }
    } catch (error) {
      setAiError("Не удалось распознать данные. Проверьте API ключ или формат текста.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const blob = await pdf(<InvoicePdf data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${data.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Ошибка при создании PDF. Попробуйте еще раз.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* LEFT SIDEBAR - FORM */}
      <div className="w-full md:w-1/3 bg-white border-r border-gray-200 h-screen overflow-y-auto sticky top-0 shadow-xl z-10">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Редактор Счета</h2>
            <button 
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors font-medium"
            >
              <Wand2 size={14} /> AI Импорт
            </button>
          </div>

          <div className="space-y-6">
            {/* Seller Type Selector */}
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

            {/* General Info */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Общее</h3>
              <div className="grid grid-cols-2 gap-2">
                <InputGroup label="№ Счета" value={data.number} onChange={(v: string) => setData({...data, number: v})} />
                <InputGroup label="Дата" type="date" value={data.date} onChange={(v: string) => setData({...data, date: v})} />
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
               {data.sellerType === 'person' && (
                  <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded border border-gray-200">
                    Режим "Без НДС" включен автоматически для самозанятых/ИП.
                  </div>
              )}
            </div>

            {/* Seller */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Продавец (Исполнитель)</h3>
              <InputGroup 
                label={data.sellerType === 'person' ? "ФИО (Индивидуальный предприниматель)" : "Название организации"} 
                value={data.seller.name} 
                onChange={(v: string) => updateSeller('name', v)} 
                placeholder={data.sellerType === 'person' ? 'ИП Иванов Иван Иванович' : 'ООО "Ромашка"'} 
              />
              <div className="grid grid-cols-2 gap-2">
                 <InputGroup label="ИНН" value={data.seller.inn} onChange={(v: string) => updateSeller('inn', v)} />
                 {data.sellerType === 'company' && (
                    <InputGroup label="КПП" value={data.seller.kpp || ''} onChange={(v: string) => updateSeller('kpp', v)} />
                 )}
              </div>
              <InputGroup label="Юридический адрес" value={data.seller.address} onChange={(v: string) => updateSeller('address', v)} />
              
              <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-500 mb-2">Банковские реквизиты</h4>
                  <InputGroup label="Название Банка" value={data.seller.bankName || ''} onChange={(v: string) => updateSeller('bankName', v)} />
                  <div className="grid grid-cols-2 gap-2">
                     <InputGroup label="БИК" value={data.seller.bik || ''} onChange={(v: string) => updateSeller('bik', v)} />
                     <InputGroup label="Корр. счет" value={data.seller.correspondentAccount || ''} onChange={(v: string) => updateSeller('correspondentAccount', v)} />
                  </div>
                  <InputGroup label="Расчетный счет" value={data.seller.accountNumber || ''} onChange={(v: string) => updateSeller('accountNumber', v)} />
              </div>

               {data.sellerType === 'company' && (
                <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-2">
                   <InputGroup label="Руководитель" value={data.director || ''} onChange={(v: string) => setData({...data, director: v})} />
                   <InputGroup label="Бухгалтер" value={data.accountant || ''} onChange={(v: string) => setData({...data, accountant: v})} />
               </div>
               )}
            </div>

            {/* Buyer */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Покупатель (Заказчик)</h3>
              <InputGroup label="Название организации / ФИО" value={data.buyer.name} onChange={(v: string) => updateBuyer('name', v)} placeholder='ООО "Клиент" или Петров П.П.' />
              <InputGroup label="ИНН" value={data.buyer.inn} onChange={(v: string) => updateBuyer('inn', v)} />
              <InputGroup label="Адрес" value={data.buyer.address} onChange={(v: string) => updateBuyer('address', v)} />
            </div>

            {/* Items */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-3 border-b pb-2">
                 <h3 className="font-bold text-sm text-slate-700">Товары и услуги</h3>
                 <button onClick={addItem} className="text-blue-600 hover:text-blue-800 transition-colors">
                    <Plus size={18} />
                 </button>
              </div>
              <div className="space-y-4">
                {data.items.map((item, index) => (
                  <div key={item.id} className="bg-white p-3 rounded shadow-sm border border-gray-100 relative group">
                    <button 
                        onClick={() => removeItem(item.id)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 size={16} />
                    </button>
                    <div className="mb-2 pr-6">
                        <label className="text-[10px] uppercase font-bold text-gray-400">Наименование</label>
                        <input 
                            className="w-full border-b border-gray-300 focus:border-blue-500 outline-none text-sm py-1"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            placeholder="Название товара или услуги"
                        />
                    </div>
                    <div className="flex gap-3">
                         <div className="w-1/3">
                            <label className="text-[10px] uppercase font-bold text-gray-400">Кол-во</label>
                            <input 
                                type="number"
                                className="w-full border-b border-gray-300 focus:border-blue-500 outline-none text-sm py-1"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="text-[10px] uppercase font-bold text-gray-400">Цена</label>
                            <input 
                                type="number"
                                className="w-full border-b border-gray-300 focus:border-blue-500 outline-none text-sm py-1"
                                value={item.price}
                                onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                            />
                        </div>
                         <div className="w-1/3 text-right">
                            <label className="text-[10px] uppercase font-bold text-gray-400">Сумма</label>
                            <div className="text-sm font-semibold py-1">
                                {(item.quantity * item.price).toLocaleString('ru-RU')}
                            </div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - PREVIEW */}
      <div className="w-full md:w-2/3 bg-slate-800 p-4 md:p-8 flex flex-col items-center overflow-hidden h-screen relative">
        <div className="w-full max-w-[210mm] flex justify-between items-center mb-4">
             <div className="text-white">
                <h1 className="text-xl font-bold">Предпросмотр</h1>
                <p className="text-slate-400 text-sm">
                    {data.sellerType === 'person' ? 'Шаблон для Самозанятых / ИП' : 'Шаблон для Организаций'}
                </p>
             </div>
             
            <button 
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-wait"
            >
                {isGeneratingPdf ? (
                    <> <Loader2 className="animate-spin" size={18} /> Создание PDF... </>
                ) : (
                    <> <Download size={18} /> Скачать PDF </>
                )}
            </button>
        </div>

        <div className="flex-1 w-full overflow-y-auto custom-scrollbar pb-20">
             {/* The visual HTML preview that looks like paper */}
            <div className="transform scale-[0.6] md:scale-[0.85] lg:scale-[0.9] origin-top transition-transform duration-300">
                <InvoicePreview data={data} />
            </div>
        </div>
      </div>

      {/* AI MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Wand2 className="text-purple-600" /> 
                        Умный импорт из текста
                    </h3>
                    <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>
                
                {apiKeyMissing ? (
                   <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mb-4 text-sm flex gap-3">
                      <AlertCircle className="shrink-0" />
                      <div>
                        <strong>API ключ не найден.</strong>
                        <p>Для работы AI функций требуется ключ Gemini API в переменной окружения <code>API_KEY</code>.</p>
                      </div>
                   </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-4">
                        Вставьте любой текст (например, из письма или мессенджера), и AI автоматически заполнит поля счета.
                    </p>
                    <textarea 
                        className="w-full h-40 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none mb-4 resize-none"
                        placeholder="Пример: Сделай счет для ООО Рога и Копыта (ИНН 7700000000) от ИП Петров. Услуги дизайна сайта, 1 шт, 50000 рублей. Без НДС."
                        value={aiInputText}
                        onChange={(e) => setAiInputText(e.target.value)}
                    />
                    {aiError && (
                        <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{aiError}</div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setShowAiModal(false)}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Отмена
                        </button>
                        <button 
                            onClick={handleSmartImport}
                            disabled={isAiLoading || !aiInputText.trim()}
                            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isAiLoading && <Loader2 className="animate-spin" size={14} />}
                            {isAiLoading ? 'Анализирую...' : 'Распознать'}
                        </button>
                    </div>
                  </>
                )}
            </div>
        </div>
      )}

    </div>
  );
}

export default App;