import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateLot } from '../../../context/CreateLotContext';
import { useLotStore } from '../../../store/useLotStore';
import { matchingService, MatchingResult } from '../../../services/recycler/matchingService';
import { lotRepository } from '../../../services/sqlite/repositories/lotRepository';
import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { EmptyState } from '../../../components/EmptyState';

interface RecyclerMatchingScreenProps {
  navigation: any;
  route: any;
}

export const RecyclerMatchingScreen: React.FC<RecyclerMatchingScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useLanguage();
  const { categoryId, weightKg, createdLotId } = useCreateLot();
  const [matches, setMatches] = useState<MatchingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const lotId = route.params?.lotId || createdLotId;

  const loadMatches = async () => {
    setLoading(true);
    try {
      let lot = route.params?.lot;
      if (!lot && lotId) {
        lot = await lotRepository.getLotById(lotId);
      }
      if (!lot) {
        lot = {
          id: 'TEMP',
          localId: 'TEMP',
          collectorId: 'COLLECTOR',
          categoryId: categoryId || 'pcb',
          weightKg: weightKg || 1,
          photos: [],
          status: 'published',
          syncStatus: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      const results = await matchingService.findSuitableRecyclers(lot);
      setMatches(results);
    } catch (e) {
      console.warn('[RecyclerMatching] Error finding matches:', e);
      setMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [lotId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const handleGoToDeals = () => {
    // Navigate to Collector Deals tab
    navigation.navigate('CollectorRoot', { screen: 'CollectorDeals' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('nearbyRecyclers')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showNotification={false}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <Text style={styles.screenHeading}>{t('nearbyRecyclers')}</Text>
        <Text style={styles.screenSub}>
          नियम-आधारित मिलान: केवल पंजीकृत और अनुकूल रीसाइक्लर ही प्रदर्शित हैं।
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>अनुकूल रीसाइक्लर खोजे जा रहे हैं...</Text>
          </View>
        ) : matches.length === 0 ? (
          <EmptyState
            icon="business-outline"
            title="कोई उपयुक्त रीसाइक्लर नहीं मिला"
            description="वर्तमान में इस क्षेत्र या सामग्री के लिए कोई रीसाइक्लर पंजीकृत नहीं है। जब कोई रीसाइक्लर आपका लॉट देखकर ऑफर भेजेगा, तो वह 'सौदे' में दिखाई देगा।"
            actionTitle="पुनः खोजें (Refresh)"
            onActionPress={loadMatches}
          />
        ) : (
          <View style={styles.matchesList}>
            <Text style={styles.matchCount}>
              {matches.length} अनुकूल रीसाइक्लर मिले:
            </Text>
            {matches.map(({ recycler, matchReasons }, idx) => (
              <View key={recycler.id || idx} style={styles.recyclerCard}>
                <View style={styles.recyclerHeader}>
                  <View style={styles.recyclerAvatar}>
                    <MaterialCommunityIcons name="factory" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.recyclerInfo}>
                    <Text style={styles.firmName}>
                      {recycler.firmName || recycler.businessName || 'पंजीकृत रीसाइक्लर'}
                    </Text>
                    <Text style={styles.locationText}>
                      <Ionicons name="location-outline" size={14} color={colors.textMuted} />{' '}
                      {recycler.city || recycler.serviceArea || 'महाराष्ट्र'}
                    </Text>
                  </View>
                </View>

                {/* Match badges */}
                <View style={styles.badgesRow}>
                  {matchReasons.map((reason, rIdx) => (
                    <View key={rIdx} style={styles.reasonBadge}>
                      <Ionicons name="checkmark" size={12} color="#00875A" />
                      <Text style={styles.reasonText}>{reason}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Primary Action to view deals */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title="मेरे सौदे देखें (View Deals) →"
          onPress={handleGoToDeals}
        />
      </View>
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
  screenHeading: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  screenSub: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    paddingVertical: spacing.huge,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  matchesList: {
    marginTop: spacing.sm,
  },
  matchCount: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  recyclerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  recyclerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recyclerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3FCEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  recyclerInfo: {
    flex: 1,
  },
  firmName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  locationText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3FCEF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  reasonText: {
    fontSize: 11,
    color: '#00875A',
    fontWeight: '600',
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
