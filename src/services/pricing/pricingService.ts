import { MaterialPrice, MaterialCategoryId, PriceBoardItem, Transaction } from '../../types';
import { priceRepository } from '../sqlite/repositories/priceRepository';
import { syncQueueRepository } from '../sqlite/repositories/syncQueueRepository';
import { syncEngine } from '../sync/syncEngine';
import { networkService } from '../connectivity/networkService';
import { MATERIAL_CATEGORIES } from '../../constants/materialCategories';

export const pricingService = {
  /**
   * Adds or updates a recycler's purchasing rate for a material category.
   * Persists to SQLite first, queues sync mutation, pushes to Firestore if online.
   */
  async setRecyclerRate(params: {
    recyclerId: string;
    recyclerName?: string;
    materialCategory: MaterialCategoryId;
    ratePerKg: number;
    minRatePerKg?: number;
    maxRatePerKg?: number;
    locationCity?: string;
    locationArea?: string;
  }): Promise<MaterialPrice> {
    if (params.ratePerKg <= 0) {
      throw new Error('दर 0 से अधिक होनी चाहिए (Rate must be greater than 0)');
    }

    const now = new Date().toISOString();
    // Unique deterministic localId per recycler & material
    const localId = `RATE-${params.recyclerId}-${params.materialCategory}`;

    const materialConfig = MATERIAL_CATEGORIES.find((m) => m.id === params.materialCategory);

    const priceRecord: MaterialPrice = {
      id: localId,
      localId,
      materialCategory: params.materialCategory,
      materialName: materialConfig?.labelEn || params.materialCategory.toUpperCase(),
      recyclerId: params.recyclerId,
      recyclerName: params.recyclerName,
      ratePerKg: params.ratePerKg,
      minRatePerKg: params.minRatePerKg,
      maxRatePerKg: params.maxRatePerKg,
      effectiveFrom: now,
      locationCity: params.locationCity,
      locationArea: params.locationArea,
      sourceType: 'recycler_rate',
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // 1. Save locally to SQLite
    await priceRepository.createPrice(priceRecord);

    // 2. Enqueue sync mutation
    await syncQueueRepository.enqueueOperation({
      entityType: 'material_price',
      localId,
      operationType: 'CREATE',
      payload: priceRecord,
    });

    // 3. Trigger immediate sync if connected
    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[PricingService] Sync error on rate set:', e));
    }

    return priceRecord;
  },

  /**
   * Retrieves all rates offered by a specific recycler.
   */
  async getRecyclerRates(recyclerId: string): Promise<MaterialPrice[]> {
    return priceRepository.getPricesByRecycler(recyclerId);
  },

  /**
   * Compiles the Price Board for Collectors and Recyclers based on real observed rates.
   * STRICT ZERO MOCK DATA: Categories without real rates display undefined/empty.
   */
  async getPriceBoardItems(): Promise<PriceBoardItem[]> {
    const allPrices = await priceRepository.getAllPrices();
    const isOnline = networkService.isOnline();
    const now = Date.now();

    return MATERIAL_CATEGORIES.map((cat) => {
      const catPrices = allPrices.filter(
        (p) => p.materialCategory === cat.id && p.ratePerKg > 0
      );

      if (catPrices.length === 0) {
        return {
          category: cat.id,
          categoryLabel: cat.labelEn,
          iconName: cat.iconName,
          color: cat.color,
          activeRecyclersCount: 0,
        };
      }

      // Sort by newest
      catPrices.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      const latest = catPrices[0];
      const rates = catPrices.map((p) => p.ratePerKg);
      const minRate = Math.min(...rates);
      const maxRate = Math.max(...rates);

      // Unique active recyclers offering this category
      const uniqueRecyclers = new Set(catPrices.map((p) => p.recyclerId).filter(Boolean));

      // Calculate staleness: offline or updated > 24 hours ago
      const updatedTime = new Date(latest.updatedAt).getTime();
      const hoursOld = (now - updatedTime) / (1000 * 60 * 60);
      const isStale = !isOnline || hoursOld > 24;

      return {
        category: cat.id,
        categoryLabel: cat.labelEn,
        iconName: cat.iconName,
        color: cat.color,
        latestRatePerKg: latest.ratePerKg,
        minObservedRate: minRate,
        maxObservedRate: maxRate,
        activeRecyclersCount: uniqueRecyclers.size,
        lastUpdated: latest.updatedAt,
        isStale,
        sourceType: latest.sourceType,
      };
    });
  },

  /**
   * Records completed transaction rate to build authentic price discovery data.
   */
  async recordTransactionPrice(tx: Transaction): Promise<void> {
    const now = new Date().toISOString();
    const localId = `TX-PRICE-${tx.localId}`;

    const priceRecord: MaterialPrice = {
      id: localId,
      localId,
      materialCategory: tx.materialName?.toLowerCase() as MaterialCategoryId,
      materialName: tx.materialName,
      recyclerId: tx.recyclerId,
      ratePerKg: tx.agreedPrice ?? tx.ratePerKg ?? 0,
      effectiveFrom: tx.completedAt || tx.date || now,
      sourceType: 'completed_transaction',
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await priceRepository.createPrice(priceRecord);
  },
};
