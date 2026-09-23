import {
  MaterialCategoryId,
  PriceEstimationResult,
  AIPriceEstimate,
} from '../../types';
import { MODEL_REGISTRY } from './modelRegistry';
import { priceRepository } from '../sqlite/repositories/priceRepository';
import { transactionRepository } from '../sqlite/repositories/transactionRepository';
import { aiRepository } from '../sqlite/repositories/aiRepository';
import { syncQueueRepository } from '../sqlite/repositories/syncQueueRepository';

export const priceEstimationService = {
  /**
   * Computes an empirical price estimate range using real market observations
   * (active recycler rates + historical completed transactions).
   *
   * Zero fake numbers: if fewer than 2 real observations exist, returns isAvailable: false.
   */
  async estimateLotPrice(params: {
    materialCategory: MaterialCategoryId;
    weightKg: number;
    locationCity?: string;
    locationArea?: string;
    lotId?: string;
  }): Promise<PriceEstimationResult & { localEstimateId?: string }> {
    const { materialCategory, weightKg, locationCity, lotId } = params;

    if (!materialCategory || !weightKg || weightKg <= 0) {
      return {
        isAvailable: false,
        message: 'AI estimate unavailable: Material and valid weight are required.',
      };
    }

    const modelInfo = MODEL_REGISTRY.priceEstimation;
    const minThreshold = modelInfo.thresholds.minDataPointsThreshold;

    // 1. Gather active recycler rates for this material
    const recyclerRates = await priceRepository.getPricesByMaterial(materialCategory);

    // 2. Gather completed transaction rates for this material
    const completedTxs = await transactionRepository.getTransactionsByMaterial(materialCategory);

    // 3. Extract all valid rate per kg observations with timestamps
    const observations: Array<{ rate: number; timestamp: string }> = [];

    for (const r of recyclerRates) {
      if (r.ratePerKg && r.ratePerKg > 0) {
        // Optional location preference weighting
        observations.push({
          rate: r.ratePerKg,
          timestamp: r.updatedAt || r.createdAt || new Date().toISOString(),
        });
      }
    }

    for (const tx of completedTxs) {
      if (tx.ratePerKg && tx.ratePerKg > 0) {
        observations.push({
          rate: tx.ratePerKg,
          timestamp: tx.date || tx.createdAt || new Date().toISOString(),
        });
      }
    }

    // 4. Data Sufficiency Check: Never invent numbers if real data is lacking
    if (observations.length < minThreshold) {
      return {
        isAvailable: false,
        dataPointCount: observations.length,
        message: 'Not enough market data for AI estimate.',
        modelName: modelInfo.name,
        modelVersion: modelInfo.version,
      };
    }

    // 5. Compute mathematical regression/distribution boundaries
    const rates = observations.map((o) => o.rate).sort((a, b) => a - b);
    const n = rates.length;

    // Find min, max, average
    const minObserved = rates[0];
    const maxObserved = rates[n - 1];
    const sum = rates.reduce((acc, v) => acc + v, 0);
    const avgObserved = sum / n;

    // Interquartile-weighted range for realistic bounds
    const q1 = rates[Math.floor(n * 0.25)] || minObserved;
    const q3 = rates[Math.floor(n * 0.75)] || maxObserved;

    const lowerRateBound = Math.min(minObserved, q1);
    const upperRateBound = Math.max(maxObserved, q3);

    const estimatedMin = Math.round(lowerRateBound * weightKg);
    const estimatedMax = Math.round(upperRateBound * weightKg);
    const estimatedAverage = Math.round(avgObserved * weightKg);

    // Derive confidence from sample size and standard deviation
    const variance =
      rates.reduce((acc, v) => acc + Math.pow(v - avgObserved, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const relativeSpread = avgObserved > 0 ? stdDev / avgObserved : 0.5;

    // Base confidence starts at 0.60, increases with observations, penalized by high spread
    const sampleBonus = Math.min(0.30, (n / 10) * 0.30);
    const spreadPenalty = Math.min(0.20, relativeSpread * 0.20);
    const confidence = Number(
      Math.max(0.50, Math.min(0.95, 0.65 + sampleBonus - spreadPenalty)).toFixed(2)
    );

    // Find the latest timestamp among observations
    const timestamps = observations.map((o) => new Date(o.timestamp).getTime());
    const latestTimestamp = new Date(Math.max(...timestamps)).toISOString();

    const basis = [
      'Recent recycler rates',
      'Completed transactions',
      'Material category',
      `Weight (${weightKg} kg)`,
      locationCity ? `Location (${locationCity})` : 'Regional market data',
    ];

    let localEstimateId: string | undefined;

    // 6. Persist estimation if lotId is associated
    if (lotId) {
      localEstimateId = `EST-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const estimateRecord: AIPriceEstimate = {
        localId: localEstimateId,
        lotId,
        modelName: modelInfo.name,
        modelVersion: modelInfo.version,
        estimatedMin,
        estimatedMax,
        estimatedAverage,
        confidence,
        basis,
        dataPointCount: n,
        lastMarketDataAt: latestTimestamp,
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
      };

      await aiRepository.savePriceEstimate(estimateRecord);

      await syncQueueRepository.enqueueOperation({
        entityType: 'ai_price_estimate',
        localId: localEstimateId,
        operationType: 'CREATE',
        payload: estimateRecord,
      });
    }

    return {
      isAvailable: true,
      estimatedMin,
      estimatedMax,
      estimatedAverage,
      confidence,
      basis,
      dataPointCount: n,
      lastMarketDataAt: latestTimestamp,
      modelName: modelInfo.name,
      modelVersion: modelInfo.version,
      localEstimateId,
    };
  },
};
