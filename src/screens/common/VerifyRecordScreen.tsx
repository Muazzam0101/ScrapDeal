import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { traceabilityService } from '../../services/traceability/traceabilityService';
import { PublicTraceabilityView } from '../../types';

interface VerifyRecordScreenProps {
  navigation: any;
  route: any;
}

export const VerifyRecordScreen: React.FC<VerifyRecordScreenProps> = ({
  navigation,
  route,
}) => {
  const initialToken = route.params?.token || route.params?.reference || '';
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [verifiedRecord, setVerifiedRecord] = useState<PublicTraceabilityView | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialToken) {
      handleVerify(initialToken);
    }
  }, [initialToken]);

  const handleVerify = async (refToken: string) => {
    const clean = refToken.trim();
    if (!clean) return;

    setLoading(true);
    setSearched(true);
    try {
      const record = await traceabilityService.verifyPublicRecord(clean);
      setVerifiedRecord(record);
    } catch (e) {
      console.warn('[VerifyRecordScreen] Verification error:', e);
      setVerifiedRecord(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title="सत्यापन केंद्र (Verify Record)"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Verification Input Card */}
        <View style={[styles.searchCard, shadows.sm]}>
          <Text style={styles.searchLabel}>
            ट्रेस संदर्भ या क्यूआर टोकन दर्ज करें (Enter Reference / Token):
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={tokenInput}
              onChangeText={setTokenInput}
              placeholder="e.g. SCRAP-2026-..., SD-VERIFY-..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={() => handleVerify(tokenInput)}
              disabled={loading || !tokenInput.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.textLight} />
              ) : (
                <Text style={styles.verifyBtnText}>सत्यापित करें</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.privacyNoteRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} style={{ marginTop: 2 }} />
            <Text style={styles.privacyNote}>
              सार्वजनिक गोपनीयता सुरक्षा: व्यक्तिगत फोन नंबर, बैंक खाते या गोपनीय विवरण यहां कभी प्रदर्शित नहीं किए जाते।
            </Text>
          </View>
        </View>

        {/* Verification Results */}
        {searched && !loading && (
          <>
            {verifiedRecord ? (
              <View style={[styles.resultCard, styles.resultCardValid, shadows.md]}>
                {/* Status Header */}
                <View style={styles.resultHeaderRow}>
                  <View style={styles.statusPillValid}>
                    <Ionicons name="checkmark-circle" size={18} color="#00875A" />
                    <Text style={styles.statusPillTextValid}>सत्यापित रिकॉर्ड (Valid Record)</Text>
                  </View>
                  <Text style={styles.verifiedTimestamp}>
                    {new Date(verifiedRecord.verificationTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {/* Details Table */}
                <View style={styles.detailsList}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>ट्रेस संदर्भ (Trace ID):</Text>
                    <Text style={styles.detailVal}>{verifiedRecord.traceabilityId}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>लॉट नंबर (Lot ID):</Text>
                    <Text style={styles.detailVal}>{verifiedRecord.lotId}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>सामग्री श्रेणी (Material):</Text>
                    <Text style={[styles.detailVal, { color: colors.primaryDark, fontWeight: '800' }]}>
                      {verifiedRecord.materialCategory.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>प्रमाणित वजन (Weight):</Text>
                    <Text style={styles.detailVal}>
                      {verifiedRecord.finalWeight !== undefined && verifiedRecord.finalWeight !== null
                        ? `${verifiedRecord.finalWeight} kg (Final)`
                        : `${verifiedRecord.estimatedWeight} kg (Estimated)`}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>कलेक्शन क्षेत्र (Collection Area):</Text>
                    <Text style={styles.detailVal}>{verifiedRecord.collectionGeneralArea}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>हैंडओवर स्थिति (Handover Status):</Text>
                    <Text style={[styles.detailVal, { color: colors.primary }]}>
                      {verifiedRecord.status.toUpperCase().replace('_', ' ')}
                    </Text>
                  </View>

                  {verifiedRecord.recyclerFacilityName && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailKey}>अधिकृत केंद्र (Facility):</Text>
                      <Text style={styles.detailVal}>{verifiedRecord.recyclerFacilityName}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.chainValidBanner}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                  <Text style={styles.chainValidText}>
                    डिजिटल चेन ऑफ कस्टडी पूर्ण रूप से सत्यापित और अखंडित है।
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.resultCard, styles.resultCardInvalid, shadows.md]}>
                <View style={styles.invalidHeaderRow}>
                  <Ionicons name="alert-circle" size={28} color={colors.danger} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.invalidTitle}>रिकॉर्ड नहीं मिला (Record Not Found)</Text>
                    <Text style={styles.invalidDesc}>
                      दर्ज किया गया संदर्भ या टोकन अमान्य है अथवा अभी तक क्लाउड रिकॉर्ड में मौजूद नहीं है।
                    </Text>
                  </View>
                </View>
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
  searchCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    marginBottom: spacing.xl,
  },
  searchLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  verifyBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: {
    ...typography.buttonSmall,
    color: colors.textLight,
    fontWeight: '800',
  },
  privacyNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 6,
  },
  privacyNote: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 1.5,
  },
  resultCardValid: {
    borderColor: '#A3E635',
  },
  resultCardInvalid: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusPillValid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3FCEF',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusPillTextValid: {
    ...typography.caption,
    color: '#00875A',
    fontWeight: '800',
    fontSize: 12,
  },
  verifiedTimestamp: {
    ...typography.caption,
    color: colors.textMuted,
  },
  detailsList: {
    gap: spacing.sm,
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailKey: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  detailVal: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  chainValidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryPale,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  chainValidText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    flex: 1,
  },
  invalidHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  invalidTitle: {
    ...typography.h4,
    color: colors.danger,
    fontWeight: '800',
  },
  invalidDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
