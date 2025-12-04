import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PDFViewer } from '@react-pdf/renderer';
import { Loader2, Download, AlertCircle } from 'lucide-react';
import { fetchReservation } from '../services/ownimaApi';
import { LeasePdf } from '../components/LeasePdf';
import { LeaseData, INITIAL_LEASE } from '../types';
import QRCode from 'qrcode';

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<LeaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        // 1. Fetch data from API
        const apiData = await fetchReservation(id);
        
        if (!apiData || Object.keys(apiData).length === 0) {
           setError("Reservation not found");
           return;
        }

        // 2. Generate QR Code (client-side generation for the PDF)
        const url = `https://stage.ownima.com/qr/${id}`;
        let qrCodeUrl = undefined;
        try {
            qrCodeUrl = await QRCode.toDataURL(url, { margin: 1, width: 200 });
        } catch (e) {
            console.error("QR Error", e);
        }

        // 3. Merge with default structure to ensure PDF doesn't crash on missing fields
        const mergedData: LeaseData = {
            ...INITIAL_LEASE, // Fallback defaults
            ...apiData, // API data overrides
            reservationId: id, // Ensure ID matches URL
            // Deep merge specific objects to avoid overwriting entire objects with partial data
            vehicle: { ...INITIAL_LEASE.vehicle, ...apiData.vehicle },
            pickup: { ...INITIAL_LEASE.pickup, ...apiData.pickup },
            dropoff: { ...INITIAL_LEASE.dropoff, ...apiData.dropoff },
            pricing: { ...INITIAL_LEASE.pricing, ...apiData.pricing },
            owner: { ...INITIAL_LEASE.owner, ...apiData.owner },
            renter: { ...INITIAL_LEASE.renter, ...apiData.renter },
            qrCodeUrl: qrCodeUrl
        };
        
        setData(mergedData);

      } catch (err) {
        console.error(err);
        setError("Failed to load reservation data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-100 text-slate-500">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p>Loading Lease Document...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-100 text-red-500">
        <AlertCircle size={48} className="mb-4" />
        <p className="text-xl font-bold">{error || "Document not found"}</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-800 flex flex-col">
       <div className="bg-slate-900 p-4 text-white flex justify-between items-center shadow-md">
            <div>
                <h1 className="font-bold text-lg">Lease Agreement Preview</h1>
                <p className="text-xs text-slate-400">ID: {id}</p>
            </div>
            {/* 
              Note: PDFViewer usually provides its own download button, 
              but we can add custom actions here if needed.
            */}
       </div>
       <div className="flex-1 w-full">
          <PDFViewer width="100%" height="100%" className="border-none">
             <LeasePdf data={data} />
          </PDFViewer>
       </div>
    </div>
  );
}