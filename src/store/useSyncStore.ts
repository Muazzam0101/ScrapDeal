import { create } from 'zustand';
import { syncEngine } from '../services/sync/syncEngine';
import { syncQueueRepository } from '../services/sqlite/repositories/syncQueueRepository';

interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  syncError: string | null;

  triggerSync: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set) => {
  // Subscribe to syncEngine state notifications
  syncEngine.subscribe((status) => {
    set({
      isSyncing: status.isSyncing,
      pendingCount: status.pendingCount,
      lastSyncTime: status.lastSyncedAt,
      syncError: status.error,
    });
  });

  return {
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    syncError: null,

    triggerSync: async () => {
      await syncEngine.triggerSync();
    },

    refreshPendingCount: async () => {
      const count = await syncQueueRepository.getPendingCount();
      set({ pendingCount: count });
    },
  };
});
