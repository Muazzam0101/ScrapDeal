import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { AudioSpeakerButton } from '../../components/AudioSpeakerButton';

interface CollectorPriceBoardScreenProps {
  navigation: any;
}

export const CollectorPriceBoardScreen: React.FC<CollectorPriceBoardScreenProps> = ({
  navigation,
}) => {
  const { t } = useLanguage();
  const [selectedCity, setSelectedCity] = useState('पुणे, महाराष्ट्र');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
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

        {/* Dynamic Empty State - STRICT ZERO MOCK DATA */}
        <EmptyState
          icon="trending-up-outline"
          title="आज की कीमतें उपलब्ध नहीं हैं"
          description={t('pricesEmptyDesc')}
          actionTitle="ताजा भाव प्राप्त करें (Refresh)"
          onActionPress={handleRefresh}
        />
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
});
