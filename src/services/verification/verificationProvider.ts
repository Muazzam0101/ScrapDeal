import { UserRole, VerificationStatus, User } from '../../types';
import { userRepository } from '../sqlite/repositories/userRepository';
import { syncQueueRepository } from '../sqlite/repositories/syncQueueRepository';

export interface VerificationInitiateResult {
  status: VerificationStatus;
  referenceId: string;
  provider: string;
  message: string;
}

export interface VerificationCheckResult {
  status: VerificationStatus;
  timestamp?: string;
  details?: string;
}

export interface VerificationProvider {
  id: string;
  name: string;
  initiateIdentityVerification(userId: string, role: UserRole): Promise<VerificationInitiateResult>;
  checkIdentityStatus(referenceId: string): Promise<VerificationCheckResult>;
  initiateAuthorizationVerification(
    userId: string,
    details: { cpcbRegistrationNo?: string; gstin?: string; businessName?: string }
  ): Promise<VerificationInitiateResult>;
  checkAuthorizationStatus(referenceId: string): Promise<VerificationCheckResult>;
}

/**
 * Standard Digital Verification Provider Implementation.
 * STRICT: If external KYC/regulatory credentials are not configured,
 * it leaves verification status as 'pending' with honest notices.
 * Never fabricates fake verified: true or simulated KYC passes.
 */
export class ConfiguredVerificationProvider implements VerificationProvider {
  id = 'standard_digital_provider';
  name = 'ScrapDeal Digital Verification';

  async initiateIdentityVerification(userId: string, role: UserRole): Promise<VerificationInitiateResult> {
    const referenceId = `IDV-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const now = new Date().toISOString();

    // Update local user state to 'pending'
    await userRepository.updateProfile(userId, {
      identityVerificationStatus: 'pending',
      identityVerificationProvider: this.name,
      identityVerificationRef: referenceId,
      identityVerifiedAt: now,
    });

    const updatedUser = (await userRepository.getUserById(userId))!;

    // Enqueue profile sync
    await syncQueueRepository.enqueueOperation({
      entityType: 'user',
      localId: userId,
      operationType: 'UPDATE',
      payload: updatedUser,
    });

    return {
      status: 'pending',
      referenceId,
      provider: this.name,
      message: 'पहचान सत्यापन अनुरोध दर्ज किया गया (Identity verification queued. Status: Pending)',
    };
  }

  async checkIdentityStatus(referenceId: string): Promise<VerificationCheckResult> {
    // When no external third-party KYC webhook is configured, remains pending
    return {
      status: 'pending',
      timestamp: new Date().toISOString(),
      details: 'सत्यापन प्रक्रियाधीन है (Verification pending review)',
    };
  }

  async initiateAuthorizationVerification(
    userId: string,
    details: { cpcbRegistrationNo?: string; gstin?: string; businessName?: string }
  ): Promise<VerificationInitiateResult> {
    const referenceId = `AUTH-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const now = new Date().toISOString();

    // Update recycler profile
    await userRepository.updateProfile(userId, {
      authorizationVerificationStatus: 'pending',
      authorizationVerificationProvider: this.name,
      authorizationVerificationRef: referenceId,
      authorizationVerifiedAt: now,
      cpcbRegistrationNo: details.cpcbRegistrationNo || undefined,
      gstin: details.gstin || undefined,
    } as any);

    const updatedUser = (await userRepository.getUserById(userId))!;

    // Enqueue profile sync
    await syncQueueRepository.enqueueOperation({
      entityType: 'user',
      localId: userId,
      operationType: 'UPDATE',
      payload: updatedUser,
    });

    return {
      status: 'pending',
      referenceId,
      provider: this.name,
      message: 'व्यावसायिक प्राधिकरण अनुरोध दर्ज किया गया (Business authorization submitted. Status: Pending)',
    };
  }

  async checkAuthorizationStatus(referenceId: string): Promise<VerificationCheckResult> {
    return {
      status: 'pending',
      timestamp: new Date().toISOString(),
      details: 'प्राधिकरण सत्यापन लंबित है (Authorization verification pending review)',
    };
  }
}

export const verificationService = new ConfiguredVerificationProvider();
