import { useState, useEffect } from 'react';
import { InvoiceData, INITIAL_INVOICE, SellerType } from '../types';

export const useInvoice = () => {
  const [data, setData] = useState<InvoiceData>(() => {
    try {
      const saved = localStorage.getItem('invoice_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_INVOICE;
  });

  useEffect(() => {
    localStorage.setItem('invoice_data', JSON.stringify(data));
  }, [data]);

  const updateSeller = (field: string, value: string) => {
    setData(prev => ({ ...prev, seller: { ...prev.seller, [field]: value } }));
  };

  const updateBuyer = (field: string, value: string) => {
    setData(prev => ({ ...prev, buyer: { ...prev.buyer, [field]: value } }));
  };

  const handleSellerTypeChange = (type: SellerType) => {
    setData(prev => ({
      ...prev,
      sellerType: type,
      seller: { ...prev.seller, kpp: type === 'person' ? '' : prev.seller.kpp },
      vatRate: type === 'person' ? -1 : prev.vatRate,
      director: type === 'person' ? '' : prev.director,
      accountant: type === 'person' ? '' : prev.accountant
    }));
  };

  const reset = () => {
     if (window.confirm('Сбросить данные счета?')) {
        setData({ ...INITIAL_INVOICE, items: [{...INITIAL_INVOICE.items[0], id: Math.random().toString()}] });
    }
  };
  
  const addItem = () => {
      setData(prev => ({...prev, items: [...prev.items, {id: Math.random().toString(), name: '', quantity: 1, price: 0}]}));
  };

  const updateItem = (id: string, field: string, value: any) => {
      setData(prev => ({...prev, items: prev.items.map(i => i.id === id ? {...i, [field]: value} : i)}));
  };

  const removeItem = (id: string) => {
      setData(prev => ({...prev, items: prev.items.filter(i => i.id !== id)}));
  };

  return {
    data,
    setData,
    updateSeller,
    updateBuyer,
    handleSellerTypeChange,
    reset,
    addItem,
    updateItem,
    removeItem
  };
};