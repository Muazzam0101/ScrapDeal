import {
  MaterialCategoryId,
  AnomalyEvaluationResult,
  AIAnomalyEvent,
} from '../../types';
import { MODEL_REGISTRY } from './modelRegistry';
import { priceRepository } from '../sqlite/repositories/priceRepository';
import { aiRepository } from '../sqlite/repositories/aiRepository';
import { syncQueueRepository } from '../sqlite/repositories/syncQueueRepository';

export const anomalyDetectionService = {
  /**
   * Evaluates a transaction or lot against multi-variable historical patterns.
   *
   * Signals:
   * - Unusual rate deviation from recent observed market rates
   * - Abnormal lot weight (e.g. > 2500 kg for kabadiwala single lot)
   * - Discrepancy between calculated total (weight * rate) and provided amount
   *
   * Strictly ADVISORY: Flags transactions for user/human review.
   * Never automatically bans users, confiscates funds, or rejects transactions.
   */
  async evaluateTransaction(params: {
    materialCategory: MaterialCategoryId;
    weightKg: number;
    ratePerKg: number;
    totalAmount: number;
    transactionId?: string;
    lotId?: string;
    collectorId?: string;
    recyclerId?: string;
  }): Promise<AnomalyEvaluationResult & { localEventId?: string }> {
    const { materialCategory, weightKg, ratePerKg, totalAmount, transactionId, lotId } = params;

    const modelInfo = MODEL_REGISTRY.anomalyDetection;
    const threshold = modelInfo.thresholds.anomalyScoreThreshold;

    const signals: string[] = [];
    let signalWeights = 0;

    // Signal 1: Weight bounds check (extreme kabadiwala lot)
    if (weightKg > modelInfo.thresholds.extremeWeightKg) {
      signals.push('unusual_large_lot_weight');
      signalWeights += 0.75;
    } else if (weightKg <= 0) {
      signals.push('invalid_weight');
      signalWeights += 0.75;
    }

    // Signal 2: Arithmetic consistency check
    const expectedTotal = weightKg * ratePerKg;
    if (Math.abs(expectedTotal - totalAmount) > 5) {
      signals.push('amount_calculation_mismatch');
      signalWeights += 0.40;
    }

    // Signal 3: Historical price deviation check
    const recentPrices = await priceRepository.getPricesByMaterial(materialCategory);
    if (recentPrices.length > 0) {
      const validRates = recentPrices.map((p) => p.ratePerKg).filter((r) => r > 0);
      if (validRates.length > 0) {
        const meanRate = validRates.reduce((a, b) => a + b, 0) / validRates.length;
        const variance =
          validRates.reduce((a, b) => a + Math.pow(b - meanRate, 2), 0) / validRates.length;
        const stdDev = Math.sqrt(variance) || (meanRate * 0.15); // Fallback standard deviation

        const zScore = Math.abs(ratePerKg - meanRate) / stdDev;

        // If rate is extreme (more than 2.5 standard deviations or 4x above mean)
        if (zScore > modelInfo.thresholds.maxZScore || ratePerKg > meanRate * 4 || ratePerKg < meanRate * 0.2) {
          signals.push('extreme_price_deviation');
          signalWeights += 0.75;
        }
      }
    }

    // Compute composite anomaly score normalized to [0.0, 1.0]
    const anomalyScore = Number(Math.min(1.0, signalWeights).toFixed(2));
    const isFlagged = anomalyScore >= threshold;

    let reason: string | undefined;
    if (isFlagged) {
      if (signals.includes('extreme_price_deviation')) {
        reason = 'Unusual transaction pattern detected: Rate is significantly outside recent observed rates.';
      } else if (signals.includes('unusual_large_lot_weight')) {
        reason = 'Unusual transaction pattern detected: Weight is unusually large for a single collector lot.';
      } else if (signals.includes('amount_calculation_mismatch')) {
        reason = 'Unusual transaction pattern detected: Total amount differs from calculated rate × weight.';
      } else {
        reason = 'Unusual transaction pattern detected: Review transaction details before proceeding.';
      }
    }

    // Persist anomaly event in SQLite and sync queue
    let localEventId: string | undefined;
    if (isFlagged || transactionId || lotId) {
      localEventId = `ANOM-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const anomalyRecord: AIAnomalyEvent = {
        localId: localEventId,
        transactionId,
        lotId,
        modelName: modelInfo.name,
        modelVersion: modelInfo.version,
        anomalyScore,
        status: isFlagged ? 'flagged' : 'normal',
        reason,
        signals,
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
      };

      await aiRepository.saveAnomalyEvent(anomalyRecord);

      await syncQueueRepository.enqueueOperation({
        entityType: 'ai_anomaly_event',
        localId: localEventId,
        operationType: 'CREATE',
        payload: anomalyRecord,
      });
    }

    return {
      isFlagged,
      anomalyScore,
      status: isFlagged ? 'flagged' : 'normal',
      reason,
      signals,
      modelName: modelInfo.name,
      modelVersion: modelInfo.version,
      localEventId,
    };
  },

  /**
   * Evaluates payment activity for anomalies:
   * - Duplicate payment attempts
   * - Unusually high amount
   * - Multiple failed payments
   * Strictly flags/alerts without automatically canceling transactions.
   */
  async evaluatePayment(params: {
    paymentId?: string;
    dealId: string;
    amount: number;
    method: string;
    collectorId: string;
    recyclerId: string;
    failedAttemptsCount?: number;
    isDuplicateAttempt?: boolean;
  }): Promise<{ isFlagged: boolean; anomalyScore: number; reason?: string; signals: string[] }> {
    const signals: string[] = [];
    let signalWeights = 0;

    if (params.isDuplicateAttempt) {
      signals.push('duplicate_payment_attempt');
      signalWeights += 0.85;
    }

    if (params.amount > 200000) {
      signals.push('unusually_large_payment_amount');
      signalWeights += 0.65;
    }

    if ((params.failedAttemptsCount || 0) >= 3) {
      signals.push('repeated_payment_failures');
      signalWeights += 0.70;
    }

    const anomalyScore = Number(Math.min(1.0, signalWeights).toFixed(2));
    const isFlagged = anomalyScore >= 0.6;
    let reason: string | undefined;

    if (isFlagged) {
      reason = 'Unusual payment activity detected. Review transaction before proceeding.';
    }

    return {
      isFlagged,
      anomalyScore,
      reason,
      signals,
    };
  },
};

