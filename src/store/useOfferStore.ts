import { create } from 'zustand';
import { Offer, PickupOption } from '../types';
import { offerRepository } from '../services/sqlite/repositories/offerRepository';
import { dealFlowService } from '../services/deal/dealFlowService';
import { networkService } from '../services/connectivity/networkService';
import { firestoreService } from '../services/firebase/firestore';

interface OfferState {
  offersForLot: Record<string, Offer[]>;
  recyclerOffers: Offer[];
  isLoading: boolean;
  error: string | null;

  fetchOffersForLot: (lotId: string) => Promise<Offer[]>;
  fetchOffersForRecycler: (recyclerId: string) => Promise<void>;
  submitOffer: (params: {
    lotId: string;
    recyclerId: string;
    recyclerName?: string;
    ratePerKg: number;
    totalAmount?: number;
    pickupOption?: PickupOption;
    comments?: string;
  }) => Promise<Offer>;
  rejectOffer: (offerId: string, lotId?: string) => Promise<void>;
}

export const useOfferStore = create<OfferState>((set, get) => ({
  offersForLot: {},
  recyclerOffers: [],
  isLoading: false,
  error: null,

  fetchOffersForLot: async (lotId: string) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Read from SQLite
      const localOffers = await offerRepository.getOffersForLot(lotId);
      set((state) => ({
        offersForLot: {
          ...state.offersForLot,
          [lotId]: localOffers,
        },
        isLoading: false,
      }));

      // 2. If online, fetch remote offers and update cache
      if (networkService.isOnline()) {
        firestoreService.getOffersForLot(lotId).then(async (remoteOffers) => {
          if (remoteOffers && remoteOffers.length > 0) {
            await offerRepository.saveOffersFromRemote(remoteOffers);
            const refreshed = await offerRepository.getOffersForLot(lotId);
            set((state) => ({
              offersForLot: {
                ...state.offersForLot,
                [lotId]: refreshed,
              },
            }));
          }
        }).catch((e) => console.warn('[OfferStore] Remote offer fetch error:', e));
      }

      return localOffers;
    } catch (err: any) {
      set({ error: err?.message || 'ऑफर लोड करने में विफल', isLoading: false });
      return [];
    }
  },

  fetchOffersForRecycler: async (recyclerId: string) => {
    set({ isLoading: true, error: null });
    try {
      const localOffers = await offerRepository.getOffersByRecycler(recyclerId);
      set({ recyclerOffers: localOffers, isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || 'ऑफर सूची लोड करने में विफल', isLoading: false });
    }
  },

  submitOffer: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const offer = await dealFlowService.submitRecyclerOffer(params);
      set((state) => ({
        recyclerOffers: [offer, ...state.recyclerOffers],
        isLoading: false,
      }));
      return offer;
    } catch (err: any) {
      set({ error: err?.message || 'ऑफर भेजने में विफल', isLoading: false });
      throw err;
    }
  },

  rejectOffer: async (offerId: string, lotId?: string) => {
    try {
      await dealFlowService.rejectOffer(offerId);
      if (lotId) {
        await get().fetchOffersForLot(lotId);
      }
    } catch (err: any) {
      console.warn('[OfferStore] Reject offer error:', err);
    }
  },
}));
