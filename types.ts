

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
export type Language = 'ru' | 'en';

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
  id?: string; // UUID for API calls
  reservationId: string; // Display ID (e.g. humanized "123-456")
  contractTemplateId?: string; // New field for Server-Side Preview
  status?: LeaseStatus; // Added status field
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
    fee: number;
  };
  dropoff: {
    date: string;
    time: string;
    fee: number;
  };
  pricing: {
    daysRegular: number;
    priceRegular: number;
    daysSeason: number;
    priceSeason: number;
    deposit: number;
    total: number;
    currency?: string; // Currency code (e.g. THB, USD)
  };
  extraOptions: { name: string; price: number }[];
  terms: string; // The long text
  owner: {
    surname: string;
    contact: string;
    address: string;
    signature?: string; // Base64 data URL
  };
  renter: {
    surname: string;
    contact: string;
    passport: string;
    signature?: string; // Base64 data URL
    avatar?: string; // Avatar URL
  };
  qrCodeUrl?: string;
}

// --- CHAT TYPES ---

export type MessageType = 'text' | 'system' | 'image';

// Updated to match ReservationStatus enum
export type LeaseStatus = 
  | 'pending' 
  | 'confirmation_rider' 
  | 'confirmed' 
  | 'collected' 
  | 'maintenance' 
  | 'completed' 
  | 'cancelled' 
  | 'overdue' 
  | 'conflict' 
  | 'confirmation_owner' 
  | 'no_response' 
  | 'rejected'; // Kept for backward compatibility if needed

// Internal UI Message Format
export interface ChatMessage {
  id: string;
  senderId: string; // 'me' or 'other'
  text: string;
  timestamp: number; // Unix timestamp in ms
  type: MessageType;
  status: 'sent' | 'read';
  attachmentUrl?: string; // URL for image/file attachments
  metadata?: {
    status?: LeaseStatus;
  };
}

// Official Ntfy.sh API Contract
export interface NtfyMessage {
  id: string;
  time: number; // Unix timestamp
  event: 'message' | 'open' | 'keepalive';
  topic: string;
  message: string;
  title?: string; // Used as Sender Name
  priority?: number;
  tags?: string[]; // Used for flags like 'read', 'system', 'status:collected'
  attachment?: {
    name: string;
    url: string;
    type: string;
    size: number;
  };
}

export interface ChatUser {
  id: string;
  name: string;
  avatar: string; // url or initials
  status: 'online' | 'offline' | 'busy';
  role: 'Owner' | 'Renter' | 'Support';
  contact?: string;
  email?: string;
}

export interface ChatSession {
  id: string;
  user: ChatUser;
  lastMessage: string;
  lastMessageTime: number; // Unix timestamp in ms
  unreadCount: number;
  messages: ChatMessage[];
  isArchived?: boolean; // New flag for swipe-to-archive
  // Cached summary for list view
  reservationSummary?: {
    vehicleName: string;
    plateNumber: string;
    status: LeaseStatus;
    price: number;
  };
}

// --- ASSET TELEPORT (V2) ---

export type DomainType = 'vehicle' | 'property' | 'equipment' | 'coworking';

export interface Asset {
  id: string;
  organizationId: string;
  name: string;
  domainType: DomainType;
  attributes: Record<string, any>;
  images: string[];
  status: 'available' | 'booked' | 'maintenance';
}

export interface BookingV2 {
  id: string;
  assetId: string;
  userId: string;
  startDatetime: string;
  endDatetime: string;
  status: LeaseStatus;
  pricing: {
    totalAmount: number;
    currencyCode: string;
    details?: Record<string, any>;
  };
  contractTermsHash?: string;
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
(hereinafter referred to as “Agreement”)

1. Parties to the Agreement:
1.1. Owner - the party providing the vehicle for rent.
1.2. Rider (Tenant) - the party renting and using the vehicle.

2. Subject of the Agreement:
2.1. The Owner agrees to rent, and the Rider agrees to accept and use the vehicle (hereinafter referred to as “Vehicle”) described in the rental form.
2.2. The rental is based on a daily rate, with specific pick-up and return times indicated in the agreement.

3. Rental Period:
3.1. Pick-up date and time: as specified in the “Pick-up” section.
3.2. Return date and time: as specified in the “Return” section.
3.3. Late returns are subject to additional charges as defined in the agreement.

4. Payment Terms:
4.1. The total rental fee is shown in the “Total Price” field.
4.2. A refundable security deposit is required and indicated in the “Deposit” section.
4.3. The deposit may be withheld partially or fully in case of vehicle damage, traffic fines, or late return.

5. Responsibilities of the Rider:
5.1. The Rider agrees to operate the Vehicle with care and in compliance with local traffic laws.
5.2. The Rider must not allow third parties to operate the Vehicle without the Owner’s written consent.
5.3. The Rider assumes full financial responsibility for loss, damage, theft, or fines incurred during the rental period.
5.4. The Vehicle must be returned in the same condition as received, with the same level of fuel unless otherwise agreed.

6. Responsibilities of the Owner:
6.1. The Owner ensures that the Vehicle is in roadworthy condition at the time of rental.
6.2. The Owner is not liable for any losses, delays, or damages resulting from Rider’s use of the Vehicle unless caused by previously undisclosed faults.

7. Additional Conditions:
7.1. Extension of the rental period is subject to availability and additional charges.
7.2. No refunds are provided for early returns.
7.3. The Rider confirms they hold a valid driver’s license and meet legal requirements for operating the rented Vehicle.
7.4. This Agreement may be signed in paper or digital form and holds equal legal force.

8. Signatures:
Both parties agree to the terms and conditions stated herein and confirm this with their signatures.`;

export const INITIAL_LEASE: LeaseData = {
  reservationId: '9048',
  contractTemplateId: '',
  source: 'OFFLINE_WALK_IN',
  status: 'pending',
  createdDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
  vehicle: {
    name: 'BMW X1, 2017',
    details: 'SUV • Automatic • Black',
    plate: 'CXR 4672'
  },
  pickup: {
    date: '2025-11-10',
    time: '14:00 - 16:00',
    fee: 0
  },
  dropoff: {
    date: '2025-11-24',
    time: '10:00 - 12:00',
    fee: 0
  },
  pricing: {
    daysRegular: 3,
    priceRegular: 993,
    daysSeason: 11,
    priceSeason: 3641,
    deposit: 300,
    total: 6904,
    currency: 'THB'
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