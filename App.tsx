import { useState, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Download, Wand2, Loader2, RotateCcw, FileText, Car } from 'lucide-react';

import InvoicePreview from './components/InvoicePreview';
import LeasePreview from './components/LeasePreview';
import { InvoicePdf } from './components/PdfDocument';
import { LeasePdf } from './components/LeasePdf';
import InvoiceForm from './components/forms/InvoiceForm';
import LeaseForm from './components/forms/LeaseForm';

import { useInvoice } from './hooks/useInvoice';
import { useLease } from './hooks/useLease';
import { parseInvoiceText } from './services/geminiService';

type DocType = 'invoice' | 'lease';

function App() {
  const [docType, setDocType] = useState<DocType>('invoice');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Hooks
  const invoice = useInvoice();
  const lease = useLease();

  // AI Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

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

  const handleSmartImport = async () => {
    if (!aiInputText.trim()) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const parsedData = await parseInvoiceText(aiInputText);
      if (parsedData) {
        invoice.setData(prev => ({
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
          doc = <InvoicePdf data={invoice.data} />;
          filename = `invoice_${invoice.data.number}.pdf`;
      } else {
          doc = <LeasePdf data={lease.data} />;
          filename = `lease_${lease.data.reservationId}.pdf`;
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
                        onClick={invoice.reset} 
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
          {docType === 'invoice' ? (
              <InvoiceForm data={invoice.data} handlers={invoice} />
          ) : (
              <LeaseForm data={lease.data} handlers={lease} />
          )}
        
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
                    <InvoicePreview data={invoice.data} />
                ) : (
                    <LeasePreview data={lease.data} />
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