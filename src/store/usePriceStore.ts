import { create } from 'zustand';
import { MaterialPrice, PriceBoardItem, MaterialCategoryId } from '../types';
import { pricingService } from '../services/pricing/pricingService';

interface PriceState {
  priceBoardItems: PriceBoardItem[];
  recyclerRates: MaterialPrice[];
  isLoading: boolean;
  error: string | null;

  loadPriceBoard: () => Promise<void>;
  loadRecyclerRates: (recyclerId: string) => Promise<void>;
  saveRate: (params: {
    recyclerId: string;
    recyclerName?: string;
    materialCategory: MaterialCategoryId;
    ratePerKg: number;
    minRatePerKg?: number;
    maxRatePerKg?: number;
    locationCity?: string;
  }) => Promise<MaterialPrice>;
}

export const usePriceStore = create<PriceState>((set, get) => ({
  priceBoardItems: [],
  recyclerRates: [],
  isLoading: false,
  error: null,

  loadPriceBoard: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await pricingService.getPriceBoardItems();
      set({ priceBoardItems: items, isLoading: false });
    } catch (err: any) {
      console.warn('[PriceStore] Failed to load price board:', err);
      set({ error: err?.message || 'Failed to load prices', isLoading: false });
    }
  },

  loadRecyclerRates: async (recyclerId: string) => {
    set({ isLoading: true, error: null });
    try {
      const rates = await pricingService.getRecyclerRates(recyclerId);
      set({ recyclerRates: rates, isLoading: false });
    } catch (err: any) {
      console.warn('[PriceStore] Failed to load recycler rates:', err);
      set({ error: err?.message || 'Failed to load rates', isLoading: false });
    }
  },

  saveRate: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const created = await pricingService.setRecyclerRate(params);
      // Refresh both rates and price board
      const updatedRates = await pricingService.getRecyclerRates(params.recyclerId);
      const updatedBoard = await pricingService.getPriceBoardItems();
      set({ recyclerRates: updatedRates, priceBoardItems: updatedBoard, isLoading: false });
      return created;
    } catch (err: any) {
      set({ error: err?.message || 'Failed to save rate', isLoading: false });
      throw err;
    }
  },
}));
