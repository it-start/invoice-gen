
import { DomainType } from '../types';

export interface DomainTermConfig {
  contractTitle: string;
  providerLabel: string; // e.g. Owner, Landlord
  customerLabel: string; // e.g. Renter, Tenant
  assetLabel: string;    // e.g. Vehicle, Property
  startLabel: string;    // e.g. Pick-up, Check-in
  endLabel: string;      // e.g. Drop-off, Check-out
  idLabel: string;       // e.g. Plate, Address
}

export const DOMAIN_TERMS: Record<DomainType, DomainTermConfig> = {
  vehicle: {
    contractTitle: 'Vehicle Rental Agreement',
    providerLabel: 'Owner',
    customerLabel: 'Renter',
    assetLabel: 'Vehicle',
    startLabel: 'Pick-up',
    endLabel: 'Drop-off',
    idLabel: 'License Plate'
  },
  property: {
    contractTitle: 'Residential Lease Agreement',
    providerLabel: 'Landlord',
    customerLabel: 'Tenant',
    assetLabel: 'Property',
    startLabel: 'Check-in',
    endLabel: 'Check-out',
    idLabel: 'Address'
  },
  equipment: {
    contractTitle: 'Equipment Rental Contract',
    providerLabel: 'Lessor',
    customerLabel: 'Lessee',
    assetLabel: 'Equipment',
    startLabel: 'Start Date',
    endLabel: 'End Date',
    idLabel: 'Serial Number'
  },
  coworking: {
    contractTitle: 'Workspace Usage Agreement',
    providerLabel: 'Provider',
    customerLabel: 'Member',
    assetLabel: 'Workspace',
    startLabel: 'Start',
    endLabel: 'End',
    idLabel: 'Space ID'
  }
};

export const getDomainTerm = (domain: DomainType, key: keyof DomainTermConfig): string => {
  return DOMAIN_TERMS[domain]?.[key] || DOMAIN_TERMS.vehicle[key];
};
