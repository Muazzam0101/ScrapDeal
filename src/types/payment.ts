import { SyncStatus } from './sync';

export type PaymentMethod = 'cash' | 'upi';

export type PaymentStatus =
  | 'pending'
  | 'initiated'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired';

export interface Payment {
  paymentId: string;
  id?: string;
  localId?: string;
  remoteId?: string;

  dealId: string;
  transactionId?: string;
  lotId?: string;

  collectorId: string;
  recyclerId: string;

  amount: number;
  currency: string; // 'INR'

  method: PaymentMethod;
  status: PaymentStatus;

  initiatedAt: string;
  completedAt?: string;

  provider?: string; // 'cash' | 'razorpay' | 'upi_gateway'
  providerReference?: string; // UTR or provider transaction id

  cashPaidConfirmedByRecycler?: boolean;
  cashPaidConfirmedAt?: string;
  cashReceivedConfirmedByCollector?: boolean;
  cashReceivedConfirmedAt?: string;

  createdAt: string;
  updatedAt: string;

  syncStatus: SyncStatus;
  lastSyncedAt?: string;
}

