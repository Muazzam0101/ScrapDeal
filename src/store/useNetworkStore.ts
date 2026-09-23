import { create } from 'zustand';
import { networkService } from '../services/connectivity/networkService';

interface NetworkState {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  connectionType: string;
  setNetworkStatus: (isOnline: boolean, reachable: boolean | null, type: string) => void;
  simulateConnectivity: (isOnline: boolean | null) => void;
}

export const useNetworkStore = create<NetworkState>((set) => {
  // Listen to network service changes
  networkService.addListener((isOnline, state) => {
    set({
      isOnline,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type || 'unknown',
    });
  });

  return {
    isOnline: networkService.isOnline(),
    isInternetReachable: true,
    connectionType: 'wifi',

    setNetworkStatus: (isOnline, isInternetReachable, connectionType) =>
      set({ isOnline, isInternetReachable, connectionType }),

    simulateConnectivity: (isOnline) => {
      networkService.simulateConnectivity(isOnline);
      set({ isOnline: networkService.isOnline() });
    },
  };
});
