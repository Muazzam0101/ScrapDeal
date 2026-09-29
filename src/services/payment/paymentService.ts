import {
  Payment,
  PaymentMethod,
  PaymentStatus,
  Transaction,
  TransactionReceipt,
  Deal,
} from '../../types';
import { paymentRepository } from '../sqlite/repositories/paymentRepository';
import { transactionRepository } from '../sqlite/repositories/transactionRepository';
import { dealRepository } from '../sqlite/repositories/dealRepository';
import { handoverRepository } from '../sqlite/repositories/handoverRepository';
import { lotRepository } from '../sqlite/repositories/lotRepository';
import { userRepository } from '../sqlite/repositories/userRepository';
import { syncQueueRepository } from '../sqlite/repositories/syncQueueRepository';
import { networkService } from '../connectivity/networkService';
import { syncEngine } from '../sync/syncEngine';
import { upiPaymentProvider } from './paymentProvider';
import { notificationService } from '../notification/notificationService';

class PaymentService {
  /**
   * Initiates a payment for a deal with idempotency and duplicate payment protection.
   * Prevents duplicate payments for the same deal.
   */
  async initiatePayment(params: {
    dealId: string;
    method: PaymentMethod;
    actorId: string;
    actorRole: 'collector' | 'recycler';
  }): Promise<Payment> {
    const { dealId, method, actorId, actorRole } = params;

    // 1. Fetch deal and verify validity
    const deal = await dealRepository.getDealById(dealId);
    if (!deal) {
      throw new Error('सौदा नहीं मिला (Deal not found)');
    }

    // Authorization check
    if (deal.collectorId !== actorId && deal.recyclerId !== actorId) {
      throw new Error('इस भुगतान के लिए अनधिकृत पहुंच (Unauthorized access to deal payment)');
    }

    // 2. Fetch and verify handover completion
    const handover = await handoverRepository.getHandoverByDealId(dealId);
    if (!handover || (!handover.collectorConfirmed && !handover.recyclerConfirmed && handover.status !== 'completed')) {
      throw new Error('भुगतान से पहले हैंडओवर पुष्टि आवश्यक है (Handover confirmation required before payment)');
    }

    // 3. Duplicate payment protection check
    const existingPayment = await paymentRepository.getPaymentByDealId(dealId);
    if (existingPayment) {
      if (existingPayment.status === 'completed') {
        throw new Error('इस सौदे का भुगतान पहले ही पूरा हो चुका है (Payment for this deal is already completed)');
      }

      // If active and method matches, return existing payment (idempotent)
      if (existingPayment.method === method && (existingPayment.status === 'initiated' || existingPayment.status === 'processing')) {
        return existingPayment;
      }
    }

    // 4. Exact amount calculation strictly from deal & handover weight
    const finalWeight = handover.actualWeightKg || deal.agreedWeightKg;
    const agreedPrice = deal.agreedRatePerKg;
    const paymentAmount = Math.round(finalWeight * agreedPrice);

    // 5. UPI-specific validations
    if (method === 'upi') {
      if (!networkService.isOnline()) {
        throw new Error('इंटरनेट कनेक्शन आवश्यक है (Internet connection required to verify UPI payment.)');
      }
      if (!upiPaymentProvider.isConfigured()) {
        throw new Error('UPI payment is not configured yet. Live gateway credentials or UPI VPA are required.');
      }
    }

    const now = new Date().toISOString();
    const paymentId = existingPayment ? existingPayment.paymentId : `PAY-${Date.now()}`;

    // Find linked transaction if already initialized
    let linkedTx = await transactionRepository.getTransactionByDealId(dealId);

    const payment: Payment = {
      paymentId,
      id: paymentId,
      dealId: deal.localId || deal.id,
      transactionId: linkedTx?.localId || linkedTx?.id,
      lotId: deal.lotId,
      collectorId: deal.collectorId,
      recyclerId: deal.recyclerId,
      amount: paymentAmount,
      currency: 'INR',
      method,
      status: 'initiated',
      initiatedAt: now,
      cashPaidConfirmedByRecycler: false,
      cashReceivedConfirmedByCollector: false,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };

    if (existingPayment) {
      await paymentRepository.updatePaymentStatus(paymentId, 'initiated');
    } else {
      await paymentRepository.createPayment(payment);
    }

    // Queue sync operation
    await syncQueueRepository.enqueueOperation({
      entityType: 'payment',
      localId: paymentId,
      operationType: existingPayment ? 'UPDATE' : 'CREATE',
      payload: payment,
    });

    // Notify collector about payment initiation
    if (actorRole === 'recycler') {
      await notificationService.sendNotification({
        userId: deal.collectorId,
        type: 'payment_pending',
        title: 'भुगतान प्रक्रिया शुरू (Payment Initiated)',
        body: `₹${paymentAmount} का भुगतान ${method === 'cash' ? 'नकद (Cash)' : 'UPI'} द्वारा प्रारंभ किया गया है।`,
        entityType: 'payment',
        entityId: paymentId,
      });
    }

    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[PaymentService] Sync error on payment initiate:', e));
    }

