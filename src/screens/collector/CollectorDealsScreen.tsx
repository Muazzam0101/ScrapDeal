import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthStore } from '../../store/useAuthStore';
import { useLotStore } from '../../store/useLotStore';
import { useDealStore } from '../../store/useDealStore';
import { useOfferStore } from '../../store/useOfferStore';
import { offerRepository } from '../../services/sqlite/repositories/offerRepository';
import { dealRepository } from '../../services/sqlite/repositories/dealRepository';
import { transactionRepository } from '../../services/sqlite/repositories/transactionRepository';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { LotCard } from '../../components/LotCard';
import { Offer, Deal, Transaction } from '../../types';

interface CollectorDealsScreenProps {
  navigation: any;
}

export const CollectorDealsScreen: React.FC<CollectorDealsScreenProps> = ({
  navigation,
}) => {
  const { t } = useLanguage();
  const { currentUser } = useAuthStore();
  const { collectorLots, fetchCollectorLots, isLoading, error } = useLotStore();
  const { acceptOffer } = useDealStore();
  const { rejectOffer } = useOfferStore();

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [lotOffers, setLotOffers] = useState<Record<string, Offer[]>>({});
  const [lotDeals, setLotDeals] = useState<Record<string, Deal>>({});
  const [completedTxs, setCompletedTxs] = useState<Transaction[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const collectorId = currentUser?.id || 'COLLECTOR-LOCAL';

  const loadData = async () => {
    await fetchCollectorLots(collectorId);

    // Load offers and deals for each lot
    const offersMap: Record<string, Offer[]> = {};
    const dealsMap: Record<string, Deal> = {};

    for (const lot of collectorLots) {
      try {
        const offers = await offerRepository.getOffersForLot(lot.localId);
        offersMap[lot.localId] = offers;

        const deal = await dealRepository.getDealByLotId(lot.localId);
        if (deal) {
          dealsMap[lot.localId] = deal;
        }
      } catch (err) {
        console.warn(`[CollectorDeals] Error loading offers for lot ${lot.localId}:`, err);
      }
    }
    setLotOffers(offersMap);
    setLotDeals(dealsMap);

    // Load completed transactions
    try {
      const txs = await transactionRepository.getTransactionsForUser(collectorId, 'collector');
      setCompletedTxs(txs);
    } catch (txErr) {
      console.warn('[CollectorDeals] Error loading transactions:', txErr);
    }
  };

  useEffect(() => {
    loadData();
  }, [collectorId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAcceptOffer = async (lotId: string, offerId: string) => {
    setActionLoading(offerId);
    try {
      const deal = await acceptOffer(lotId, offerId, collectorId);
      Alert.alert(
        'सौदा स्वीकृत! (Offer Accepted)',
        `सौदा तय हो गया है! कुल राशि: ₹${deal.agreedTotalAmount}\nअब स्क्रैप का हैंडओवर करें।`,
        [
          {
            text: 'हैंडओवर करें (Hand Over)',
            onPress: () => navigation.navigate('Handover', { lotId, dealId: deal.localId }),
          },
          { text: 'ठीक है (OK)', style: 'cancel' },
        ]
      );
      await loadData();
    } catch (e: any) {
      Alert.alert('त्रुटि (Error)', e?.message || 'ऑफर स्वीकार नहीं हो सका');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOffer = async (offerId: string, lotId: string) => {
    setActionLoading(offerId);
    try {
      await rejectOffer(offerId, lotId);
      await loadData();
    } catch (e: any) {
      Alert.alert('त्रुटि', 'ऑफर अस्वीकार नहीं हो सका');
    } finally {
      setActionLoading(null);
    }
  };

  const activeLots = collectorLots.filter(
    (lot) => lot.status !== 'completed' && lot.status !== 'paid' && lot.status !== 'cancelled'
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('tabDeals')}
        showBack={false}
        showRoleSwitch={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Tabs: Active vs Completed */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.tabActive]}
            onPress={() => setActiveTab('active')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'active' && styles.tabTextActive,
              ]}
            >
              सक्रिय लॉट व सौदे ({activeLots.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'completed' && styles.tabTextActive,
              ]}
            >
              पूर्ण सौदे ({completedTxs.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'active' ? (
          <>
            {isLoading && activeLots.length === 0 && (
              <LoadingState message="सौदों की स्थिति जांची जा रही है..." />
            )}

            {error && activeLots.length === 0 && (
              <ErrorState
                message="डेटा लोड करने में विफल।"
                onRetry={loadData}
              />
            )}

            {!isLoading && activeLots.length === 0 && (
              <EmptyState
                icon="hand-left-outline"
                title="अभी कोई सक्रिय सौदा नहीं है"
                description="सामान बेचने के लिए नया लॉट बनाएँ। रीसाइक्लर के ऑफर यहाँ दिखाई देंगे।"
                actionTitle={t('sellGoodsCTA')}
                onActionPress={() => navigation.navigate('MaterialCategory')}
              />
            )}

            {activeLots.map((lot) => {
              const offers = lotOffers[lot.localId] || [];
              const deal = lotDeals[lot.localId];
              const hasDeal = Boolean(deal) || lot.status === 'deal_created' || lot.status === 'deal_locked';

              return (
                <View key={lot.localId || lot.id} style={styles.lotItemWrapper}>
                  <LotCard
                    lot={lot}
                    onPress={() => {
                      if (hasDeal) {
                        navigation.navigate('Handover', { lotId: lot.localId, dealId: deal?.localId });
                      }
                    }}
                  />

                  {/* Deals / Handover CTA if deal locked */}
                  {hasDeal && (
                    <TouchableOpacity
                      style={styles.handoverActionBanner}
                      onPress={() => navigation.navigate('Handover', { lotId: lot.localId, dealId: deal?.localId })}
                    >
                      <View style={styles.handoverBannerLeft}>
                        <Ionicons name="checkmark-done-circle" size={24} color="#00875A" />
                        <View style={{ marginLeft: spacing.sm }}>
                          <Text style={styles.handoverBannerTitle}>सौदा तय हो चुका है!</Text>
                          <Text style={styles.handoverBannerSub}>
                            राशि: ₹{deal?.agreedTotalAmount || lot.agreedTotalAmount} (हैंडओवर के लिए टैप करें)
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="arrow-forward" size={20} color="#00875A" />
                    </TouchableOpacity>
                  )}

                  {/* Real Offers Received Section */}
                  {offers.length > 0 && !hasDeal && (
                    <View style={styles.offersSection}>
                      <View style={styles.offersSectionHeader}>
                        <Ionicons name="pricetags" size={18} color={colors.primary} />
                        <Text style={styles.offersSectionTitle}>
                          प्राप्त ऑफर ({offers.length}):
                        </Text>
                      </View>

                      {offers.map((offer) => {
                        const isPending = offer.status === 'pending' || offer.status === 'sent' || offer.status === 'viewed';
                        const isAccepted = offer.status === 'accepted';
                        const isRejected = offer.status === 'rejected';

                        return (
                          <View key={offer.localId || offer.id} style={styles.offerCard}>
                            <View style={styles.offerHeaderRow}>
                              <Text style={styles.offerRecyclerName}>
                                {offer.recyclerName || 'पंजीकृत रीसाइक्लर'}
                              </Text>
                              <View
                                style={[
                                  styles.offerBadge,
                                  isAccepted ? styles.badgeAccepted : isRejected ? styles.badgeRejected : styles.badgePending,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.offerBadgeText,
                                    isAccepted ? styles.badgeAcceptedText : isRejected ? styles.badgeRejectedText : styles.badgePendingText,
                                  ]}
                                >
                                  {isAccepted ? 'स्वीकृत' : isRejected ? 'अस्वीकृत' : 'लंबित (Pending)'}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.offerDetailsRow}>
                              <Text style={styles.offerRate}>
                                ₹{offer.ratePerKg} / किग्रा
                              </Text>
                              <Text style={styles.offerTotal}>
                                कुल: ₹{offer.totalAmount}
                              </Text>
                            </View>

                            {offer.comments ? (
                              <Text style={styles.offerComment}>
                                "{offer.comments}"
                              </Text>
                            ) : null}

                            {/* Actions for Pending Offers */}
                            {isPending && (
                              <View style={styles.offerActionsRow}>
                                <TouchableOpacity
                                  style={styles.rejectBtn}
                                  onPress={() => handleRejectOffer(offer.localId || offer.id, lot.localId)}
                                  disabled={actionLoading === (offer.localId || offer.id)}
                                >
                                  <Text style={styles.rejectBtnText}>अस्वीकार</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.acceptBtn}
                                  onPress={() => handleAcceptOffer(lot.localId, offer.localId || offer.id)}
                                  disabled={actionLoading === (offer.localId || offer.id)}
                                >
                                  {actionLoading === (offer.localId || offer.id) ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                  ) : (
                                    <Text style={styles.acceptBtnText}>स्वीकार करें (Accept)</Text>
                                  )}
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {offers.length === 0 && !hasDeal && (
                    <View style={styles.waitingForOffersBanner}>
                      <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                      <Text style={styles.waitingForOffersText}>
                        रीसाइक्लर से ऑफर की प्रतीक्षा है...
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        ) : (
          /* Completed Deals Tab */
          <>
            {completedTxs.length === 0 ? (
              <EmptyState
                icon="checkmark-circle-outline"
                title="कोई पूर्ण सौदा नहीं है"
                description="पूरे हो चुके सौदे और रसीदें यहाँ दिखाई देंगी।"
                actionTitle={t('sellGoodsCTA')}
                onActionPress={() => navigation.navigate('MaterialCategory')}
              />
            ) : (
              <View style={styles.txListContainer}>
                {completedTxs.map((tx) => (
                  <View key={tx.localId || tx.id} style={styles.txCard}>
                    <View style={styles.txHeaderRow}>
                      <View style={styles.txIconCircle}>
                        <Ionicons name="checkmark-done" size={20} color="#00875A" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.txNumber}>{tx.transactionNumber}</Text>
                        <Text style={styles.txMaterial}>{tx.materialName} • {tx.weightKg} किग्रा</Text>
                      </View>
                      <Text style={styles.txAmount}>₹{tx.totalAmount}</Text>
                    </View>

                    <View style={styles.txFooterRow}>
                      <Text style={styles.txDate}>
                        {new Date(tx.date).toLocaleDateString('hi-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                      <View style={styles.paymentMethodBadge}>
                        <Text style={styles.paymentMethodText}>
                          भुगतान: {tx.paymentMethod.toUpperCase()} (पूर्ण)
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textLight,
  },
  lotItemWrapper: {
    marginBottom: spacing.lg,
  },
  handoverActionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3FCEF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: -spacing.xs,
    borderWidth: 1,
    borderColor: '#ABF5D1',
  },
  handoverBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  handoverBannerTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: '#00875A',
  },
  handoverBannerSub: {
    fontSize: 11,
    color: '#00875A',
    marginTop: 2,
  },
  offersSection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  offersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  offersSectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  offerCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xs,
  },
  offerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerRecyclerName: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  offerBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  offerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgePendingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },
  badgeAccepted: {
    backgroundColor: '#E3FCEF',
  },
  badgeAcceptedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00875A',
  },
  badgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  badgeRejectedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },
  offerDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  offerRate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  offerTotal: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  offerComment: {
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  offerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  rejectBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: '#F3F4F6',
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  acceptBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
  },
  waitingForOffersBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  waitingForOffersText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  txListContainer: {
    gap: spacing.sm,
  },
  txCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  txHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3FCEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  txNumber: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  txMaterial: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  txAmount: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  txFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  txDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  paymentMethodBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  paymentMethodText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
