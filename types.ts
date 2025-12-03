
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

// --- NEW LEASE TYPES ---

export interface LeaseData {
  reservationId: string;
  source: string;
  createdDate: string; // DateTime string
  vehicle: {
    name: string; // e.g. BMW X1, 2017
    details: string; // e.g. LAND • MOTORCYCLE...
    plate: string;
  };
  pickup: {
    date: string;
    time: string;
  };
  dropoff: {
    date: string;
    time: string;
  };
  pricing: {
    daysRegular: number;
    priceRegular: number;
    daysSeason: number;
    priceSeason: number;
    deposit: number;
    total: number;
  };
  extraOptions: { name: string; price: number }[];
  terms: string; // The long text
  owner: {
    surname: string;
    contact: string;
    address: string;
  };
  renter: {
    surname: string;
    contact: string;
    passport: string;
  };
  qrCodeUrl?: string;
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

export const DEFAULT_TERMS = `DAILY VEHICLE RENTAL AGREEMENT
(hereinafter referred to as "Agreement")

1. Parties to the Agreement:
1.1. Owner - the party providing the vehicle for rent.
1.2. Rider (Tenant) - the party renting and using the vehicle.

2. Subject of the Agreement:
2.1. The Owner agrees to rent, and the Rider agrees to accept and use the vehicle described in the rental form.
2.2. The rental is based on a daily rate, with specific pick-up and return times.

3. Responsibilities of the Rider:
3.1. The Rider agrees to operate the Vehicle with care and in compliance with local traffic laws.
3.2. The Rider assumes full financial responsibility for loss, damage, theft, or fines.`;

export const INITIAL_LEASE: LeaseData = {
  reservationId: '9048',
  source: 'OFFLINE_WALK_IN',
  createdDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
  vehicle: {
    name: 'BMW X1, 2017',
    details: 'SUV • Automatic • Black',
    plate: 'CXR 4672'
  },
  pickup: {
    date: '2025-11-10',
    time: '14:00 - 16:00'
  },
  dropoff: {
    date: '2025-11-24',
    time: '10:00 - 12:00'
  },
  pricing: {
    daysRegular: 3,
    priceRegular: 993,
    daysSeason: 11,
    priceSeason: 3641,
    deposit: 300,
    total: 6904
  },
  extraOptions: [
    { name: 'Pressure', price: 100 },
    { name: 'Chair kid', price: 2170 }
  ],
  terms: DEFAULT_TERMS,
  owner: {
    surname: 'Your Surname',
    contact: '+000000000 • email@example.com',
    address: 'Rent name, Country, Region, City, Street 123'
  },
  renter: {
    surname: 'Rider Surname',
    contact: '+000000000',
    passport: ''
  }
};