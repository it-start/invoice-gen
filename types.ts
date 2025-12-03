export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Party {
  name: string;
  inn: string;
  kpp?: string;
  address: string;
  phone?: string;
  bankName?: string;
  bik?: string;
  accountNumber?: string;
  correspondentAccount?: string;
}

export type SellerType = 'company' | 'person';

export interface InvoiceData {
  number: string;
  date: string; // ISO string YYYY-MM-DD
  sellerType: SellerType;
  seller: Party;
  buyer: Party;
  items: InvoiceItem[];
  vatRate: number; // 0, 10, 20, or -1 for "Without VAT"
  currency: string;
  director?: string;
  accountant?: string;
}

export const VAT_RATES = [
  { value: -1, label: 'Без НДС' },
  { value: 0, label: '0%' },
  { value: 10, label: '10%' },
  { value: 20, label: '20%' },
];

export const INITIAL_INVOICE: InvoiceData = {
  number: '1',
  date: new Date().toISOString().split('T')[0],
  currency: 'RUB',
  vatRate: -1, // No VAT default
  sellerType: 'company',
  seller: {
    name: '',
    inn: '',
    address: '',
    bankName: '',
    bik: '',
    accountNumber: '',
    correspondentAccount: ''
  },
  buyer: {
    name: '',
    inn: '',
    address: ''
  },
  items: [
    { id: '1', name: 'Консультационные услуги', quantity: 1, price: 5000 }
  ],
  director: '',
  accountant: ''
};