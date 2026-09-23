import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthStore } from '../../store/useAuthStore';
import { usePriceStore } from '../../store/usePriceStore';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { PriceCard } from '../../components/PriceCard';
import { MATERIAL_CATEGORIES } from '../../constants/materialCategories';
import { MaterialCategoryId } from '../../types';

export const RecyclerRatesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuthStore();
  const { recyclerRates, loadRecyclerRates, saveRate, isLoading } = usePriceStore();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategoryId>('copper');
  const [rateInput, setRateInput] = useState('');
  const [savingRate, setSavingRate] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const recyclerId = currentUser?.id || 'REC-LOCAL';
  const recyclerName = (currentUser as any)?.firmName || (currentUser as any)?.businessName || 'Recycler';

  useEffect(() => {
    loadRecyclerRates(recyclerId);
  }, [recyclerId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecyclerRates(recyclerId);
    setRefreshing(false);
  };

  const handleSaveRate = async () => {
    const rateNum = parseFloat(rateInput);
    if (isNaN(rateNum) || rateNum <= 0) {
      setSaveError('कृपया वैध दर दर्ज करें (Please enter a valid rate)');
      return;
    }

    setSavingRate(true);
    setSaveError(null);
    try {
      await saveRate({
        recyclerId,
        recyclerName,
        materialCategory: selectedCategory,
        ratePerKg: rateNum,
        locationCity: (currentUser as any)?.city || 'Pune',
      });
      setRateInput('');
      setModalVisible(false);
    } catch (err: any) {
      setSaveError(err?.message || 'दर सहेजने में विफल');
    } finally {
      setSavingRate(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('actionMyRates')}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showRoleSwitch={false}
        rightAction={
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={18} color={colors.textLight} />
            <Text style={styles.headerAddText}>+ दर जोड़ें (Add Rate)</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Banner Explaining Real Rate Persistence */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoBannerText}>
            आपके द्वारा दर्ज दरें कबाड़ीवालों के "आज के भाव" बोर्ड पर प्रदर्शित होंगी। (Rates update live on collector price board)
          </Text>
        </View>

        {/* User Added Rates or Empty State (Strict No Fake Rates) */}
        {recyclerRates.length === 0 ? (
          <EmptyState
            icon="pricetag-outline"
            title={t('noRatesAdded')}
            description={t('noRatesDesc')}
            actionTitle="+ नया Rate जोड़ें"
            onActionPress={() => setModalVisible(true)}
          />
        ) : (
          <View style={styles.ratesList}>
            {recyclerRates.map((item) => {
              const catConfig = MATERIAL_CATEGORIES.find((m) => m.id === item.materialCategory);
              const formattedDate = new Date(item.updatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View key={item.localId} style={styles.rateCardContainer}>
                  <PriceCard
                    materialName={catConfig?.labelEn || item.materialName || item.materialCategory.toUpperCase()}
                    category={item.materialCategory.toUpperCase()}
                    rateRange={`₹ ${item.ratePerKg} / kg`}
                    trend="stable"
                    showEdit={true}
                    onEdit={() => {
                      setSelectedCategory(item.materialCategory);
                      setRateInput(item.ratePerKg.toString());
                      setModalVisible(true);
                    }}
                  />
                  <View style={styles.rateTimestampRow}>
                    <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.rateTimestampText}>
                      अंतिम अपडेट: {new Date(item.updatedAt).toLocaleDateString()} {formattedDate}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Interactive Modal to Add/Update Rate */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>स्क्रैप खरीद दर निर्धारित करें (Set Rate)</Text>

            <Text style={styles.inputLabel}>सामग्री चुनें (Select Material Category)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catChipsScroll}>
              <View style={styles.catChipsRow}>
                {MATERIAL_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catChip, isSelected && styles.catChipSelected]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text style={[styles.catChipText, isSelected && styles.catChipTextSelected]}>
                        {cat.labelEn}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={styles.inputLabel}>दर प्रति किग्रा (Rate in ₹ / kg)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 520"
              keyboardType="numeric"
              value={rateInput}
              onChangeText={setRateInput}
              placeholderTextColor={colors.textMuted}
            />

            {saveError && <Text style={styles.errorText}>{saveError}</Text>}

            <View style={styles.modalButtons}>
              <SecondaryButton
                title={t('cancel')}
                onPress={() => {
                  setModalVisible(false);
                  setSaveError(null);
                }}
                style={styles.modalBtn}
              />
              <PrimaryButton
                title={t('save')}
                loading={savingRate}
                onPress={handleSaveRate}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  headerAddText: {
    ...typography.caption,
    color: colors.textLight,
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryUltraLight,
    borderWidth: 1,
    borderColor: colors.primaryPale,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoBannerText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  ratesList: {
    gap: spacing.sm,
  },
  rateCardContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    paddingBottom: spacing.xs,
  },
  rateTimestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingTop: 2,
  },
  rateTimestampText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  catChipsScroll: {
    marginBottom: spacing.sm,
  },
  catChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  catChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  catChipTextSelected: {
    color: colors.textLight,
  },
  textInput: {
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.bodyMedium,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalBtn: {
    flex: 1,
  },
});
