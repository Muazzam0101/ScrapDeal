import { SyncStatus } from './sync';

export type UserRole = 'collector' | 'recycler';

export type LanguageCode = 'hi' | 'mr' | 'en';

export interface BaseUser {
  id: string; // Auth UID or local ID
  phoneNumber: string;
  role: UserRole;
  language: LanguageCode;
  createdAt?: string;
  updatedAt?: string;
  syncStatus?: SyncStatus;
  remoteId?: string;
  lastSyncedAt?: string;
}

export type VerificationStatus = 'not_started' | 'pending' | 'verified' | 'failed' | 'expired';

export interface CollectorProfile extends BaseUser {
  role: 'collector';
  name?: string;
  avatarUrl?: string;
  profilePhoto?: string;
  location?: string;
  operatingCity?: string;
  operatingArea?: string;
  totalTransactions?: number;
  rating?: number;
  safetyScore?: number;
  verificationStatus?: string; // Legacy compatibility
  identityVerificationStatus?: VerificationStatus;
  identityVerificationProvider?: string;
  identityVerificationRef?: string;
  identityVerifiedAt?: string;
  latitude?: number;
  longitude?: number;
}

export interface RecyclerProfile extends BaseUser {
  role: 'recycler';
  firmName?: string;
  businessName?: string;
  contactName?: string;
  contactPerson?: string;
  phoneNumber: string;
  email?: string;
  facilityAddress?: string;
  address?: string;
  city?: string;
  serviceRadiusKm?: number;
  serviceArea?: string;
  cpcbRegistrationNo?: string;
  registrationValidTill?: string;
  isVerified?: boolean; // Legacy compatibility
  verificationStatus?: string; // Legacy compatibility
  identityVerificationStatus?: VerificationStatus;
  identityVerificationProvider?: string;
  identityVerificationRef?: string;
  identityVerifiedAt?: string;
  authorizationVerificationStatus?: VerificationStatus;
  authorizationVerificationProvider?: string;
  authorizationVerificationRef?: string;
  authorizationVerifiedAt?: string;
  acceptedMaterials?: string[];
  gstin?: string;
  pickupAvailable?: boolean;
  isAvailable?: boolean;
  latitude?: number;
  longitude?: number;
}

export type User = CollectorProfile | RecyclerProfile;

