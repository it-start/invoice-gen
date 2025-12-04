
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PDFViewer } from '@react-pdf/renderer';
import { Loader2, AlertCircle, Lock } from 'lucide-react';
import { fetchReservation } from '../services/ownimaApi';
import { LeasePdf } from '../components/LeasePdf';
import { LoginModal } from '../components/modals/LoginModal';
import { LeaseData, INITIAL_LEASE } from '../types';
import QRCode from 'qrcode';

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<LeaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
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
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLoginSuccess = () => {
      // Retry loading data after successful login
      loadData();
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

  return (
    <div className="h-screen w-full bg-slate-800 flex flex-col">
       <div className="bg-slate-900 p-4 text-white flex justify-between items-center shadow-md">
            <div>
                <h1 className="font-bold text-lg">Lease Agreement Preview</h1>
                <p className="text-xs text-slate-400">ID: {id}</p>
            </div>
       </div>
       <div className="flex-1 w-full">
          <PDFViewer width="100%" height="100%" className="border-none">
             <LeasePdf data={data} />
          </PDFViewer>
       </div>
    </div>
  );
}
