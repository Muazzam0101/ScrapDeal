/**
 * AI/ML Model Registry for ScrapDeal
 *
 * Tracks registered model versions, metadata, and decision thresholds.
 * All inferences must reference an active model version from this registry.
 */

export interface ModelMetadata {
  name: string;
  version: string;
  architecture: string;
  description: string;
  targetDevice: 'mobile_on_device' | 'server' | 'hybrid';
  thresholds: Record<string, number>;
  createdAt: string;
}

export const MODEL_REGISTRY = {
  materialClassification: {
    name: 'material-mobilenet',
    version: 'v1.0.0',
    architecture: 'MobileNetV3-Lite / Softmax',
    description: 'Scrap photo material classification mapping to ScrapDeal taxonomy',
    targetDevice: 'mobile_on_device',
    thresholds: {
      minConfidenceThreshold: 0.65, // Below this, prompts user for manual confirmation
      minAlternativeThreshold: 0.10, // Threshold to include as a secondary suggestion
    },
    createdAt: '2026-09-01T00:00:00Z',
  } as ModelMetadata,

  priceEstimation: {
    name: 'price-xgboost',
    version: 'v1.0.0',
    architecture: 'XGBoost / Empirical Quantile Estimator',
    description: 'Fair scrap price regression based on active recycler rates and completed transactions',
    targetDevice: 'hybrid',
    thresholds: {
      minDataPointsThreshold: 2, // Minimum historical observations required to produce an estimate
      maxVarianceRatio: 3.0, // High variance reduces confidence score
    },
    createdAt: '2026-09-01T00:00:00Z',
  } as ModelMetadata,

  anomalyDetection: {
    name: 'anomaly-iforest',
    version: 'v1.0.0',
    architecture: 'Isolation Forest / Multi-Variable Dispersion',
    description: 'Advisory transaction and lot pattern anomaly detector',
    targetDevice: 'hybrid',
    thresholds: {
      anomalyScoreThreshold: 0.70, // 0.70+ flags transaction for advisory review
      extremeWeightKg: 2500, // Unusual kabadiwala single lot weight
      maxZScore: 2.5, // Standard deviations from material mean rate
    },
    createdAt: '2026-09-01T00:00:00Z',
  } as ModelMetadata,
};