    return payment;
  }

  /**
   * Recycler confirms Cash Paid.
   * State moves to 'processing' awaiting collector receipt.
   */
  async confirmRecyclerCashPaid(paymentId: string, recyclerId: string): Promise<Payment> {
    const payment = await paymentRepository.getPaymentById(paymentId);
    if (!payment) {
      throw new Error('भुगतान रिकॉर्ड नहीं मिला (Payment record not found)');
    }

    if (payment.recyclerId !== recyclerId) {
      throw new Error('अनधिकृत कार्रवाई (Unauthorized action)');
    }

    if (payment.status === 'completed') {
      return payment; // Already completed
    }

    const now = new Date().toISOString();

    await paymentRepository.updatePaymentStatus(paymentId, 'processing', {
      cashPaidConfirmedByRecycler: true,
      cashPaidConfirmedAt: now,
    });

    const updatedPayment = (await paymentRepository.getPaymentById(paymentId))!;

    // Enqueue sync operation
    await syncQueueRepository.enqueueOperation({
      entityType: 'payment',
      localId: paymentId,
      operationType: 'UPDATE',
      payload: updatedPayment,
    });

    // Send notification to Collector: "Cash Received?"
    await notificationService.sendNotification({
      userId: payment.collectorId,
      type: 'payment_pending',
      title: 'नकद भुगतान की पुष्टि करें (Cash Received?)',
      body: `रीसाइक्लर ने ₹${payment.amount} नकद भुगतान की पुष्टि की है। कृपया प्राप्ति की पुष्टि करें।`,
      entityType: 'payment',
      entityId: paymentId,
    });

    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[PaymentService] Sync error on recycler cash confirm:', e));
    }

    return updatedPayment;
  }

  /**
   * Collector confirms Cash Received.
   * Once both Recycler and Collector confirm:
   * Payment = Completed
   * Transaction = Completed
   */
  async confirmCollectorCashReceived(
    paymentId: string,
    collectorId: string
  ): Promise<{ payment: Payment; transaction: Transaction; receipt: TransactionReceipt }> {
    const payment = await paymentRepository.getPaymentById(paymentId);
    if (!payment) {
      throw new Error('भुगतान रिकॉर्ड नहीं मिला (Payment record not found)');
    }

    if (payment.collectorId !== collectorId) {
      throw new Error('अनधिकृत कार्रवाई (Unauthorized action)');
    }

    if (!payment.cashPaidConfirmedByRecycler) {
      throw new Error('रीसाइक्लर द्वारा नकद भुगतान की पुष्टि की प्रतीक्षा है (Awaiting recycler cash payment confirmation)');
    }

    const now = new Date().toISOString();

    // 1. Mark Payment as completed
    await paymentRepository.updatePaymentStatus(paymentId, 'completed', {
      completedAt: now,
      cashReceivedConfirmedByCollector: true,
      cashReceivedConfirmedAt: now,
    });

    const completedPayment = (await paymentRepository.getPaymentById(paymentId))!;

    // 2. Fetch or create Transaction and settle as COMPLETED
    let tx = await transactionRepository.getTransactionByDealId(completedPayment.dealId);
    const deal = (await dealRepository.getDealById(completedPayment.dealId))!;
    const handover = await handoverRepository.getHandoverByDealId(completedPayment.dealId);

    const finalWeight = handover?.actualWeightKg || deal.agreedWeightKg;
    const agreedPrice = deal.agreedRatePerKg;
    const totalAmount = completedPayment.amount;

    let txKey = '';
    if (!tx) {
      const txId = `TX-${Date.now()}`;
      tx = await transactionRepository.createTransaction({
        transactionId: txId,
        id: txId,
        localId: txId,
        transactionNumber: `TRX-${Date.now().toString().slice(-6)}`,
        dealId: deal.localId || deal.id,
        lotId: deal.lotId,
        collectorId: deal.collectorId,
        recyclerId: deal.recyclerId,
        materialCategory: deal.materialCategoryId || 'mixed',
        materialName: deal.materialName || 'Scrap Material',
        finalWeight,
        weightKg: finalWeight,
        agreedPrice,
        ratePerKg: agreedPrice,
        totalAmount,
        paymentId,
        paymentMethod: 'cash',
        paymentStatus: 'completed',
        handoverStatus: 'completed',
        transactionStatus: 'completed',
        completedAt: now,
        date: now,
        syncStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      });
      txKey = txId;
    } else {
      txKey = tx.localId || tx.id || tx.transactionId || '';
      await transactionRepository.updateTransactionSettlement(
        txKey,
        'completed',
        'completed',
        paymentId,
        now
      );
      tx = (await transactionRepository.getTransactionById(txKey))!;
    }

    // 3. Complete Deal and Lot
    await dealRepository.updateDealStatus(deal.localId || deal.id, 'completed');
    await lotRepository.updateLot({
      localId: deal.lotId,
      status: 'completed',
      weightKg: finalWeight,
      agreedTotalAmount: totalAmount,
      updatedAt: now,
    });

    // 4. Enqueue sync mutations for all updated records
    await syncQueueRepository.enqueueOperation({
      entityType: 'payment',
      localId: paymentId,
      operationType: 'UPDATE',
      payload: completedPayment,
    });

    await syncQueueRepository.enqueueOperation({
      entityType: 'transaction',
      localId: txKey,
      operationType: 'UPDATE',
      payload: tx,
    });

    await syncQueueRepository.enqueueOperation({
      entityType: 'deal',
      localId: deal.localId || deal.id,
      operationType: 'UPDATE',
      payload: { ...deal, status: 'completed', updatedAt: now },
    });

    await syncQueueRepository.enqueueOperation({
      entityType: 'material_lot',
      localId: deal.lotId,
      operationType: 'UPDATE',
      payload: { localId: deal.lotId, status: 'completed', updatedAt: now },
    });

    // 5. Send real notifications to both parties
    await notificationService.sendNotification({
      userId: deal.recyclerId,
      type: 'payment_completed',
      title: 'भुगतान सफल (Payment Completed)',
      body: `कलेक्टर ने ₹${totalAmount} नकद प्राप्ति की पुष्टि की है। लेनदेन पूरा हुआ।`,
      entityType: 'transaction',
      entityId: txKey,
    });

    await notificationService.sendNotification({
      userId: deal.collectorId,
      type: 'payment_completed',
      title: 'लेनदेन संपन्न (Transaction Completed)',
      body: `₹${totalAmount} का भुगतान प्राप्त हुआ और लेनदेन संपन्न हो गया।`,
      entityType: 'transaction',
      entityId: txKey,
    });

    if (networkService.isOnline()) {
      syncEngine.triggerSync().catch((e) => console.warn('[PaymentService] Sync error on collector cash confirm:', e));
    }

    // 6. Generate digital receipt
    const receipt = await this.generateReceipt(txKey);

    return { payment: completedPayment, transaction: tx, receipt };
  }

  /**
   * Online UPI Payment Verification.
   * Requires active internet connectivity and valid provider verification.
   * Strictly avoids fake success!
   */
  async verifyUpiPayment(
    paymentId: string,
    providerReference: string
  ): Promise<{ payment: Payment; transaction?: Transaction; receipt?: TransactionReceipt }> {
    if (!networkService.isOnline()) {
      throw new Error('इंटरनेट कनेक्शन आवश्यक है (Internet connection required to verify UPI payment.)');
    }

    const payment = await paymentRepository.getPaymentById(paymentId);
    if (!payment) {
      throw new Error('भुगतान रिकॉर्ड नहीं मिला (Payment record not found)');
    }

    // Call server-side/provider verification
    const verification = await upiPaymentProvider.verifyPayment(paymentId, providerReference);

    if (!verification.isVerified || verification.status !== 'completed') {
      await paymentRepository.updatePaymentStatus(paymentId, 'failed', {
        providerReference,
      });

      const failedPayment = (await paymentRepository.getPaymentById(paymentId))!;

      await notificationService.sendNotification({
        userId: payment.recyclerId,
        type: 'payment_failed',
        title: 'UPI भुगतान असफल (Payment Failed)',
        body: verification.errorMessage || 'UPI payment verification failed.',
        entityType: 'payment',
        entityId: paymentId,
      });

      return { payment: failedPayment };
    }

    // Payment strictly verified by provider:
    const now = new Date().toISOString();
    await paymentRepository.updatePaymentStatus(paymentId, 'completed', {
      completedAt: now,
      provider: 'upi_provider',
      providerReference: verification.providerReference || providerReference,
    });

    const completedPayment = (await paymentRepository.getPaymentById(paymentId))!;
    const deal = (await dealRepository.getDealById(completedPayment.dealId))!;
    const handover = await handoverRepository.getHandoverByDealId(completedPayment.dealId);

    const finalWeight = handover?.actualWeightKg || deal.agreedWeightKg;
    const agreedPrice = deal.agreedRatePerKg;
    const totalAmount = completedPayment.amount;

    let tx = await transactionRepository.getTransactionByDealId(completedPayment.dealId);
    let txKey = '';
    if (!tx) {
      const txId = `TX-${Date.now()}`;
      tx = await transactionRepository.createTransaction({
        transactionId: txId,
        id: txId,
        localId: txId,
        transactionNumber: `TRX-${Date.now().toString().slice(-6)}`,
        dealId: deal.localId || deal.id,
        lotId: deal.lotId,
        collectorId: deal.collectorId,
        recyclerId: deal.recyclerId,
        materialCategory: deal.materialCategoryId || 'mixed',
        materialName: deal.materialName || 'Scrap Material',
        finalWeight,
        weightKg: finalWeight,
        agreedPrice,
        ratePerKg: agreedPrice,
        totalAmount,
        paymentId,
        paymentMethod: 'upi',
        paymentStatus: 'completed',
        handoverStatus: 'completed',
        transactionStatus: 'completed',
        completedAt: now,
        date: now,
        syncStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      });
      txKey = txId;
    } else {
      txKey = tx.localId || tx.id || tx.transactionId || '';
      await transactionRepository.updateTransactionSettlement(
        txKey,
        'completed',
        'completed',
        paymentId,
        now
      );
      tx = (await transactionRepository.getTransactionById(txKey))!;
    }

    await dealRepository.updateDealStatus(deal.localId || deal.id, 'completed');
    await lotRepository.updateLot({
      localId: deal.lotId,
      status: 'completed',
      weightKg: finalWeight,
      agreedTotalAmount: totalAmount,
      updatedAt: now,
    });

    await syncQueueRepository.enqueueOperation({
      entityType: 'payment',
      localId: paymentId,
      operationType: 'UPDATE',
      payload: completedPayment,
    });

    await syncQueueRepository.enqueueOperation({
      entityType: 'transaction',
      localId: txKey,
      operationType: 'UPDATE',
      payload: tx,
    });

    await notificationService.sendNotification({
      userId: deal.collectorId,
      type: 'payment_completed',
      title: 'UPI भुगतान प्राप्त हुआ (UPI Payment Completed)',
      body: `₹${totalAmount} का UPI भुगतान प्राप्त हुआ।`,
      entityType: 'transaction',
      entityId: txKey,
    });

    await notificationService.sendNotification({
      userId: deal.recyclerId,
      type: 'payment_completed',
      title: 'UPI भुगतान सफल (UPI Payment Succeeded)',
      body: `₹${totalAmount} का भुगतान सफलतापूर्वक सत्यापित हुआ।`,
      entityType: 'transaction',
      entityId: txKey,
    });

    const receipt = await this.generateReceipt(txKey);

    return { payment: completedPayment, transaction: tx, receipt };
  }

  /**
   * Generates a digital transaction receipt from real transaction data.
   */
  async generateReceipt(transactionIdOrDealId: string): Promise<TransactionReceipt> {
    let tx = await transactionRepository.getTransactionById(transactionIdOrDealId);
    if (!tx) {
      tx = await transactionRepository.getTransactionByDealId(transactionIdOrDealId);
    }

    if (!tx) {
      throw new Error('लेनदेन रिकॉर्ड नहीं मिला (Transaction not found for receipt generation)');
    }

    const collector = await userRepository.getUserById(tx.collectorId);
    const recycler = await userRepository.getUserById(tx.recyclerId);
    const payment = tx.paymentId ? await paymentRepository.getPaymentById(tx.paymentId) : null;

    const collectorProfile = collector as any;
    const recyclerProfile = recycler as any;

    const receipt: TransactionReceipt = {
      receiptNumber: `RCPT-${tx.transactionNumber || tx.localId || tx.id}`,
      transactionId: tx.localId || tx.id || tx.transactionId || '',
      dealId: tx.dealId,
      lotId: tx.lotId,
      collectorId: tx.collectorId,
      collectorName: collectorProfile?.name || collectorProfile?.phoneNumber || 'Collector',
      recyclerId: tx.recyclerId,
      recyclerName: recyclerProfile?.businessName || recyclerProfile?.name || 'Recycler',
      materialCategory: tx.materialCategory,
      materialName: tx.materialName || tx.materialCategory,
      finalWeightKg: tx.finalWeight ?? tx.weightKg ?? 0,
      ratePerKg: tx.agreedPrice ?? tx.ratePerKg ?? 0,
      totalAmount: tx.totalAmount,
      currency: 'INR',
      paymentMethod: tx.paymentMethod,
      paymentStatus: tx.paymentStatus,
      providerReference: payment?.providerReference || undefined,
      completedAt: tx.completedAt || tx.date || new Date().toISOString(),
      issuedAt: new Date().toISOString(),
    };

    return receipt;
  }

  /**
   * Retrieves active payment for a deal.
   */
  async getPaymentForDeal(dealId: string): Promise<Payment | null> {
    return paymentRepository.getPaymentByDealId(dealId);
  }

  /**
   * Retrieves payment history for a user.
   */
  async getPaymentsForUser(userId: string, role: 'collector' | 'recycler'): Promise<Payment[]> {
    return paymentRepository.getPaymentsForUser(userId, role);
  }
}

export const paymentService = new PaymentService();
