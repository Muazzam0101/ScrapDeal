import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { AudioSpeakerButton } from '../../components/AudioSpeakerButton';

interface CollectorPriceBoardScreenProps {
  navigation: any;
}

export const CollectorPriceBoardScreen: React.FC<CollectorPriceBoardScreenProps> = ({
  navigation,
}) => {
  const { t } = useLanguage();
  const [viewState, setViewState] = useState<'empty' | 'loading' | 'error'>('empty');
  const [selectedCity, setSelectedCity] = useState('पुणे, महाराष्ट्र');

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('todaysRate')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showRoleSwitch={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Location Selector Bar + Audio Button */}
        <View style={styles.locationBar}>
          <TouchableOpacity style={styles.locationSelector} activeOpacity={0.7}>
            <Ionicons name="location-sharp" size={20} color={colors.primary} />
            <Text style={styles.locationText}>{selectedCity}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <AudioSpeakerButton label={t('listen')} size="small" />
        </View>

        {/* State Toggle for UI Review */}
        <View style={styles.stateToggleContainer}>
          <Text style={styles.stateToggleLabel}>UI State Preview:</Text>
          <View style={styles.stateToggleRow}>
            {(['empty', 'loading', 'error'] as const).map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.toggleBtn, viewState === st && styles.toggleBtnActive]}
                onPress={() => setViewState(st)}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    viewState === st && styles.toggleBtnTextActive,
                  ]}
                >
                  {st.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dynamic Empty / Loading / Error States - STRICT ZERO MOCK DATA */}
        {viewState === 'empty' && (
          <EmptyState
            icon="trending-up-outline"
            title="आज की कीमतें उपलब्ध नहीं हैं"
            description={t('pricesEmptyDesc')}
            actionTitle="ताजा भाव प्राप्त करें (Refresh)"
            onActionPress={() => setViewState('loading')}
          />
        )}

        {viewState === 'loading' && (
          <LoadingState
            message="पुणे मंडी से ताजा ई-कचरा भाव प्राप्त किया जा रहा है..."
          />
        )}

        {viewState === 'error' && (
          <ErrorState
            message="भाव सर्वर से कनेक्ट नहीं हो सका। कृपया पुनः प्रयास करें।"
            onRetry={() => setViewState('empty')}
          />
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
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    ...typography.h4,
    color: colors.text,
  },
  stateToggleContainer: {
    backgroundColor: colors.cardAlt,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  stateToggleLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  stateToggleRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  toggleBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleBtnText: {
    ...typography.badge,
    color: colors.textSecondary,
    fontSize: 11,
  },
  toggleBtnTextActive: {
    color: colors.textLight,
  },
});
