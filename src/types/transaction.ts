import { SyncStatus } from './sync';
import { PaymentMethod, PaymentStatus } from './payment';

export type TransactionStatus =
  | 'pending'
  | 'handover_completed'
  | 'payment_pending'
  | 'completed'
  | 'cancelled';

export interface Transaction {
  transactionId: string;
  id?: string;
  localId?: string;
  remoteId?: string;
  transactionNumber: string;

  dealId: string;
  lotId: string;

  collectorId: string;
  recyclerId: string;

  materialCategory: string;
  materialName?: string;
  finalWeight: number; // Final weight in kg
  weightKg?: number; // Alias for backward compatibility

  agreedPrice: number; // Agreed rate per kg in INR
  ratePerKg?: number; // Alias for backward compatibility
  totalAmount: number;

  paymentId?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  handoverStatus: string; // 'completed'
  transactionStatus: TransactionStatus;

  traceabilityId?: string;
  traceabilityReference?: string;
  handoverReference?: string;

  completedAt?: string;
  date?: string; // Alias for backward compatibility

  createdAt: string;
  updatedAt: string;

  syncStatus: SyncStatus;
  lastSyncedAt?: string;
}

export interface TransactionReceipt {
  receiptNumber: string;
  transactionId: string;
  dealId: string;
  lotId: string;
  collectorId: string;
  collectorName?: string;
  recyclerId: string;
  recyclerName?: string;
  materialCategory: string;
  materialName: string;
  finalWeightKg: number;
  ratePerKg: number;
  totalAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  providerReference?: string;
  traceabilityReference?: string;
  handoverReference?: string;
  completedAt: string;
  issuedAt: string;
}
