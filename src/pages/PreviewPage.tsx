import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { Loader2, AlertCircle, Lock, Download } from 'lucide-react';
import { fetchInvoiceHtml, fetchInvoicePdfBlob, loadLeaseData } from '../services/ownimaApi';
import { authService } from '../services/authService';
import { LeasePdf } from '../components/LeasePdf';
import LeasePreview from '../components/LeasePreview';
import { LoginModal } from '../components/modals/LoginModal';
import { LeaseData, Language } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';
import { BrandLogo } from '../components/ui/BrandLogo';
import { t } from '../utils/i18n';

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<LeaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [lang] = useState<Language>('en');
  
  // Server Side Rendering State
  const templateId = searchParams.get('template_id');
  const [serverHtml, setServerHtml] = useState<string | null>(null);
  
  const isMobile = useIsMobile();
  const [mobileScale, setMobileScale] = useState(0.42);
  const [isDownloading, setIsDownloading] = useState(false);

  // Check output mode: 'blob' implies redirecting to raw pdf, undefined implies UI wrapper
  const outputMode = searchParams.get('output');

  // Dynamic Scale Calculation for Mobile Preview
  useEffect(() => {
    const updateScale = () => {
      // Calculate scale to fit width with small margin (e.g. 16px total)
      // A4 width is approx 794px
      const availableWidth = window.innerWidth - 16;
      const scale = availableWidth / 794; 
      setMobileScale(scale);
    };

    if (isMobile) {
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }
  }, [isMobile]);

  const loadData = useCallback(async () => {
    if (!id) return;
    
    // Check for token in URL parameters and inject it if present
    const urlToken = searchParams.get('token');
    if (urlToken) {
        authService.setToken(urlToken);
    }
    
    try {
      setLoading(true);
      setError(null);
      setShowLoginModal(false); // Reset modal state when retrying
      
      // BRANCH: If template_id provided, fetch SERVER-SIDE HTML
      if (templateId) {
          const html = await fetchInvoiceHtml(id, templateId);
          setServerHtml(html);
          setLoading(false);
          return;
      }

      // BRANCH: Normal CLIENT-SIDE logic
      // Fetches API data, generates QR, and merges with defaults in one go
      const fullLeaseData = await loadLeaseData(id);
      setData(fullLeaseData);

    } catch (err: any) {
      if (err.message === 'Unauthorized') {
         setShowLoginModal(true);
      } else {
         console.error(err);
         setError(t('preview_not_found', lang));
      }
    } finally {
      setLoading(false);
    }
  }, [id, templateId, searchParams, lang]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Integration: Listen for Auth Token from parent window (Iframe support)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'AUTH_TOKEN' && event.data?.token) {
            console.debug("Received AUTH_TOKEN from parent");
            authService.setToken(event.data.token);
            loadData();
        }
    };

    window.addEventListener('message', handleMessage);
    
    // Notify parent that Preview is ready to receive token
    if (window.parent !== window) {
        window.parent.postMessage({ type: 'PREVIEW_READY', reservationId: id }, '*');
    }

    return () => window.removeEventListener('message', handleMessage);
  }, [loadData, id]);

  // Handle Blob Output Mode (Direct PDF View for CLIENT SIDE flow only)
  useEffect(() => {
    if (!data || outputMode !== 'blob' || templateId) return;

    const generateAndRedirect = async () => {
        try {
            // Generate PDF Blob
            const doc = <LeasePdf data={data} />;
            const blob = await pdf(doc).toBlob();
            
            // Create Object URL
            const url = URL.createObjectURL(blob);
            
            // Redirect current window/iframe to the blob URL
            window.location.replace(url);
        } catch (e) {
            console.error("Blob generation failed", e);
            setError("Failed to generate PDF blob");
        }
    };

    generateAndRedirect();
  }, [data, outputMode, templateId]);

  const handleLoginSuccess = () => {
      // Retry loading data after successful login
      loadData();
  };

  const handleDownloadClientPdf = async () => {
    if (!data) return;
    setIsDownloading(true);
    try {
      const doc = <LeasePdf data={data} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lease_${data.reservationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download Error", e);
      alert("Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadServerPdf = async () => {
      if (!id || !templateId) return;
      setIsDownloading(true);
      try {
          const blob = await fetchInvoicePdfBlob(id, templateId);
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `invoice_${id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      } catch (e) {
          console.error("Server PDF Download Error", e);
          alert("Failed to download PDF from server");
      } finally {
          setIsDownloading(false);
      }
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-100 text-slate-500">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p>{t('preview_loading', lang)}</p>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error && !showLoginModal) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-100 text-red-500">
        <AlertCircle size={48} className="mb-4" />
        <p className="text-xl font-bold">{error || t('preview_not_found', lang)}</p>
      </div>
    );
  }

  // --- LOGIN STATE ---
  if (showLoginModal) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white">
              <Lock size={64} className="mb-6 text-slate-600" />
              <div className="mb-8 flex flex-col items-center">
                 <BrandLogo className="text-white h-8 mb-6" />
                 <h2 className="text-2xl font-bold mb-2">{t('login_title', lang)}</h2>
                 <p className="text-slate-400">{t('login_desc', lang)}</p>
              </div>
              <button 
                onClick={() => setShowLoginModal(true)} 
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-bold"
              >
                  {t('btn_login', lang)}
              </button>
              <LoginModal 
                  isOpen={showLoginModal} 
                  onClose={() => setShowLoginModal(false)}
                  onSuccess={handleLoginSuccess}
                  lang={lang}
              />
          </div>
      );
  }

  // --- SERVER-SIDE PREVIEW (HTML) ---
  if (serverHtml && templateId) {
      return (
        <div className="h-screen w-full bg-slate-800 flex flex-col">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center shadow-md shrink-0">
                <div className="flex items-center gap-4">
                    <BrandLogo className="text-white h-5" />
                    <div className="h-6 w-px bg-slate-700"></div>
                    <div>
                        <h1 className="font-bold text-sm">{t('server_preview', lang)}</h1>
                        <p className="text-[10px] text-slate-400">ID: {id}</p>
                    </div>
                </div>
                <button 
                    onClick={handleDownloadServerPdf}
                    disabled={isDownloading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium flex items-center gap-2 shadow transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait"
                >
                    {isDownloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} 
                    {t('download_pdf', lang)}
                </button>
            </div>
            <div className="flex-1 w-full bg-white overflow-hidden">
                <iframe 
                    title="Invoice Preview"
                    srcDoc={serverHtml}
                    className="w-full h-full border-0"
                />
            </div>
        </div>
      );
  }

  // --- CLIENT-SIDE PREVIEW FALLBACKS ---
  
  if (!data) return null;

  // Raw Blob Output
  if (outputMode === 'blob') {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
            <Loader2 className="animate-spin mb-4 text-blue-600" size={48} />
            <p className="text-slate-500 font-medium">{t('generating_blob', lang)}</p>
        </div>
      );
  }

  // Mobile View (HTML Fallback)
  if (isMobile) {
      return (
        <div className="min-h-screen bg-slate-100 flex flex-col relative">
            <div className="bg-slate-900 p-4 text-white shadow-md sticky top-0 z-20 flex justify-between items-center">
                <BrandLogo className="text-white h-5" />
                <div className="text-right">
                    <p className="font-bold text-xs opacity-80">{t('mobile_preview_tab', lang)}</p>
                    <p className="text-[10px] text-slate-400">ID: {id}</p>
                </div>
            </div>
            <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-200 p-0 custom-scrollbar pt-4">
                <div className="w-full flex justify-center pb-24">
                     <div 
                        className="origin-top bg-white shadow-2xl transition-transform duration-300"
                        style={{ transform: `scale(${mobileScale})` }}
                     >
                        <LeasePreview data={data} lang={lang} />
                     </div>
                </div>
            </div>
            <button 
                onClick={handleDownloadClientPdf}
                disabled={isDownloading}
                className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-4 shadow-xl z-30 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-3 font-bold"
            >
                {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                {t('download_pdf', lang)}
            </button>
        </div>
      );
  }

  // Desktop View (PDF Viewer)
  return (
    <div className="h-screen w-full bg-slate-800 flex flex-col">
       <div className="bg-slate-900 p-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-4">
                <BrandLogo className="text-white h-6" />
                <div className="h-8 w-px bg-slate-700"></div>
                <div>
                    <h1 className="font-bold text-lg">{t('preview_lease_title', lang)}</h1>
                    <p className="text-xs text-slate-400">ID: {id}</p>
                </div>
            </div>
            <button 
                onClick={handleDownloadClientPdf}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-1.5 rounded text-sm flex items-center gap-2 transition-colors"
            >
                <Download size={14} /> {t('download_file', lang)}
            </button>
       </div>
       <div className="flex-1 w-full">
          <PDFViewer width="100%" height="100%" className="border-none">
             <LeasePdf data={data} />
          </PDFViewer>
       </div>
    </div>
  );
}