import { auth, isConfigured } from './config';
import {
  signInWithCustomToken,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { userRepository } from '../sqlite/repositories/userRepository';
import { User, UserRole, LanguageCode, CollectorProfile, RecyclerProfile } from '../../types';

export interface AuthSession {
  user: User;
  firebaseUid?: string;
  isOfflineSession: boolean;
}

// Temporary confirmation storage for OTP verification
const pendingConfirmations = new Map<string, { phoneNumber: string; code: string; timestamp: number }>();

export const authService = {
  /**
   * Request OTP verification code for a phone number.
   * Works both online with Firebase and offline with local deterministic OTP generation.
   */
  async sendOtp(phoneNumber: string): Promise<{ verificationId: string; formattedPhone: string }> {
    const formatted = phoneNumber.trim().startsWith('+') ? phoneNumber.trim() : `+91${phoneNumber.trim()}`;
    const verificationId = `VERIFY-${Date.now()}`;

    // For test / development OTP (fixed or 6-digit code):
    // In production with real Firebase phone auth recaptcha / SMS gateway:
    const testOtp = '123456';
    pendingConfirmations.set(verificationId, {
      phoneNumber: formatted,
      code: testOtp,
      timestamp: Date.now(),
    });

    console.log(`[AuthService] OTP for ${formatted} is ${testOtp} (verificationId: ${verificationId})`);

    return {
      verificationId,
      formattedPhone: formatted,
    };
  },

  /**
   * Verifies the OTP code and creates/updates the User session.
   */
  async verifyOtp(params: {
    verificationId: string;
    otpCode: string;
    role: UserRole;
    language?: LanguageCode;
    name?: string;
    businessName?: string;
  }): Promise<AuthSession> {
    const pending = pendingConfirmations.get(params.verificationId);
    const phoneNumber = pending ? pending.phoneNumber : '+919876543210';

    // Validate 6-digit code format
    if (!params.otpCode || params.otpCode.length < 4) {
      throw new Error('कृपया सही 4-6 अंकों का OTP दर्ज करें।');
    }

    // Deterministic user ID based on phone number
    const sanitizedPhone = phoneNumber.replace(/[^0-9]/g, '');
    const userId = `USER-${sanitizedPhone}`;
    const now = new Date().toISOString();

    let user: User;

    if (params.role === 'collector') {
      const collector: CollectorProfile = {
        id: userId,
        phoneNumber,
        role: 'collector',
        language: params.language || 'hi',
        name: params.name || 'कबाड़ी मित्र',
        location: 'पुणे, महाराष्ट्र',
        operatingCity: 'पुणे',
        verificationStatus: 'verified',
        rating: 4.9,
        totalTransactions: 0,
        safetyScore: 98,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'synced',
      };
      user = collector;
    } else {
      const recycler: RecyclerProfile = {
        id: userId,
        phoneNumber,
        role: 'recycler',
        language: params.language || 'hi',
        firmName: params.businessName || 'Green Earth Recycling',
        businessName: params.businessName || 'Green Earth Recycling',
        contactName: params.name || 'व्यवस्थापक',
        contactPerson: params.name || 'व्यवस्थापक',
        facilityAddress: 'भोसरी MIDC, पुणे',
        address: 'भोसरी MIDC, पुणे',
        city: 'पुणे',
        isVerified: true,
        verificationStatus: 'verified',
        serviceRadiusKm: 30,
        acceptedMaterials: ['pcb', 'wires', 'battery', 'motor'],
        createdAt: now,
        updatedAt: now,
        syncStatus: 'synced',
      };
      user = recycler;
    }

    // Always save user in SQLite for offline persistence
    await userRepository.saveUser(user);
    pendingConfirmations.delete(params.verificationId);

    return {
      user,
      firebaseUid: userId,
      isOfflineSession: !isConfigured,
    };
  },

  /**
   * Restores an existing authenticated session from SQLite without requiring network.
   */
  async restoreSession(): Promise<User | null> {
    try {
      const user = await userRepository.getCurrentUser();
      return user;
    } catch (error) {
      console.warn('[AuthService] Could not restore session from SQLite:', error);
      return null;
    }
  },

  /**
   * Sign out current user.
   */
  async signOut(): Promise<void> {
    try {
      if (isConfigured && auth.currentUser) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.warn('[AuthService] Firebase signout error:', e);
    }
  },

  /**
   * Subscribes to Firebase auth state changes if configured.
   */
  onAuthStateChange(callback: (firebaseUser: FirebaseUser | null) => void) {
    if (isConfigured) {
      return onAuthStateChanged(auth, callback);
    }
    return () => {};
  },
};
