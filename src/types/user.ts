export type UserRole = 'collector' | 'recycler';

export type LanguageCode = 'hi' | 'mr' | 'en';

export interface BaseUser {
  id: string;
  phoneNumber: string;
  role: UserRole;
  language: LanguageCode;
  createdAt?: string;
  updatedAt?: string;
}

export interface CollectorProfile extends BaseUser {
  role: 'collector';
  name?: string;
  avatarUrl?: string;
  operatingCity?: string;
  operatingArea?: string;
  totalTransactions?: number;
  rating?: number;
  safetyScore?: number;
}

export interface RecyclerProfile extends BaseUser {
  role: 'recycler';
  firmName?: string;
  contactPerson?: string;
  email?: string;
  facilityAddress?: string;
  city?: string;
  serviceRadiusKm?: number;
  cpcbRegistrationNo?: string;
  registrationValidTill?: string;
  isVerified: boolean;
  acceptedMaterials?: string[];
  gstin?: string;
}

export type User = CollectorProfile | RecyclerProfile;
