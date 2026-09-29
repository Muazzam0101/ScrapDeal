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

  /**
   * Saves or updates a Payment in Firestore.
   */
  async savePaymentDoc(payment: any): Promise<string> {
    if (!isConfigured) {
      return payment.remoteId || `REMOTE-${payment.paymentId || payment.id}`;
    }

    const payload = {
      ...payment,
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };

    const paymentId = payment.remoteId || payment.paymentId || payment.id;
    const paymentRef = doc(db, 'payments', paymentId);
    await setDoc(paymentRef, payload, { merge: true });
    return paymentId;
  },

  /**
   * Gets payments for a user from Firestore.
   */
  async getPaymentsForUser(userId: string, role: 'collector' | 'recycler'): Promise<any[]> {
    if (!isConfigured) return [];
    const fieldName = role === 'collector' ? 'collectorId' : 'recyclerId';
    const q = query(
      collection(db, 'payments'),
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
   * Saves or updates a Notification in Firestore.
   */
  async saveNotificationDoc(notification: any): Promise<string> {
    if (!isConfigured) {
      return notification.remoteId || `REMOTE-${notification.notificationId || notification.id}`;
    }

    const payload = {
      ...notification,
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };

    const notifId = notification.remoteId || notification.notificationId || notification.id;
    const notifRef = doc(db, 'notifications', notifId);
    await setDoc(notifRef, payload, { merge: true });
    return notifId;
  },

  /**
   * Gets notifications for a user from Firestore.
   */
  async getNotificationsForUser(userId: string): Promise<any[]> {
    if (!isConfigured) return [];
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
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
   * Saves or updates a DeviceToken document in Firestore.
   */
  async saveDeviceTokenDoc(token: any): Promise<void> {
    if (!isConfigured) return;
    const tokenRef = doc(db, 'deviceTokens', token.id);
    await setDoc(tokenRef, {
      ...token,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  /**
   * Saves or updates a Traceability document in Firestore.
   */
  async saveTraceabilityDoc(record: any): Promise<string> {
    if (!isConfigured) return record.traceabilityId;
    const recId = record.traceabilityId;
    const recRef = doc(db, 'traceabilityRecords', recId);
    await setDoc(recRef, {
      ...record,
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    }, { merge: true });
    return recId;
  },

  /**
   * Retrieves a Traceability document from Firestore.
   */
  async getTraceabilityDoc(traceabilityId: string): Promise<any | null> {
    if (!isConfigured) return null;
    const recRef = doc(db, 'traceabilityRecords', traceabilityId);
    const snap = await getDoc(recRef);
    if (!snap.exists()) return null;
    return snap.data();
  },

  /**
   * Appends an immutable Traceability Event in Firestore.
   */
  async saveTraceabilityEventDoc(event: any): Promise<string> {
    if (!isConfigured) return event.eventId;
    const evtId = event.eventId;
    const evtRef = doc(db, 'traceabilityEvents', evtId);
    await setDoc(evtRef, {
      ...event,
      syncStatus: 'synced',
    });
    return evtId;
  },

  /**
   * Saves a Handover Confirmation in Firestore.
   */
  async saveHandoverConfirmationDoc(confirmation: any): Promise<string> {
    if (!isConfigured) return confirmation.confirmationId;
    const confId = confirmation.confirmationId;
    const confRef = doc(db, 'handoverConfirmations', confId);
    await setDoc(confRef, {
      ...confirmation,
      syncStatus: 'synced',
    });
    return confId;
  },

  /**
   * Saves Handover Photo metadata in Firestore.
   */
  async saveHandoverPhotoDoc(photo: any): Promise<string> {
    if (!isConfigured) return photo.photoId;
    const pId = photo.photoId;
    const pRef = doc(db, 'handoverPhotos', pId);
    await setDoc(pRef, {
      ...photo,
      syncStatus: 'synced',
    });
    return pId;
  },
};

