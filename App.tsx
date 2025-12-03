
import { useState, useEffect } from 'react';
import { InvoiceData, INITIAL_INVOICE, VAT_RATES, SellerType, LeaseData, INITIAL_LEASE } from './types';
import InvoicePreview from './components/InvoicePreview';
import LeasePreview from './components/LeasePreview';
import { InvoicePdf } from './components/PdfDocument';
import { LeasePdf } from './components/LeasePdf';
import { pdf } from '@react-pdf/renderer';
import { Plus, Trash2, Download, Wand2, Loader2, Building2, User, RotateCcw, FileText, Car } from 'lucide-react';
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

type DocType = 'invoice' | 'lease';

function App() {
  const [docType, setDocType] = useState<DocType>('invoice');
  
  // INVOICE STATE
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(() => {
    try {
      const saved = localStorage.getItem('invoice_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_INVOICE;
  });

  // LEASE STATE
  const [leaseData, setLeaseData] = useState<LeaseData>(() => {
    try {
        const saved = localStorage.getItem('lease_data');
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_LEASE;
  });
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('invoice_data', JSON.stringify(invoiceData));
  }, [invoiceData]);
  
  useEffect(() => {
      localStorage.setItem('lease_data', JSON.stringify(leaseData));
  }, [leaseData]);

  useEffect(() => {
    // Safe check for API Key
    let hasKey = false;
    try {
        // @ts-ignore
        if (process.env.API_KEY) {
            hasKey = true;
        }
    } catch (e) {}
    
    if (!hasKey) {
        setApiKeyMissing(true);
    }
  }, []);

  // --- INVOICE HANDLERS ---
  const handleResetInvoice = () => {
    if (window.confirm('Сбросить данные счета?')) {
        setInvoiceData({ ...INITIAL_INVOICE, items: [{...INITIAL_INVOICE.items[0], id: Math.random().toString()}] });
    }
  };

  const updateSeller = (field: string, value: string) => {
    setInvoiceData(prev => ({ ...prev, seller: { ...prev.seller, [field]: value } }));
  };

  const updateBuyer = (field: string, value: string) => {
    setInvoiceData(prev => ({ ...prev, buyer: { ...prev.buyer, [field]: value } }));
  };
  
  const handleSellerTypeChange = (type: SellerType) => {
    setInvoiceData(prev => ({
      ...prev,
      sellerType: type,
      seller: { ...prev.seller, kpp: type === 'person' ? '' : prev.seller.kpp },
      vatRate: type === 'person' ? -1 : prev.vatRate,
      director: type === 'person' ? '' : prev.director,
      accountant: type === 'person' ? '' : prev.accountant
    }));
  };

  // --- LEASE HANDLERS ---
  const updateLease = (section: keyof LeaseData | null, field: string, value: any) => {
    setLeaseData(prev => {
        if (section && typeof prev[section] === 'object' && !Array.isArray(prev[section])) {
            return {
                ...prev,
                [section]: { ...prev[section] as object, [field]: value }
            };
        }
        return { ...prev, [field]: value };
    });
  };

  const addExtraOption = () => {
    setLeaseData(prev => ({
        ...prev,
        extraOptions: [...prev.extraOptions, { name: '', price: 0 }]
    }));
  };
  
  const updateExtraOption = (index: number, field: 'name' | 'price', value: any) => {
    const newOpts = [...leaseData.extraOptions];
    newOpts[index] = { ...newOpts[index], [field]: value };
    setLeaseData(prev => ({ ...prev, extraOptions: newOpts }));
  };
  
  const removeExtraOption = (index: number) => {
      setLeaseData(prev => ({
          ...prev,
          extraOptions: prev.extraOptions.filter((_, i) => i !== index)
      }));
  };

  // --- COMMON HANDLERS ---
  const handleSmartImport = async () => {
    if (!aiInputText.trim()) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const parsedData = await parseInvoiceText(aiInputText);
      if (parsedData) {
        setInvoiceData(prev => ({
          ...prev,
          ...parsedData,
          seller: { ...prev.seller, ...parsedData.seller },
          buyer: { ...prev.buyer, ...parsedData.buyer },
          items: parsedData.items ? parsedData.items : prev.items 
        }));
        setShowAiModal(false);
        setAiInputText('');
      }
    } catch (error) {
      setAiError("Не удалось распознать данные.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      let doc;
      let filename;
      
      if (docType === 'invoice') {
          doc = <InvoicePdf data={invoiceData} />;
          filename = `invoice_${invoiceData.number}.pdf`;
      } else {
          doc = <LeasePdf data={leaseData} />;
          filename = `lease_${leaseData.reservationId}.pdf`;
      }

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF Error", error);
      alert("Ошибка PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // --- RENDER FORM CONTENT ---
  const renderInvoiceForm = () => (
    <div className="space-y-6">
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex gap-1">
            <button 
                onClick={() => handleSellerTypeChange('person')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-medium transition-all ${invoiceData.sellerType === 'person' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
                <User size={14} /> Самозанятый / ИП
            </button>
            <button 
                onClick={() => handleSellerTypeChange('company')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-medium transition-all ${invoiceData.sellerType === 'company' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
                <Building2 size={14} /> Организация
            </button>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Общее</h3>
            <div className="grid grid-cols-2 gap-2">
            <InputGroup label="№ Счета" value={invoiceData.number} onChange={(v: string) => setInvoiceData({...invoiceData, number: v})} />
            <InputGroup label="Дата" type="date" value={invoiceData.date} onChange={(v: string) => setInvoiceData({...invoiceData, date: v})} />
            </div>
            {invoiceData.sellerType === 'company' && (
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">НДС</label>
                <select 
                className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
                value={invoiceData.vatRate}
                onChange={(e) => setInvoiceData({...invoiceData, vatRate: Number(e.target.value)})}
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
            <InputGroup label="Название" value={invoiceData.seller.name} onChange={(v: string) => updateSeller('name', v)} />
            <div className="grid grid-cols-2 gap-2">
                <InputGroup label="ИНН" value={invoiceData.seller.inn} onChange={(v: string) => updateSeller('inn', v)} />
                {invoiceData.sellerType === 'company' && (
                <InputGroup label="КПП" value={invoiceData.seller.kpp || ''} onChange={(v: string) => updateSeller('kpp', v)} />
                )}
            </div>
            <InputGroup label="Адрес" value={invoiceData.seller.address} onChange={(v: string) => updateSeller('address', v)} />
             <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-500 mb-2">Банковские реквизиты</h4>
                  <InputGroup label="Название Банка" value={invoiceData.seller.bankName || ''} onChange={(v: string) => updateSeller('bankName', v)} />
                  <div className="grid grid-cols-2 gap-2">
                     <InputGroup label="БИК" value={invoiceData.seller.bik || ''} onChange={(v: string) => updateSeller('bik', v)} />
                     <InputGroup label="Корр. счет" value={invoiceData.seller.correspondentAccount || ''} onChange={(v: string) => updateSeller('correspondentAccount', v)} />
                  </div>
                  <InputGroup label="Расчетный счет" value={invoiceData.seller.accountNumber || ''} onChange={(v: string) => updateSeller('accountNumber', v)} />
              </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Покупатель</h3>
            <InputGroup label="Название" value={invoiceData.buyer.name} onChange={(v: string) => updateBuyer('name', v)} />
            <InputGroup label="ИНН" value={invoiceData.buyer.inn} onChange={(v: string) => updateBuyer('inn', v)} />
            <InputGroup label="Адрес" value={invoiceData.buyer.address} onChange={(v: string) => updateBuyer('address', v)} />
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center mb-3 border-b pb-2">
                <h3 className="font-bold text-sm text-slate-700">Товары</h3>
                <button onClick={() => setInvoiceData(prev => ({...prev, items: [...prev.items, {id: Math.random().toString(), name: '', quantity: 1, price: 0}]}))} className="text-blue-600">
                <Plus size={18} />
                </button>
            </div>
            <div className="space-y-4">
                {invoiceData.items.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded shadow-sm border relative">
                     <button onClick={() => setInvoiceData(prev => ({...prev, items: prev.items.filter(i => i.id !== item.id)}))} className="absolute top-2 right-2 text-red-400"><Trash2 size={16} /></button>
                     <InputGroup label="Наименование" value={item.name} onChange={(v: string) => setInvoiceData(prev => ({...prev, items: prev.items.map(i => i.id === item.id ? {...i, name: v} : i)}))} className="mb-1" />
                     <div className="flex gap-2">
                        <InputGroup label="Кол-во" type="number" value={item.quantity} onChange={(v: string) => setInvoiceData(prev => ({...prev, items: prev.items.map(i => i.id === item.id ? {...i, quantity: Number(v)} : i)}))} />
                        <InputGroup label="Цена" type="number" value={item.price} onChange={(v: string) => setInvoiceData(prev => ({...prev, items: prev.items.map(i => i.id === item.id ? {...i, price: Number(v)} : i)}))} />
                     </div>
                </div>
                ))}
            </div>
        </div>
    </div>
  );

  const renderLeaseForm = () => (
    <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Meta Info</h3>
             <div className="grid grid-cols-2 gap-2">
                <InputGroup label="Res ID" value={leaseData.reservationId} onChange={(v: string) => updateLease(null, 'reservationId', v)} />
                <InputGroup label="Source" value={leaseData.source} onChange={(v: string) => updateLease(null, 'source', v)} />
             </div>
             <InputGroup label="Created On" value={leaseData.createdDate} onChange={(v: string) => updateLease(null, 'createdDate', v)} />
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Vehicle</h3>
             <InputGroup label="Vehicle Name" value={leaseData.vehicle.name} onChange={(v: string) => updateLease('vehicle', 'name', v)} />
             <InputGroup label="Details (Type, Color)" value={leaseData.vehicle.details} onChange={(v: string) => updateLease('vehicle', 'details', v)} />
             <InputGroup label="Plate Number" value={leaseData.vehicle.plate} onChange={(v: string) => updateLease('vehicle', 'plate', v)} />
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Schedule</h3>
             <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded border">
                    <span className="text-xs font-bold text-gray-400 block mb-2">Pick-up</span>
                    <InputGroup label="Date" type="date" value={leaseData.pickup.date} onChange={(v: string) => updateLease('pickup', 'date', v)} />
                    <InputGroup label="Time" value={leaseData.pickup.time} onChange={(v: string) => updateLease('pickup', 'time', v)} />
                </div>
                 <div className="bg-white p-2 rounded border">
                    <span className="text-xs font-bold text-gray-400 block mb-2">Return</span>
                    <InputGroup label="Date" type="date" value={leaseData.dropoff.date} onChange={(v: string) => updateLease('dropoff', 'date', v)} />
                    <InputGroup label="Time" value={leaseData.dropoff.time} onChange={(v: string) => updateLease('dropoff', 'time', v)} />
                </div>
             </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Financials (THB)</h3>
             <div className="grid grid-cols-2 gap-2 mb-2">
                <InputGroup label="Regular Days" type="number" value={leaseData.pricing.daysRegular} onChange={(v: string) => updateLease('pricing', 'daysRegular', Number(v))} />
                <InputGroup label="Regular Price" type="number" value={leaseData.pricing.priceRegular} onChange={(v: string) => updateLease('pricing', 'priceRegular', Number(v))} />
             </div>
             <div className="grid grid-cols-2 gap-2 mb-2">
                <InputGroup label="Season Days" type="number" value={leaseData.pricing.daysSeason} onChange={(v: string) => updateLease('pricing', 'daysSeason', Number(v))} />
                <InputGroup label="Season Price" type="number" value={leaseData.pricing.priceSeason} onChange={(v: string) => updateLease('pricing', 'priceSeason', Number(v))} />
             </div>
             <div className="grid grid-cols-2 gap-2 border-t pt-2">
                <InputGroup label="Deposit" type="number" value={leaseData.pricing.deposit} onChange={(v: string) => updateLease('pricing', 'deposit', Number(v))} />
                <InputGroup label="TOTAL" type="number" value={leaseData.pricing.total} onChange={(v: string) => updateLease('pricing', 'total', Number(v))} />
             </div>
             
             {/* Extra Options */}
             <div className="mt-4">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Extras</span>
                    <button onClick={addExtraOption} className="text-blue-600"><Plus size={16}/></button>
                 </div>
                 {leaseData.extraOptions.map((opt, i) => (
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
                 <InputGroup label="Surname" value={leaseData.owner.surname} onChange={(v: string) => updateLease('owner', 'surname', v)} />
                 <InputGroup label="Contact" value={leaseData.owner.contact} onChange={(v: string) => updateLease('owner', 'contact', v)} />
                 <InputGroup label="Address" value={leaseData.owner.address} onChange={(v: string) => updateLease('owner', 'address', v)} />
             </div>
             <div>
                 <span className="text-xs font-bold text-gray-400 block mb-2">Rider (Tenant)</span>
                 <InputGroup label="Surname" value={leaseData.renter.surname} onChange={(v: string) => updateLease('renter', 'surname', v)} />
                 <InputGroup label="Contact" value={leaseData.renter.contact} onChange={(v: string) => updateLease('renter', 'contact', v)} />
                 <InputGroup label="Passport" value={leaseData.renter.passport} onChange={(v: string) => updateLease('renter', 'passport', v)} />
             </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Terms & Conditions</h3>
             <textarea 
                className="w-full h-32 text-[10px] p-2 border rounded font-mono"
                value={leaseData.terms}
                onChange={(e) => updateLease(null, 'terms', e.target.value)}
             />
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-1/3 bg-white border-r border-gray-200 h-screen overflow-y-auto sticky top-0 shadow-xl z-10 flex flex-col">
        {/* DOCUMENT TYPE SWITCHER */}
        <div className="p-4 bg-slate-800 text-white flex gap-2 shadow-inner">
             <button 
                onClick={() => setDocType('invoice')} 
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-sm font-medium transition-all ${docType === 'invoice' ? 'bg-blue-600 shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
             >
                <FileText size={16} /> Счет (РФ)
             </button>
             <button 
                onClick={() => setDocType('lease')} 
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-sm font-medium transition-all ${docType === 'lease' ? 'bg-blue-600 shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
             >
                <Car size={16} /> Lease
             </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">
                {docType === 'invoice' ? 'Редактор счета' : 'Contract Details'}
            </h2>
            
            {docType === 'invoice' && (
                <div className="flex gap-2">
                    <button 
                        onClick={handleResetInvoice} 
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Сброс"
                    >
                        <RotateCcw size={16} />
                    </button>
                    <button 
                        onClick={() => setShowAiModal(true)}
                        className="flex items-center gap-2 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 font-medium"
                    >
                        <Wand2 size={14} /> AI
                    </button>
                </div>
            )}
          </div>

          {/* DYNAMIC FORM RENDER */}
          {docType === 'invoice' ? renderInvoiceForm() : renderLeaseForm()}
        
        </div>
      </div>

      {/* PREVIEW AREA */}
      <div className="w-full md:w-2/3 bg-slate-800 p-4 md:p-8 flex flex-col items-center overflow-hidden h-screen relative">
        <div className="w-full max-w-[210mm] flex justify-between items-center mb-4">
             <div className="text-white">
                <h1 className="text-xl font-bold">
                    {docType === 'invoice' ? 'Предпросмотр' : 'Preview'}
                </h1>
                <p className="text-slate-400 text-sm">
                   {docType === 'invoice' ? 'A4 PDF • Russian Standard' : 'A4 PDF • Rental Agreement'}
                </p>
             </div>
             
            <button 
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-wait"
            >
                {isGeneratingPdf ? (
                    <> <Loader2 className="animate-spin" size={18} /> Processing... </>
                ) : (
                    <> <Download size={18} /> Download PDF </>
                )}
            </button>
        </div>

        <div className="flex-1 w-full overflow-y-auto custom-scrollbar pb-20">
             <div className="transform scale-[0.6] md:scale-[0.85] lg:scale-[0.9] origin-top transition-transform duration-300">
                {/* DYNAMIC PREVIEW RENDER */}
                {docType === 'invoice' ? (
                    <InvoicePreview data={invoiceData} />
                ) : (
                    <LeasePreview data={leaseData} />
                )}
            </div>
        </div>
      </div>

      {/* AI MODAL (Only for Invoice for now) */}
      {showAiModal && docType === 'invoice' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">AI Import</h3>
                    <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                
                {apiKeyMissing ? (
                   <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mb-4 text-sm">
                      <strong>API ключ не найден.</strong>
                   </div>
                ) : (
                  <>
                    <textarea 
                        className="w-full h-40 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none mb-4 resize-none"
                        placeholder="Вставьте текст счета..."
                        value={aiInputText}
                        onChange={(e) => setAiInputText(e.target.value)}
                    />
                    {aiError && <div className="text-red-500 text-sm mb-4">{aiError}</div>}
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setShowAiModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Отмена</button>
                        <button onClick={handleSmartImport} disabled={isAiLoading || !aiInputText.trim()} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                            {isAiLoading ? 'Analyzing...' : 'Parse'}
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
