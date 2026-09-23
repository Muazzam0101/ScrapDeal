import { RecyclerProfile, MaterialLot } from '../../types';
import { userRepository } from '../sqlite/repositories/userRepository';
import { firestoreService } from '../firebase/firestore';
import { networkService } from '../connectivity/networkService';

export interface MatchingResult {
  recycler: RecyclerProfile;
  matchScore: number;
  matchReasons: string[];
}

export const matchingService = {
  /**
   * Rule-based recycler discovery for a given material lot.
   * Matches on:
   * 1. Material compatibility (accepted materials)
   * 2. Service area / city
   * 3. Recycler active verification status
   *
   * STRICT: Never fabricates fake recyclers. If no real recyclers match, returns empty array [].
   */
  async findSuitableRecyclers(lot: MaterialLot): Promise<MatchingResult[]> {
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
      const matchReasons: string[] = [];
      let score = 0;

      // Rule 1: Material Compatibility
      // Check if recycler explicitly accepts this lot's material category
      const acceptedMaterials = recycler.acceptedMaterials || [];
      const lotCategory = lot.categoryId?.toLowerCase() || '';

      const acceptsCategory = acceptedMaterials.length === 0 || acceptedMaterials.some((mat) => {
        const m = mat.toLowerCase();
        return m === lotCategory || m.includes(lotCategory) || lotCategory.includes(m);
      });

      if (!acceptsCategory) {
        // Incompatible material — cannot match
        continue;
      }

      score += 50;
      matchReasons.push('सामग्री अनुकूल (Material Compatible)');

      // Rule 2: Service Area / City Compatibility
      const lotCity = lot.locationCity?.trim().toLowerCase();
      const recyclerCity = (recycler.city || recycler.serviceArea)?.trim().toLowerCase();

      if (lotCity && recyclerCity) {
        if (lotCity === recyclerCity || lotCity.includes(recyclerCity) || recyclerCity.includes(lotCity)) {
          score += 30;
          matchReasons.push('समान सेवा क्षेत्र (Service Area Matched)');
        }
      } else {
        // No specific restriction specified
        score += 10;
      }

      // Rule 3: Verification & Availability
      if (recycler.isVerified || recycler.verificationStatus === 'verified') {
        score += 20;
        matchReasons.push('सत्यापित रीसाइक्लर (Verified Recycler)');
      }

      matches.push({
        recycler,
        matchScore: score,
        matchReasons,
      });
    }

    // Sort by match score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches;
  },
};
