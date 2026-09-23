import { RecyclerProfile, MaterialLot } from '../../types';
import { userRepository } from '../sqlite/repositories/userRepository';
import { firestoreService } from '../firebase/firestore';
import { networkService } from '../connectivity/networkService';
import { locationService } from '../location/locationService';

export interface MatchingResult {
  recycler: RecyclerProfile;
  matchScore: number;
  matchReasons: string[];
  distanceKm?: number;
  distanceText?: string;
  isWithinServiceArea: boolean;
}

export const matchingService = {
  /**
   * Rule-based recycler discovery for a given material lot.
   * Matches transparently on:
   * 1. Material compatibility (accepted materials catalog check)
   * 2. Active availability (isAvailable !== false)
   * 3. Distance calculation & Service radius boundary (serviceRadiusKm)
   * 4. Pickup preference compatibility (pickupAvailable)
   * 5. Verification status (Identity Verified, Authorization Verified)
   *
   * STRICT ZERO MOCK DATA: Never fabricates fake recyclers or fake distances.
   */
  async findSuitableRecyclers(
    lot: MaterialLot,
    collectorCoords?: { latitude: number; longitude: number } | null
  ): Promise<MatchingResult[]> {
    let recyclers: RecyclerProfile[] = [];

    try {
      // 1. If online, fetch registered recyclers from Firestore and cache locally
      if (networkService.isOnline()) {
        try {
          const remoteRecyclers = await firestoreService.getAllRecyclers();
          for (const r of remoteRecyclers) {
            await userRepository.saveUser(r);
          }
        } catch (remoteErr) {
          console.warn('[MatchingService] Remote fetch failed, falling back to local SQLite:', remoteErr);
        }
      }

      // 2. Fetch all real registered recyclers from SQLite cache
      recyclers = await userRepository.getAllRecyclers();
    } catch (e) {
      console.warn('[MatchingService] Error retrieving recyclers:', e);
      recyclers = [];
    }

    if (!recyclers || recyclers.length === 0) {
      return [];
    }

    const matches: MatchingResult[] = [];

    for (const recycler of recyclers) {
      // Filter 0: Active status check
      if (recycler.isAvailable === false) {
        continue;
      }

      const matchReasons: string[] = [];
      let score = 0;

      // Rule 1: Material Compatibility
      // Check if recycler explicitly accepts this lot's material category
      const acceptedMaterials = recycler.acceptedMaterials || [];
      const lotCategory = lot.categoryId?.toLowerCase() || '';

      const acceptsCategory =
        acceptedMaterials.length === 0 ||
        acceptedMaterials.some((mat) => {
          const m = mat.toLowerCase();
          return m === lotCategory || m.includes(lotCategory) || lotCategory.includes(m);
        });

      if (!acceptsCategory) {
        // Incompatible material — cannot match
        continue;
      }

      score += 40;
      matchReasons.push(`सामग्री अनुकूल (Accepts ${lot.categoryId?.toUpperCase() || 'Scrap'})`);

      // Rule 2: Distance & Service Area Boundary
      let distanceKm: number | undefined;
      let distanceText: string | undefined;
      let isWithinServiceArea = true;
      const serviceRadius = recycler.serviceRadiusKm || 25;

      if (
        collectorCoords &&
        recycler.latitude !== undefined &&
        recycler.longitude !== undefined &&
        recycler.latitude !== null &&
        recycler.longitude !== null
      ) {
        distanceKm = locationService.calculateDistanceKm(collectorCoords, {
          latitude: recycler.latitude,
          longitude: recycler.longitude,
        });
        distanceText = locationService.formatDistance(distanceKm);

        if (distanceKm > serviceRadius) {
          // Out of recycler's defined service radius boundary
          continue;
        }

        score += Math.max(0, 30 - Math.round(distanceKm));
        matchReasons.push(`सेवा क्षेत्र के भीतर: ${distanceText} (${serviceRadius} km त्रिज्या)`);
      } else {
        // Fallback to City / Area String Matching if coordinates are unavailable
        const lotCity = lot.locationCity?.trim().toLowerCase();
        const recyclerCity = (recycler.city || recycler.serviceArea)?.trim().toLowerCase();

        if (lotCity && recyclerCity) {
          if (lotCity === recyclerCity || lotCity.includes(recyclerCity) || recyclerCity.includes(lotCity)) {
            score += 20;
            matchReasons.push(`सेवा क्षेत्र अनुकूल (${recycler.city || 'समान शहर'})`);
          } else {
            isWithinServiceArea = false;
          }
        } else {
          score += 10;
        }
      }

      // Rule 3: Pickup Compatibility
      if (lot.pickupOption === 'recycler_pickup') {
        if (recycler.pickupAvailable !== false) {
          score += 15;
          matchReasons.push('रीसाइक्लर पिकअप उपलब्ध (Pickup Available)');
        }
      } else {
        score += 10;
      }

      // Rule 4: Verification Badges
      if (recycler.authorizationVerificationStatus === 'verified') {
        score += 20;
        matchReasons.push('व्यावसायिक अधिकृत (Authorization Verified)');
      }
      if (recycler.identityVerificationStatus === 'verified') {
        score += 10;
        matchReasons.push('पहचान सत्यापित (Identity Verified)');
      }

      matches.push({
        recycler,
        matchScore: score,
        matchReasons,
        distanceKm,
        distanceText,
        isWithinServiceArea,
      });
    }

    // Sort transparently by match score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches;
  },
};
