import { db, isConfigured } from './config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { MaterialLot, User, Offer, Transaction, MaterialPrice } from '../../types';

export const firestoreService = {
  /**
   * Saves or updates a user profile document in Firestore.
   */
  async saveUserDoc(user: User): Promise<void> {
    if (!isConfigured) return;
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      ...user,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  /**
   * Retrieves user profile from Firestore.
   */
  async getUserDoc(id: string): Promise<User | null> {
    if (!isConfigured) return null;
    const userRef = doc(db, 'users', id);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return snap.data() as User;
  },

  /**
   * Creates or updates a MaterialLot in Firestore.
   * Returns remote document ID.
   */
  async saveLotDoc(lot: MaterialLot): Promise<string> {
    if (!isConfigured) {
      // Return existing remoteId or fallback remote ID
      return lot.remoteId || `REMOTE-${lot.localId}`;
    }

    const payload = {
      ...lot,
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };

    if (lot.remoteId) {
      const lotRef = doc(db, 'lots', lot.remoteId);
      await setDoc(lotRef, payload, { merge: true });
      return lot.remoteId;
    } else {
      const collRef = collection(db, 'lots');
      const docRef = await addDoc(collRef, payload);
      return docRef.id;
    }
  },

  /**
   * Fetches lots for a specific collector from Firestore.
   */
  async getLotsByCollector(collectorId: string): Promise<MaterialLot[]> {
    if (!isConfigured) return [];
    const q = query(
      collection(db, 'lots'),
      where('collectorId', '==', collectorId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      ...d.data(),
      id: d.id,
      remoteId: d.id,
      localId: d.data().localId || d.id,
    } as MaterialLot));
  },

  /**
   * Fetches available lots for recyclers from Firestore.
   */
  async getAvailableLots(): Promise<MaterialLot[]> {
    if (!isConfigured) return [];
    const q = query(
      collection(db, 'lots'),
      where('status', 'in', ['created', 'ready', 'published', 'matching', 'offered', 'offer_received']),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      ...d.data(),
      id: d.id,
      remoteId: d.id,
      localId: d.data().localId || d.id,
    } as MaterialLot));
  },

  /**
   * Retrieves all registered recyclers from Firestore.
   */
  async getAllRecyclers(): Promise<any[]> {
    if (!isConfigured) return [];
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'recycler')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      ...d.data(),
      id: d.id,
    }));
  },

  /**
   * Creates or updates an Offer in Firestore.
   */
  async saveOfferDoc(offer: Offer): Promise<string> {
    if (!isConfigured) {
      return offer.remoteId || `REMOTE-${offer.id || offer.localId}`;
    }

    const payload = {
      ...offer,
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };

    if (offer.remoteId) {
      const offerRef = doc(db, 'offers', offer.remoteId);
      await setDoc(offerRef, payload, { merge: true });
      return offer.remoteId;
    } else {
      const collRef = collection(db, 'offers');
      const docRef = await addDoc(collRef, payload);
      return docRef.id;
    }
  },

  /**
   * Gets offers for a specific lot from Firestore.
   */
  async getOffersForLot(lotId: string): Promise<Offer[]> {
    if (!isConfigured) return [];
    const q = query(
      collection(db, 'offers'),
      where('lotId', '==', lotId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      ...d.data(),
      id: d.id,
      remoteId: d.id,
    } as Offer));
  },

  /**
   * Creates or updates a Deal in Firestore.
   */
  async saveDealDoc(deal: any): Promise<string> {
    if (!isConfigured) {
      return deal.remoteId || `REMOTE-${deal.id || deal.localId}`;
    }

    const payload = {
      ...deal,
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };

    if (deal.remoteId) {
      const dealRef = doc(db, 'deals', deal.remoteId);
      await setDoc(dealRef, payload, { merge: true });
      return deal.remoteId;
    } else {
      const collRef = collection(db, 'deals');
      const docRef = await addDoc(collRef, payload);
      return docRef.id;
    }
  },

  /**
   * Gets deals for a user from Firestore.
   */
  async getDealsForUser(userId: string, role: 'collector' | 'recycler'): Promise<any[]> {
    if (!isConfigured) return [];
    const fieldName = role === 'collector' ? 'collectorId' : 'recyclerId';
    const q = query(
      collection(db, 'deals'),
      where(fieldName, '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      ...d.data(),
      id: d.id,
      remoteId: d.id,
    }));
  },

  /**
   * Creates or updates a Handover in Firestore.
   */
  async saveHandoverDoc(handover: any): Promise<string> {
    if (!isConfigured) {
      return handover.remoteId || `REMOTE-${handover.id || handover.localId}`;
    }

    const payload = {
      ...handover,
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };

    if (handover.remoteId) {
      const hoRef = doc(db, 'handovers', handover.remoteId);
      await setDoc(hoRef, payload, { merge: true });
      return handover.remoteId;
    } else {
      const collRef = collection(db, 'handovers');
      const docRef = await addDoc(collRef, payload);
      return docRef.id;
    }
  },

  /**
   * Gets handover for a specific deal from Firestore.
   */
  async getHandoverForDeal(dealId: string): Promise<any | null> {
    if (!isConfigured) return null;
    const q = query(
      collection(db, 'handovers'),
      where('dealId', '==', dealId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return {
      ...snap.docs[0].data(),
      id: snap.docs[0].id,
      remoteId: snap.docs[0].id,
    };
  },

  /**
   * Creates or updates a Transaction in Firestore.
   */
  async saveTransactionDoc(tx: Transaction): Promise<string> {
    if (!isConfigured) {
      return tx.remoteId || `REMOTE-${tx.id || tx.localId}`;
    }

    const payload = {
      ...tx,
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };

    if (tx.remoteId) {
      const txRef = doc(db, 'transactions', tx.remoteId);
      await setDoc(txRef, payload, { merge: true });
      return tx.remoteId;
    } else {
      const collRef = collection(db, 'transactions');
      const docRef = await addDoc(collRef, payload);
      return docRef.id;
    }
  },

  /**
   * Gets transactions for a user from Firestore.
   */
  async getTransactionsForUser(userId: string, role: 'collector' | 'recycler'): Promise<Transaction[]> {
    if (!isConfigured) return [];
    const fieldName = role === 'collector' ? 'collectorId' : 'recyclerId';
    const q = query(
      collection(db, 'transactions'),
      where(fieldName, '==', userId),
      orderBy('date', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      ...d.data(),
      id: d.id,
      remoteId: d.id,
    } as Transaction));
  },

  /**
   * Saves or updates a MaterialPrice document in Firestore.
   */
  async savePriceDoc(price: MaterialPrice): Promise<string> {
    if (!isConfigured) {
      return price.remoteId || `REMOTE-${price.id || price.localId}`;
    }

    const payload = {
      ...price,
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };

    const priceId = price.remoteId || price.localId;
    const priceRef = doc(db, 'materialPrices', priceId);
    await setDoc(priceRef, payload, { merge: true });
    return priceId;
  },

  /**
   * Retrieves all active material prices from Firestore.
   */
  async getAllPriceDocs(): Promise<MaterialPrice[]> {
    if (!isConfigured) return [];
    try {
      const q = query(collection(db, 'materialPrices'), orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        remoteId: d.id,
      })) as MaterialPrice[];
    } catch (e) {
      console.warn('[Firestore] Failed to get price docs:', e);
      return [];
    }
  },

  /**
   * Saves or updates an AIPrediction document in Firestore.
   */
  async saveAIPredictionDoc(prediction: any): Promise<string> {
    if (!isConfigured) {
      return prediction.remoteId || `REMOTE-${prediction.localId}`;
    }

    const payload = {
      ...prediction,
      syncStatus: 'synced',
    };

    const docId = prediction.remoteId || prediction.localId;
    const docRef = doc(db, 'aiPredictions', docId);
    await setDoc(docRef, payload, { merge: true });
    return docId;
  },

  /**
   * Saves or updates an AIPriceEstimate document in Firestore.
   */
  async saveAIPriceEstimateDoc(estimate: any): Promise<string> {
    if (!isConfigured) {
      return estimate.remoteId || `REMOTE-${estimate.localId}`;
    }

    const payload = {
      ...estimate,
      syncStatus: 'synced',
    };

    const docId = estimate.remoteId || estimate.localId;
    const docRef = doc(db, 'aiPriceEstimates', docId);
    await setDoc(docRef, payload, { merge: true });
    return docId;
  },

  /**
   * Saves or updates an AIAnomalyEvent document in Firestore.
   */
  async saveAIAnomalyEventDoc(event: any): Promise<string> {
    if (!isConfigured) {
      return event.remoteId || `REMOTE-${event.localId}`;
    }

    const payload = {
      ...event,
      syncStatus: 'synced',
    };

    const docId = event.remoteId || event.localId;
    const docRef = doc(db, 'anomalyEvents', docId);
    await setDoc(docRef, payload, { merge: true });
    return docId;
  },
};
