import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { PriceCard } from '../../components/PriceCard';

interface UserAddedRate {
  id: string;
  materialName: string;
  category: string;
  ratePerKg: number;
}

export const RecyclerRatesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<'ewaste' | 'metals' | 'plastics'>('ewaste');
  const [ratesList, setRatesList] = useState<UserAddedRate[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newMaterial, setNewMaterial] = useState('');
  const [newRate, setNewRate] = useState('');

  const categories = [
    { key: 'ewaste', label: 'E-Waste' },
    { key: 'metals', label: 'Metals' },
    { key: 'plastics', label: 'Plastics' },
  ];

  const handleAddRate = () => {
    if (newMaterial.trim() && newRate.trim()) {
      setRatesList((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          materialName: newMaterial.trim(),
          category: activeCategory.toUpperCase(),
          ratePerKg: parseFloat(newRate) || 0,
        },
      ]);
      setNewMaterial('');
      setNewRate('');
      setModalVisible(false);
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
            <Text style={styles.headerAddText}>+ Add / Edit</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Filter Tabs */}
        <View style={styles.tabsRow}>
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.tab, isSelected && styles.tabActive]}
                onPress={() => setActiveCategory(cat.key as any)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    isSelected && styles.tabTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* User Added Rates or Empty State (Strict No Fake Rates) */}
        {ratesList.length === 0 ? (
          <EmptyState
            icon="pricetag-outline"
            title={t('noRatesAdded')}
            description={t('noRatesDesc')}
            actionTitle="+ नया Rate जोड़ें"
            onActionPress={() => setModalVisible(true)}
          />
        ) : (
          <View style={styles.ratesList}>
            {ratesList.map((item) => (
              <PriceCard
                key={item.id}
                materialName={item.materialName}
                category={item.category}
                rateRange={`₹ ${item.ratePerKg} / kg`}
                trend="stable"
                showEdit={true}
                onEdit={() => {}}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Interactive Modal to Add Rate */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>नया खरीद भाव जोड़ें (Add Rate)</Text>

            <Text style={styles.inputLabel}>सामग्री का नाम (Material Name)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Copper Cable / Mixed PCB"
              value={newMaterial}
              onChangeText={setNewMaterial}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.inputLabel}>दर (Rate in ₹ / kg)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 280"
              keyboardType="numeric"
              value={newRate}
              onChangeText={setNewRate}
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalButtons}>
              <SecondaryButton
                title={t('cancel')}
                onPress={() => setModalVisible(false)}
                style={styles.modalBtn}
              />
              <PrimaryButton
                title={t('save')}
                onPress={handleAddRate}
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
    color: colors.textSecondary,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.textLight,
  },
  ratesList: {
    gap: spacing.xs,
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
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.bodyMedium,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
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
