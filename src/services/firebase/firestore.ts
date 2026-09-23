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
import { MaterialLot, User, Offer, Transaction } from '../../types';

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
      where('status', 'in', ['created', 'ready', 'matching', 'offered']),
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
};
