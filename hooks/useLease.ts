
import { useState, useEffect } from 'react';
import { LeaseData, INITIAL_LEASE } from '../types';
import QRCode from 'qrcode';
import { fetchReservation } from '../services/ownimaApi';

export const useLease = () => {
  const [data, setData] = useState<LeaseData>(() => {
    try {
        const saved = localStorage.getItem('lease_data');
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_LEASE;
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
      localStorage.setItem('lease_data', JSON.stringify(data));
  }, [data]);

  // QR Code Generation
  useEffect(() => {
    const generateQr = async () => {
        try {
            const url = `https://stage.ownima.com/qr/${data.reservationId}`;
            const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 200 });
            setData(prev => {
                if (prev.qrCodeUrl === dataUrl) return prev;
                return { ...prev, qrCodeUrl: dataUrl };
            });
        } catch (err) {
            console.error("QR Generation Error", err);
        }
    };
    if (data.reservationId) {
        generateQr();
    }
  }, [data.reservationId]);

  const updateLease = (section: keyof LeaseData | null, field: string, value: any) => {
    setData(prev => {
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
    setData(prev => ({
        ...prev,
        extraOptions: [...prev.extraOptions, { name: '', price: 0 }]
    }));
  };
  
  const updateExtraOption = (index: number, field: 'name' | 'price', value: any) => {
    const newOpts = [...data.extraOptions];
    newOpts[index] = { ...newOpts[index], [field]: value };
    setData(prev => ({ ...prev, extraOptions: newOpts }));
  };
  
  const removeExtraOption = (index: number) => {
      setData(prev => ({
          ...prev,
          extraOptions: prev.extraOptions.filter((_, i) => i !== index)
      }));
  };

  const loadFromApi = async () => {
      if (!data.reservationId) return;
      setIsLoading(true);
      try {
          const apiData = await fetchReservation(data.reservationId);
          if (apiData) {
              setData(prev => ({
                  ...prev,
                  ...apiData,
                  vehicle: { ...prev.vehicle, ...apiData.vehicle },
                  pickup: { ...prev.pickup, ...apiData.pickup },
                  dropoff: { ...prev.dropoff, ...apiData.dropoff },
                  pricing: { ...prev.pricing, ...apiData.pricing },
                  renter: { ...prev.renter, ...apiData.renter },
              }));
          }
      } finally {
          setIsLoading(false);
      }
  };

  return {
      data,
      isLoading,
      updateLease,
      addExtraOption,
      updateExtraOption,
      removeExtraOption,
      loadFromApi
  };
};
