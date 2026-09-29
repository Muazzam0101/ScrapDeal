import { PaymentStatus } from '../../types';

export interface PaymentInitiationParams {
  paymentId: string;
  dealId: string;
  amount: number;
  currency: string;
  collectorId: string;
  recyclerId: string;
  collectorVpa?: string;
}

export interface PaymentInitiationResult {
  success: boolean;
  providerReference?: string;
  checkoutUrl?: string;
  upiIntentUrl?: string;
  rawResponse?: any;
}

export interface PaymentVerificationResult {
  isVerified: boolean;
  status: PaymentStatus;
  providerReference?: string;
  errorMessage?: string;
  rawResponse?: any;
}

export interface PaymentProvider {
  readonly name: string;
  isConfigured(): boolean;
  initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult>;
  getPaymentStatus(paymentId: string, providerReference?: string): Promise<PaymentVerificationResult>;
  verifyPayment(paymentId: string, providerReference: string): Promise<PaymentVerificationResult>;
}

export interface UPIProviderConfig {
  merchantId?: string;
  merchantVpa?: string;
  apiEndpoint?: string;
  apiKey?: string;
}

/**
 * Real UPI Payment Provider foundation.
 * Strictly avoids fake UTRs, fake callbacks, or synthetic success.
 * If credentials are not supplied, it safely reports unconfigured status.
 */
export class UpiPaymentProvider implements PaymentProvider {
  readonly name = 'upi_provider';
  private config: UPIProviderConfig;

  constructor(config: UPIProviderConfig = {}) {
    this.config = config;
  }

  updateConfig(config: UPIProviderConfig) {
    this.config = { ...this.config, ...config };
  }

  isConfigured(): boolean {
    return Boolean(
      (this.config.merchantVpa || this.config.merchantId) &&
      this.config.apiEndpoint &&
      this.config.apiKey
    );
  }

  async initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    if (!this.isConfigured()) {
      throw new Error('UPI payment is not configured yet. Live gateway credentials or UPI VPA are required.');
    }

    try {
      const response = await fetch(`${this.config.apiEndpoint}/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          paymentId: params.paymentId,
          dealId: params.dealId,
          amountPaise: Math.round(params.amount * 100),
          currency: params.currency,
          payeeVpa: params.collectorVpa || this.config.merchantVpa,
          reference: `SD-${params.paymentId}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`UPI initiation failed with status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        providerReference: data.referenceId || data.orderId,
        checkoutUrl: data.paymentUrl,
        upiIntentUrl: data.upiIntentUrl,
        rawResponse: data,
      };
    } catch (error: any) {
      console.error('[UpiPaymentProvider] Real initiation error:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string, providerReference?: string): Promise<PaymentVerificationResult> {
    if (!this.isConfigured()) {
      return {
        isVerified: false,
        status: 'pending',
        errorMessage: 'UPI payment is not configured yet.',
      };
    }

    try {
      const ref = providerReference || paymentId;
      const response = await fetch(`${this.config.apiEndpoint}/payments/status/${ref}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        return {
          isVerified: false,
          status: 'failed',
          errorMessage: `Status check returned ${response.status}`,
        };
      }

      const data = await response.json();
      const isSuccess = data.status === 'SUCCESS' || data.status === 'COMPLETED';
      return {
        isVerified: isSuccess,
        status: isSuccess ? 'completed' : data.status === 'FAILED' ? 'failed' : 'processing',
        providerReference: data.utr || data.referenceId,
        rawResponse: data,
      };
    } catch (error: any) {
      return {
        isVerified: false,
        status: 'processing',
        errorMessage: error.message,
      };
    }
  }

  async verifyPayment(paymentId: string, providerReference: string): Promise<PaymentVerificationResult> {
    if (!this.isConfigured()) {
      return {
        isVerified: false,
        status: 'failed',
        errorMessage: 'UPI payment is not configured yet.',
      };
    }

    try {
      const response = await fetch(`${this.config.apiEndpoint}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          paymentId,
          providerReference,
        }),
      });

      const data = await response.json();
      const verified = Boolean(response.ok && data.verified === true && data.status === 'SUCCESS');

      return {
        isVerified: verified,
        status: verified ? 'completed' : 'failed',
        providerReference: data.utr || providerReference,
        rawResponse: data,
      };
    } catch (error: any) {
      return {
        isVerified: false,
        status: 'failed',
        errorMessage: error.message,
      };
    }
  }
}

export const upiPaymentProvider = new UpiPaymentProvider();
