import { useState, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Download, Wand2, Loader2, RotateCcw, FileText, Car, Globe, Share2, MessageCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import InvoicePreview from '../components/InvoicePreview';
import LeasePreview from '../components/LeasePreview';
import { InvoicePdf } from '../components/PdfDocument';
import { LeasePdf } from '../components/LeasePdf';
import InvoiceForm from '../components/forms/InvoiceForm';
import LeaseForm from '../components/forms/LeaseForm';
import { LoginModal } from '../components/modals/LoginModal';
import { AiModal } from '../components/modals/AiModal';
import { ChatLayout } from '../components/chat/ChatLayout';

import { useInvoice } from '../hooks/useInvoice';
import { useLease } from '../hooks/useLease';
import { useAiAssistant } from '../hooks/useAiAssistant';
import { useIsMobile } from '../hooks/useIsMobile';
import { useChatStore } from '../stores/chatStore';
import { Language, InvoiceData, LeaseData } from '../types';
import { t } from '../utils/i18n';
import { BrandLogo } from '../components/ui/BrandLogo';

type DocType = 'invoice' | 'lease' | 'chat';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const [docType, setDocType] = useState<DocType>('chat');
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
  const chatStore = useChatStore();

  // Load chat session if ID is present in URL
  useEffect(() => {
    if (id) {
        setDocType('chat');
        chatStore.loadChatSession(id);
    }
  }, [id]);

  // Sync Lease Editor with Active Chat Session
  useEffect(() => {
      if (chatStore.leaseContext) {
          // If a chat is loaded, update the lease form with its data
          lease.setData(chatStore.leaseContext);
      }
  }, [chatStore.leaseContext]);

  const handleSmartImport = async () => {
    const result = await ai.parse(docType === 'chat' ? 'lease' : docType); // Fallback for chat
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

  const NavPills = () => (
     <div className="flex bg-slate-100 p-1 rounded-xl">
        <button 
            onClick={() => setDocType('chat')} 
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${docType === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
            <MessageCircle size={16} /> {t('switch_chat', lang)}
        </button>
        <button 
            onClick={() => setDocType('lease')} 
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${docType === 'lease' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
            <Car size={16} /> {t('switch_lease', lang)}
        </button>
         <button 
            onClick={() => setDocType('invoice')} 
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${docType === 'invoice' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
            <FileText size={16} /> {t('switch_invoice', lang)}
        </button>
    </div>
  );

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden text-slate-900">
        
        {/* UNIFIED APP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-30 shadow-sm">
             {/* Left: Logo + Nav (Desktop) */}
             <div className="flex items-center gap-6">
                 {/* Updated Logo Color to Brand Purple */}
                 <BrandLogo className="text-[#8263FF] h-6" />
                 <div className="hidden md:block">
                     <NavPills />
                 </div>
             </div>

             {/* Right: Actions */}
             <div className="flex items-center gap-3">
                 {/* Mobile Nav Icons (Simple) */}
                 <div className="md:hidden flex gap-1 bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setDocType('chat')} className={`p-2 rounded-md ${docType === 'chat' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><MessageCircle size={18} /></button>
                    <button onClick={() => setDocType('lease')} className={`p-2 rounded-md ${docType === 'lease' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><Car size={18} /></button>
                    <button onClick={() => setDocType('invoice')} className={`p-2 rounded-md ${docType === 'invoice' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><FileText size={18} /></button>
                 </div>

                 <button
                    onClick={toggleLang}
                    className="text-slate-400 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-slate-100"
                    title="Switch Language"
                >
                    <Globe size={20} />
                </button>
                
                {/* AI Button (only for editor modes) */}
                {docType !== 'chat' && (
                     <button 
                        onClick={ai.open}
                        className="flex items-center gap-2 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 font-bold tracking-wide"
                    >
                        <Wand2 size={14} /> AI
                    </button>
                )}
             </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 flex overflow-hidden relative">
            
            {docType === 'chat' ? (
                 <div className="w-full h-full p-0 md:p-6 overflow-hidden">
                     <div className="h-full max-w-[1600px] mx-auto">
                        <ChatLayout 
                            leaseData={lease.data} 
                            lang={lang} 
                            leaseHandlers={lease}
                        />
                     </div>
                 </div>
            ) : (
                 /* EDITOR SPLIT VIEW */
                 <div className="w-full h-full flex flex-col md:flex-row relative">
                      
                      {/* Mobile Tabs for Editor/Preview */}
                      {isMobile && (
                        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 flex shadow-sm">
                            <button 
                                onClick={() => setMobileTab('edit')}
                                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${mobileTab === 'edit' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400'}`}
                            >
                                {t('mobile_editor_tab', lang)}
                            </button>
                            <button 
                                onClick={() => setMobileTab('preview')}
                                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${mobileTab === 'preview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400'}`}
                            >
                                {t('mobile_preview_tab', lang)}
                            </button>
                        </div>
                      )}

                      {/* SIDEBAR (Form) */}
                      <div className={`w-full md:w-1/3 bg-white border-r border-slate-200 h-full flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 ${isMobile && mobileTab !== 'edit' ? 'hidden' : 'flex'}`}>
                           <div className="p-4 md:p-8 overflow-y-auto h-full custom-scrollbar">
                               {/* Title & Reset */}
                               <div className="flex justify-between items-center mb-8">
                                   <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                                       {docType === 'invoice' ? t('invoice_editor', lang) : t('lease_editor', lang)}
                                   </h2>
                                   
                                   {docType === 'invoice' && (
                                        <button 
                                            onClick={invoice.reset} 
                                            className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-slate-50"
                                            title={t('reset', lang)}
                                        >
                                            <RotateCcw size={18} />
                                        </button>
                                   )}
                               </div>
                               
                               {/* Dynamic Form */}
                               {docType === 'invoice' ? (
                                  <InvoiceForm data={invoice.data} handlers={invoice} lang={lang} />
                               ) : (
                                  <LeaseForm 
                                    data={lease.data} 
                                    handlers={lease} 
                                    lang={lang}
                                  />
                               )}
                           </div>
                      </div>

                      {/* PREVIEW */}
                      <div className={`w-full md:w-2/3 bg-slate-800 p-4 md:p-8 flex-col items-center overflow-hidden relative ${isMobile && mobileTab !== 'preview' ? 'hidden' : 'flex'}`}>
                           
                           {/* Preview Header */}
                           <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 z-10 shrink-0">
                                <div className="text-white">
                                    <h1 className="text-lg font-bold opacity-90">
                                        {t('preview', lang)}
                                    </h1>
                                    <p className="text-slate-400 text-xs">
                                    {docType === 'invoice' ? t('doc_invoice', lang) : t('doc_lease', lang)}
                                    </p>
                                </div>
                                
                                <div className="flex gap-2">
                                    {docType === 'lease' && lease.data.reservationId && (
                                        <Link 
                                            to={getLeasePreviewLink()}
                                            target="_blank"
                                            className="bg-slate-700/50 hover:bg-slate-700 text-white px-3 py-2 rounded-lg font-medium flex items-center gap-2 transition-all backdrop-blur-sm"
                                            title={t('open_shareable_link', lang)}
                                        >
                                            <Share2 size={18} />
                                        </Link>
                                    )}

                                    <button 
                                        onClick={handleDownloadPdf}
                                        disabled={isGeneratingPdf}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-wait"
                                    >
                                        {isGeneratingPdf ? (
                                            <> <Loader2 className="animate-spin" size={18} /> {t('processing', lang)} </>
                                        ) : (
                                            <> <Download size={18} /> {t('download_pdf', lang)} </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Preview Canvas */}
                            <div className="flex-1 w-full md:overflow-y-auto custom-scrollbar pb-20 flex justify-center">
                                {/* Adjusted scaling for better visibility */}
                                <div className="transform scale-[0.42] sm:scale-[0.6] md:scale-[0.85] lg:scale-[0.9] origin-top transition-transform duration-300 shadow-2xl">
                                    {docType === 'invoice' ? (
                                        <InvoicePreview data={invoice.data} />
                                    ) : (
                                        <LeasePreview data={lease.data} lang={lang} />
                                    )}
                                </div>
                            </div>
                      </div>
                 </div>
            )}
        </div>

        {/* MODALS */}
        <LoginModal 
            isOpen={showLoginModal} 
            onClose={() => setShowLoginModal(false)}
            onSuccess={() => {/* Auth refresh handled via state */}}
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