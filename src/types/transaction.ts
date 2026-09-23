import { SyncStatus } from './sync';

export type PaymentMethod = 'cash' | 'upi';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Payment {
  id: string;
  transactionId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  upiReferenceNumber?: string;
  timestamp: string;
}

export interface Transaction {
  id: string;
  localId?: string;
  remoteId?: string;
  transactionNumber: string;
  lotId: string;
  collectorId: string;
  recyclerId: string;
  materialName: string;
  weightKg: number;
  ratePerKg: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  date: string;
  syncStatus?: SyncStatus;
  createdAt?: string;
  updatedAt?: string;
  lastSyncedAt?: string;
}
