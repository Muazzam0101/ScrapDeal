import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole, LanguageCode, CollectorProfile, RecyclerProfile } from '../types';
import { authService, SendOtpResult } from '../services/firebase/auth';
import { userRepository } from '../services/sqlite/repositories/userRepository';

interface AuthState {
  currentUser: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  verificationId: string | null;

  // Actions
  requestOtp: (phoneNumber: string) => Promise<SendOtpResult>;
  verifyOtp: (params: {
    verificationId: string;
    otpCode: string;
    role: UserRole;
    language?: LanguageCode;
    name?: string;
    businessName?: string;
  }) => Promise<User>;
  selectRoleQuick: (role: UserRole) => Promise<User>;
  setRole: (role: UserRole) => void;
  switchRole: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<User | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  verificationId: null,

  requestOtp: async (phoneNumber: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.sendOtp(phoneNumber);
      set({ verificationId: result.verificationId, isLoading: false });
      return result;
    } catch (err: any) {
      set({ error: err.message || 'OTP भेजने में विफल', isLoading: false });
      throw err;
    }
  },

  verifyOtp: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.verifyOtp(params);
      try {
        await AsyncStorage.setItem('@scrapdeal_active_session_user_id', session.user.id);
      } catch (storageErr) {
        console.warn('[AuthStore] Failed to write session to AsyncStorage:', storageErr);
      }
      set({
        currentUser: session.user,
        role: session.user.role,
        isAuthenticated: true,
        isLoading: false,
        verificationId: null,
        isInitialized: true,
      });
      return session.user;
    } catch (err: any) {
      set({ error: err.message || 'OTP सत्यापन विफल', isLoading: false });
      throw err;
    }
  },

  /**
   * Fast entry from RoleSelectionScreen with instant SQLite profile creation.
   */
  selectRoleQuick: async (role: UserRole) => {
    set({ isLoading: true, error: null });
    try {
      const defaultPhone = role === 'collector' ? '+919876543210' : '+919876543211';
      const session = await authService.verifyOtp({
        verificationId: `QUICK-${Date.now()}`,
        otpCode: '000000',
        role,
        name: role === 'collector' ? 'कबाड़ी मित्र' : 'Green Earth Recycling',
        businessName: role === 'recycler' ? 'Green Earth Recycling' : undefined,
      });

      set({
        currentUser: session.user,
        role: session.user.role,
        isAuthenticated: true,
        isLoading: false,
      });
      return session.user;
    } catch (err: any) {
      set({ error: err.message || 'रोल चयन में त्रुटि', isLoading: false });
      throw err;
    }
  },

  setRole: (role: UserRole) => {
    const user = get().currentUser;
    if (user) {
      if (role === 'collector') {
        const updated: CollectorProfile = {
          ...user,
          role: 'collector',
          name: (user as any).name || 'कबाड़ी मित्र',
          location: (user as any).location || 'पुणे, महाराष्ट्र',
        };
        userRepository.saveUser(updated);
        set({ role, currentUser: updated });
      } else {
        const updated: RecyclerProfile = {
          ...user,
          role: 'recycler',
          firmName: (user as any).firmName || 'Green Earth Recycling',
          businessName: (user as any).businessName || 'Green Earth Recycling',
          identityVerificationStatus: (user as any).identityVerificationStatus || 'not_started',
          authorizationVerificationStatus: (user as any).authorizationVerificationStatus || 'not_started',
        };
        userRepository.saveUser(updated);
        set({ role, currentUser: updated });
      }
    } else {
      set({ role });
    }
  },

  switchRole: () => {
    const current = get().role;
    const nextRole: UserRole = current === 'collector' ? 'recycler' : 'collector';
    get().setRole(nextRole);
  },

  updateProfile: async (updates: Partial<User>) => {
    const user = get().currentUser;
    if (!user) return;
    if (user.role === 'collector') {
      const merged: CollectorProfile = {
        ...user,
        ...(updates as Partial<CollectorProfile>),
        role: 'collector',
        updatedAt: new Date().toISOString(),
      };
      await userRepository.saveUser(merged);
      set({ currentUser: merged });
    } else {
      const merged: RecyclerProfile = {
        ...user,
        ...(updates as Partial<RecyclerProfile>),
        role: 'recycler',
        updatedAt: new Date().toISOString(),
      };
      await userRepository.saveUser(merged);
      set({ currentUser: merged });
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('@scrapdeal_active_session_user_id');
    } catch (e) {
      console.warn('[AuthStore] Failed to remove session from AsyncStorage:', e);
    }
    await authService.signOut();
    set({
      currentUser: null,
      role: null,
      isAuthenticated: false,
      error: null,
      isInitialized: true,
    });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      let activeUserId: string | null = null;
      try {
        activeUserId = await AsyncStorage.getItem('@scrapdeal_active_session_user_id');
      } catch (storageErr) {
        console.warn('[AuthStore] AsyncStorage read error:', storageErr);
      }

      if (!activeUserId) {
        set({
          currentUser: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        });
        return null;
      }

      const user = await userRepository.getUserById(activeUserId);
      if (user) {
        set({
          currentUser: user,
          role: user.role,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });
        return user;
      }

      // If user was not found for that id, clear stale session
      try {
        await AsyncStorage.removeItem('@scrapdeal_active_session_user_id');
      } catch (_) {}
      set({
        currentUser: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
      return null;
    } catch (e) {
      console.warn('[AuthStore] Session restore error:', e);
      set({ isLoading: false, isInitialized: true });
      return null;
    }
  },
}));
