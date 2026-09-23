import { create } from 'zustand';
import { locationService, Coordinates } from '../services/location/locationService';

interface LocationState {
  hasPermission: boolean;
  coords: Coordinates | null;
  approxCoords: Coordinates | null;
  selectedCity: string;
  isLoading: boolean;
  permissionDenied: boolean;

  checkPermission: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<Coordinates | null>;
  setSelectedCity: (city: string) => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  hasPermission: false,
  coords: null,
  approxCoords: null,
  selectedCity: 'पुणे, महाराष्ट्र (Pune)',
  isLoading: false,
  permissionDenied: false,

  checkPermission: async () => {
    const granted = await locationService.checkPermissions();
    set({ hasPermission: granted });
    return granted;
  },

  requestPermission: async () => {
    set({ isLoading: true });
    const result = await locationService.requestPermissions();
    if (result.granted) {
      const position = await locationService.getCurrentCoordinates();
      const approx = position ? locationService.getApproximateCoordinates(position) : null;
      set({
        hasPermission: true,
        coords: position,
        approxCoords: approx,
        permissionDenied: false,
        isLoading: false,
      });
      return true;
    } else {
      set({
        hasPermission: false,
        permissionDenied: true,
        isLoading: false,
      });
      return false;
    }
  },

  refreshLocation: async () => {
    set({ isLoading: true });
    try {
      const position = await locationService.getCurrentCoordinates();
      const approx = position ? locationService.getApproximateCoordinates(position) : null;
      set({
        coords: position,
        approxCoords: approx,
        hasPermission: !!position,
        isLoading: false,
      });
      return position;
    } catch {
      set({ isLoading: false });
      return null;
    }
  },

  setSelectedCity: (city: string) => {
    set({ selectedCity: city });
  },
}));
