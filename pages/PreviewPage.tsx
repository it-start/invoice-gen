
import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { Loader2, AlertCircle, Lock, Download } from 'lucide-react';
import { fetchReservation } from '../services/ownimaApi';
import { authService } from '../services/authService';
import { LeasePdf } from '../components/LeasePdf';
import LeasePreview from '../components/LeasePreview';
import { LoginModal } from '../components/modals/LoginModal';
import { LeaseData, INITIAL_LEASE } from '../types';
import QRCode from 'qrcode';
import { useIsMobile } from '../hooks/useIsMobile';

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<LeaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const isMobile = useIsMobile();
  const [isDownloading, setIsDownloading] = useState(false);

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
      
      // 1. Fetch data from API
      const apiData = await fetchReservation(id);
      
      if (!apiData || Object.keys(apiData).length === 0) {
         setError("Reservation not found");
         return;
      }

      // 2. Generate QR Code
      const url = `https://stage.ownima.com/qr/${id}`;
      let qrCodeUrl = undefined;
      try {
          qrCodeUrl = await QRCode.toDataURL(url, { margin: 1, width: 200 });
      } catch (e) {
          console.error("QR Error", e);
      }

      // 3. Merge data
      const mergedData: LeaseData = {
          ...INITIAL_LEASE,
          ...apiData,
          reservationId: id,
          vehicle: { ...INITIAL_LEASE.vehicle, ...apiData.vehicle },
          pickup: { ...INITIAL_LEASE.pickup, ...apiData.pickup },
          dropoff: { ...INITIAL_LEASE.dropoff, ...apiData.dropoff },
          pricing: { ...INITIAL_LEASE.pricing, ...apiData.pricing },
          owner: { ...INITIAL_LEASE.owner, ...apiData.owner },
          renter: { ...INITIAL_LEASE.renter, ...apiData.renter },
          qrCodeUrl: qrCodeUrl
      };
      
      setData(mergedData);

    } catch (err: any) {
      if (err.message === 'Unauthorized') {
         setShowLoginModal(true);
      } else {
         console.error(err);
         setError("Failed to load reservation data");
      }
    } finally {
      setLoading(false);
    }
  }, [id, searchParams]);

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

  const handleLoginSuccess = () => {
      // Retry loading data after successful login
      loadData();
  };

  const handleDownload = async () => {
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

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-100 text-slate-500">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p>Loading Lease Document...</p>
      </div>
    );
  }

  // If we have an error (and it's not simply waiting for login), show error state
  if (error && !showLoginModal) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-100 text-red-500">
        <AlertCircle size={48} className="mb-4" />
        <p className="text-xl font-bold">{error || "Document not found"}</p>
      </div>
    );
  }

  // If we need to show login modal (Unauthorized), we can show a restricted access screen behind the modal
  if (showLoginModal) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white">
              <Lock size={64} className="mb-6 text-slate-600" />
              <h2 className="text-2xl font-bold mb-2">Restricted Access</h2>
              <p className="text-slate-400 mb-8">Authentication required to view this document.</p>
              <button 
                onClick={() => setShowLoginModal(true)} 
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-bold"
              >
                  Log In
              </button>
              <LoginModal 
                  isOpen={showLoginModal} 
                  onClose={() => setShowLoginModal(false)}
                  onSuccess={handleLoginSuccess}
              />
          </div>
      );
  }

  if (!data) return null;

  // --- MOBILE VIEW ---
  // PDFViewer relies on iframes which are broken on many mobile browsers.
  // We render the HTML preview instead and offer a download button.
  if (isMobile) {
      return (
        <div className="min-h-screen bg-slate-100 flex flex-col relative">
            {/* Mobile Header */}
            <div className="bg-slate-900 p-4 text-white shadow-md sticky top-0 z-20 flex justify-between items-center">
                <div>
                    <h1 className="font-bold text-lg">Lease Preview</h1>
                    <p className="text-xs text-slate-400">ID: {id}</p>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-200 p-4 custom-scrollbar">
                {/* Scale wrapper to fit 210mm (~794px) content onto small mobile screens */}
                {/* scale-45 fits ~360px width screens */}
                <div className="w-full flex justify-center pb-24">
                     <div className="origin-top transform scale-[0.45] sm:scale-[0.6] bg-white shadow-2xl">
                        <LeasePreview data={data} />
                     </div>
                </div>
            </div>

            {/* FAB Download Button */}
            <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-4 shadow-xl z-30 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-3 font-bold"
            >
                {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                Download PDF
            </button>
        </div>
      );
  }

  // --- DESKTOP VIEW ---
  return (
    <div className="h-screen w-full bg-slate-800 flex flex-col">
       <div className="bg-slate-900 p-4 text-white flex justify-between items-center shadow-md">
            <div>
                <h1 className="font-bold text-lg">Lease Agreement Preview</h1>
                <p className="text-xs text-slate-400">ID: {id}</p>
            </div>
            <button 
                onClick={handleDownload}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-1.5 rounded text-sm flex items-center gap-2 transition-colors"
            >
                <Download size={14} /> Download File
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
