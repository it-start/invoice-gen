
import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Download, Wand2, Loader2, RotateCcw, FileText, Car, Globe, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import InvoicePreview from '../components/InvoicePreview';
import LeasePreview from '../components/LeasePreview';
import { InvoicePdf } from '../components/PdfDocument';
import { LeasePdf } from '../components/LeasePdf';
import InvoiceForm from '../components/forms/InvoiceForm';
import LeaseForm from '../components/forms/LeaseForm';
import { LoginModal } from '../components/modals/LoginModal';
import { AiModal } from '../components/modals/AiModal';

import { useInvoice } from '../hooks/useInvoice';
import { useLease } from '../hooks/useLease';
import { useAiAssistant } from '../hooks/useAiAssistant';
import { useIsMobile } from '../hooks/useIsMobile';
import { Language, InvoiceData, LeaseData } from '../types';
import { t } from '../utils/i18n';

type DocType = 'invoice' | 'lease';

export default function EditorPage() {
  const [docType, setDocType] = useState<DocType>('invoice');
  const [lang, setLang] = useState<Language>('en');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Mobile UI State
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  
  // Hooks
  const invoice = useInvoice();
  const lease = useLease();
  const ai = useAiAssistant(lang);

  const handleSmartImport = async () => {
    const result = await ai.parse(docType);
    if (!result) return;

    if (docType === 'invoice') {
        const parsedData = result as Partial<InvoiceData>;
        invoice.setData(prev => ({
          ...prev,
          ...parsedData,
          seller: { ...prev.seller, ...(parsedData.seller || {}) },
          buyer: { ...prev.buyer, ...(parsedData.buyer || {}) },
          items: parsedData.items ? parsedData.items : prev.items 
        }));
    } else {
        const parsedData = result as Partial<LeaseData>;
        lease.updateLease(null, 'reservationId', parsedData.reservationId || lease.data.reservationId);
        if (parsedData.vehicle) lease.updateLease('vehicle', 'name', parsedData.vehicle.name);
    }
  };

  const handleLeaseLoad = async () => {
    try {
      await lease.loadFromApi();
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        setShowLoginModal(true);
      } else {
        alert(t('preview_not_found', lang));
      }
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
      alert("Error generating PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const toggleLang = () => {
      setLang(prev => prev === 'ru' ? 'en' : 'ru');
  };

  const getLeasePreviewLink = () => {
      let link = `/preview/lease/${lease.data.reservationId}`;
      if (lease.data.contractTemplateId) {
          link += `?template_id=${lease.data.contractTemplateId}`;
      }
      return link;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* MOBILE TABS */}
      {isMobile && (
        <div className="sticky top-0 z-50 bg-slate-900 text-white flex shadow-lg border-b border-slate-700">
            <button 
                onClick={() => setMobileTab('edit')}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${mobileTab === 'edit' ? 'border-blue-500 bg-slate-800 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
                {t('mobile_editor_tab', lang)}
            </button>
             <button 
                onClick={() => setMobileTab('preview')}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${mobileTab === 'preview' ? 'border-blue-500 bg-slate-800 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
                {t('mobile_preview_tab', lang)}
            </button>
        </div>
      )}

      {/* SIDEBAR: Sticky/Scroll on Desktop, Auto-height on Mobile */}
      <div className={`w-full md:w-1/3 bg-white border-r border-gray-200 h-auto md:h-screen md:overflow-y-auto md:sticky md:top-0 shadow-xl z-10 flex-col ${isMobile && mobileTab !== 'edit' ? 'hidden' : 'flex'}`}>
        {/* BRANDING & TYPE SWITCHER */}
        <div className="bg-slate-900 p-4 pb-0 flex flex-col gap-4 sticky top-0 z-20 md:static">
             
             {/* Document Switcher */}
             <div className="p-1 pb-4 flex gap-2">
                <button 
                    onClick={() => setDocType('invoice')} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-sm font-medium transition-all ${docType === 'invoice' ? 'bg-blue-600 shadow-lg text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
                >
                    <FileText size={16} /> {t('switch_invoice', lang)}
                </button>
                <button 
                    onClick={() => setDocType('lease')} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-sm font-medium transition-all ${docType === 'lease' ? 'bg-blue-600 shadow-lg text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
                >
                    <Car size={16} /> {t('switch_lease', lang)}
                </button>
             </div>
        </div>

        {/* Editor Content */}
        <div className="p-6 flex-1 md:overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">
                {docType === 'invoice' ? t('invoice_editor', lang) : t('lease_editor', lang)}
            </h2>
            
            <div className="flex gap-2">
                <button
                    onClick={toggleLang}
                    className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                    title="Switch Language"
                >
                    <Globe size={16} />
                </button>
                {docType === 'invoice' && (
                    <button 
                        onClick={invoice.reset} 
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title={t('reset', lang)}
                    >
                        <RotateCcw size={16} />
                    </button>
                )}
                <button 
                    onClick={ai.open}
                    className="flex items-center gap-2 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 font-medium"
                >
                    <Wand2 size={14} /> AI
                </button>
            </div>
          </div>

          {/* DYNAMIC FORM RENDER */}
          {docType === 'invoice' ? (
              <InvoiceForm data={invoice.data} handlers={invoice} lang={lang} />
          ) : (
              <LeaseForm 
                data={lease.data} 
                handlers={{
                    ...lease,
                    loadFromApi: handleLeaseLoad // Intercept loadFromApi to handle auth errors
                }} 
                lang={lang}
              />
          )}
        
        </div>
      </div>

      {/* PREVIEW AREA: Scroll on Desktop, Auto on Mobile */}
      <div className={`w-full md:w-2/3 bg-slate-800 p-4 md:p-8 flex-col items-center md:h-screen md:overflow-hidden relative min-h-[50vh] ${isMobile && mobileTab !== 'preview' ? 'hidden' : 'flex'}`}>
        <div className="w-full max-w-[210mm] flex justify-between items-center mb-4">
             <div className="text-white">
                <h1 className="text-xl font-bold">
                    {t('preview', lang)}
                </h1>
                <p className="text-slate-400 text-sm">
                   {docType === 'invoice' ? t('doc_invoice', lang) : t('doc_lease', lang)}
                </p>
             </div>
             
             <div className="flex gap-2">
                {docType === 'lease' && lease.data.reservationId && (
                     <Link 
                        to={getLeasePreviewLink()}
                        target="_blank"
                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow transition-all"
                        title={t('open_shareable_link', lang)}
                    >
                        <Share2 size={18} />
                    </Link>
                )}

                <button 
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-wait"
                >
                    {isGeneratingPdf ? (
                        <> <Loader2 className="animate-spin" size={18} /> {t('processing', lang)} </>
                    ) : (
                        <> <Download size={18} /> {t('download_pdf', lang)} </>
                    )}
                </button>
            </div>
        </div>

        <div className="flex-1 w-full md:overflow-y-auto custom-scrollbar pb-20">
             {/* Adjusted scaling for mobile: 0.42 fits 210mm (~793px) into ~333px, safe for 360px+ screens */}
             <div className="transform scale-[0.42] sm:scale-[0.6] md:scale-[0.85] lg:scale-[0.9] origin-top transition-transform duration-300">
                {/* DYNAMIC PREVIEW RENDER */}
                {docType === 'invoice' ? (
                    <InvoicePreview data={invoice.data} />
                ) : (
                    <LeasePreview data={lease.data} lang={lang} />
                )}
            </div>
        </div>
      </div>

      {/* MODALS */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => handleLeaseLoad()}
        lang={lang}
      />

      <AiModal 
        isOpen={ai.isOpen}
        onClose={ai.close}
        onParse={handleSmartImport}
        input={ai.input}
        setInput={ai.setInput}
        isLoading={ai.isLoading}
        error={ai.error}
        apiKeyMissing={ai.apiKeyMissing}
        lang={lang}
      />

    </div>
  );
}
