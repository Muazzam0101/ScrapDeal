import { create } from 'zustand';
import { MaterialLot, LotStatus, MaterialCategoryId, PickupOption } from '../types';
import { lotRepository } from '../services/sqlite/repositories/lotRepository';
import { syncQueueRepository } from '../services/sqlite/repositories/syncQueueRepository';
import { syncEngine } from '../services/sync/syncEngine';
import { networkService } from '../services/connectivity/networkService';

interface LotState {
  collectorLots: MaterialLot[];
  availableLots: MaterialLot[];
  selectedLot: MaterialLot | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCollectorLots: (collectorId: string) => Promise<void>;
  fetchAvailableLots: () => Promise<void>;
  createLot: (params: {
    collectorId: string;
    categoryId: MaterialCategoryId;
    weightKg: number;
    photos: string[];
    ratePerKg?: number;
    pickupOption?: PickupOption;
    locationCity?: string;
    locationArea?: string;
    status?: LotStatus;
  }) => Promise<MaterialLot>;
  updateLotStatus: (localId: string, status: LotStatus) => Promise<void>;
}

export const useLotStore = create<LotState>((set, get) => ({
  collectorLots: [],
  availableLots: [],
  selectedLot: null,
  isLoading: false,
  error: null,

  fetchCollectorLots: async (collectorId: string) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Read from SQLite (works completely offline)
      const localLots = await lotRepository.getLotsByCollector(collectorId);
      set({ collectorLots: localLots, isLoading: false });

      // 2. If online, trigger sync engine to pull remote updates and then re-read
      if (networkService.isOnline()) {
        syncEngine.triggerSync().then(async () => {
          const refreshed = await lotRepository.getLotsByCollector(collectorId);
          set({ collectorLots: refreshed });
        });
      }
    } catch (err: any) {
      set({ error: err.message || 'लॉट लोड करने में विफल', isLoading: false });
    }
  },

  fetchAvailableLots: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. Read available lots from SQLite cache
      const localLots = await lotRepository.getAvailableLots();
      set({ availableLots: localLots, isLoading: false });

      // 2. If online, trigger background refresh
      if (networkService.isOnline()) {
        syncEngine.triggerSync().then(async () => {
          const refreshed = await lotRepository.getAvailableLots();
          set({ availableLots: refreshed });
        });
      }
    } catch (err: any) {
      set({ error: err.message || 'उपलब्ध लॉट लोड करने में विफल', isLoading: false });
    }
  },

  createLot: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const localId = `LOT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const now = new Date().toISOString();
      const agreedTotalAmount = params.ratePerKg ? Math.round(params.weightKg * params.ratePerKg) : undefined;

      const newLot: MaterialLot = {
        id: localId,
        localId,
        lotNumber: `LOT-${Date.now().toString().slice(-6)}`,
        collectorId: params.collectorId,
        categoryId: params.categoryId,
        condition: 'mixed',
        weightKg: params.weightKg,
        approximateWeight: params.weightKg,
        photos: params.photos,
        photoUrls: params.photos,
        locationCity: params.locationCity || 'पुणे',
        locationArea: params.locationArea || 'महाराष्ट्र',
        status: params.status || 'created',
        agreedRatePerKg: params.ratePerKg,
        agreedTotalAmount,
        pickupOption: params.pickupOption || 'collector_drop',
        syncStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      // 1. Write to SQLite (Permanent local offline storage)
      await lotRepository.createLot(newLot);

      // 2. Enqueue into sync_queue
      await syncQueueRepository.enqueueOperation({
        entityType: 'material_lot',
        localId,
        operationType: 'CREATE',
        payload: newLot,
      });

      // 3. Update Zustand local array immediately (optimistic UI)
      set((state) => ({
        collectorLots: [newLot, ...state.collectorLots],
        availableLots: [newLot, ...state.availableLots],
        isLoading: false,
      }));

      // 4. If online, trigger background synchronization
      if (networkService.isOnline()) {
        syncEngine.triggerSync().catch((e) =>
          console.warn('[LotStore] Background sync trigger caught error:', e)
        );
      }

      return newLot;
    } catch (err: any) {
      set({ error: err.message || 'लॉट सुरक्षित करने में विफल', isLoading: false });
      throw err;
    }
  },

  updateLotStatus: async (localId: string, status: LotStatus) => {
    const lot = await lotRepository.getLotById(localId);
    if (!lot) return;

    const updated = { ...lot, status, updatedAt: new Date().toISOString(), syncStatus: 'pending' as const };
    await lotRepository.updateLot(updated);

    await syncQueueRepository.enqueueOperation({
      entityType: 'material_lot',
      localId,
      remoteId: lot.remoteId,
      operationType: 'UPDATE',
      payload: updated,
    });

    set((state) => ({
      collectorLots: state.collectorLots.map((l) => (l.localId === localId ? updated : l)),
      availableLots: state.availableLots.map((l) => (l.localId === localId ? updated : l)),
    }));

    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[LotStore] Sync error:', e));
    }
  },
}));
