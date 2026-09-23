import { create } from 'zustand';
import { Deal, HandoverRecord, Transaction, PaymentMethod } from '../types';
import { dealRepository } from '../services/sqlite/repositories/dealRepository';
import { handoverRepository } from '../services/sqlite/repositories/handoverRepository';
import { dealFlowService } from '../services/deal/dealFlowService';

interface DealState {
  deals: Deal[];
  activeDeals: Deal[];
  completedDeals: Deal[];
  currentDeal: Deal | null;
  currentHandover: HandoverRecord | null;
  isLoading: boolean;
  error: string | null;

  fetchUserDeals: (userId: string, role: 'collector' | 'recycler') => Promise<void>;
  fetchDealDetails: (dealId: string) => Promise<{ deal: Deal | null; handover: HandoverRecord | null }>;
  acceptOffer: (lotId: string, offerId: string, collectorId: string) => Promise<Deal>;
  confirmCollectorHandover: (params: {
    dealId: string;
    actualWeightKg?: number;
    photoUri?: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<{ handover: HandoverRecord; deal: Deal; transaction?: Transaction }>;
  confirmRecyclerHandover: (params: {
    dealId: string;
    actualWeightKg?: number;
    photoUri?: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<{ handover: HandoverRecord; deal: Deal; transaction?: Transaction }>;
  recordPayment: (lotOrTxId: string, method: PaymentMethod) => Promise<void>;
}

export const useDealStore = create<DealState>((set, get) => ({
  deals: [],
  activeDeals: [],
  completedDeals: [],
  currentDeal: null,
  currentHandover: null,
  isLoading: false,
  error: null,

  fetchUserDeals: async (userId: string, role: 'collector' | 'recycler') => {
    set({ isLoading: true, error: null });
    try {
      const allDeals = role === 'collector'
        ? await dealRepository.getDealsForCollector(userId)
        : await dealRepository.getDealsForRecycler(userId);

      const activeDeals = allDeals.filter((d) => d.status !== 'completed' && d.status !== 'cancelled');
      const completedDeals = allDeals.filter((d) => d.status === 'completed');

      set({
        deals: allDeals,
        activeDeals,
        completedDeals,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err?.message || 'सौदे लोड करने में विफल', isLoading: false });
    }
  },

  fetchDealDetails: async (dealId: string) => {
    set({ isLoading: true, error: null });
    try {
      const deal = await dealRepository.getDealById(dealId);
      const handover = await handoverRepository.getHandoverByDealId(dealId);
      set({ currentDeal: deal, currentHandover: handover, isLoading: false });
      return { deal, handover };
    } catch (err: any) {
      set({ error: err?.message || 'सौदा विवरण लोड करने में विफल', isLoading: false });
      return { deal: null, handover: null };
    }
  },

  acceptOffer: async (lotId: string, offerId: string, collectorId: string) => {
    set({ isLoading: true, error: null });
    try {
      const deal = await dealFlowService.acceptOffer(lotId, offerId, collectorId);
      await get().fetchUserDeals(collectorId, 'collector');
      set({ currentDeal: deal, isLoading: false });
      return deal;
    } catch (err: any) {
      set({ error: err?.message || 'ऑफर स्वीकार करने में विफल', isLoading: false });
      throw err;
    }
  },

  confirmCollectorHandover: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await dealFlowService.confirmCollectorHandover(params);
      set({ currentHandover: res.handover, currentDeal: res.deal, isLoading: false });
      return res;
    } catch (err: any) {
      set({ error: err?.message || 'हैंडओवर पुष्टि में विफल', isLoading: false });
      throw err;
    }
  },

  confirmRecyclerHandover: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await dealFlowService.confirmRecyclerHandover(params);
      set({ currentHandover: res.handover, currentDeal: res.deal, isLoading: false });
      return res;
    } catch (err: any) {
      set({ error: err?.message || 'पिकअप पुष्टि में विफल', isLoading: false });
      throw err;
    }
  },

  recordPayment: async (lotOrTxId: string, method: PaymentMethod) => {
    try {
      await dealFlowService.recordPayment(lotOrTxId, method);
    } catch (err: any) {
      console.warn('[DealStore] Record payment error:', err);
    }
  },
}));
