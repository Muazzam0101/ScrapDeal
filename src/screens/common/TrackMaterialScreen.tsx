import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { AppHeader } from '../../components/AppHeader';
import { TraceabilityQRModal } from '../../components/TraceabilityQRModal';
import { traceabilityService } from '../../services/traceability/traceabilityService';
import {
  TraceabilityRecord,
  TraceabilityEvent,
  HandoverConfirmation,
  HandoverPhotoRecord,
} from '../../types';

interface TrackMaterialScreenProps {
  navigation: any;
  route: any;
}

export const TrackMaterialScreen: React.FC<TrackMaterialScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useLanguage();
  const lotId = route.params?.lotId;

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<TraceabilityRecord | null>(null);
  const [events, setEvents] = useState<TraceabilityEvent[]>([]);
  const [confirmations, setConfirmations] = useState<HandoverConfirmation[]>([]);
  const [photos, setPhotos] = useState<HandoverPhotoRecord[]>([]);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  useEffect(() => {
    loadTraceabilityData();
  }, [lotId]);

  const loadTraceabilityData = async () => {
    if (!lotId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await traceabilityService.getChainOfCustody(lotId);
      setRecord(data.record);
      setEvents(data.events);
      setConfirmations(data.confirmations);
      setPhotos(data.photos);
    } catch (err) {
      console.warn('[TrackMaterialScreen] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#E3FCEF', text: '#00875A' };
      case 'payment_pending':
      case 'handover_confirmed':
        return { bg: '#DBEAFE', text: '#2563EB' };
      case 'handover_pending':
      case 'deal_confirmed':
        return { bg: '#FEF3C7', text: '#D97706' };
      default:
        return { bg: colors.cardAlt, text: colors.textSecondary };
    }
  };

  const statusColors = getStatusBadgeColor(record?.status);

  // Standard ordered steps of digital chain of custody
  const TIMELINE_STEPS = [
    {
      id: 'collected',
      title: 'सामग्री एकत्र की गई (Collected)',
      desc: 'कलेक्टर द्वारा सामग्री दर्ज की गई',
      isCompleted: Boolean(record),
    },
    {
      id: 'matched',
      title: 'रीसाइक्लर मैच हुआ (Recycler Matched)',
      desc: 'सत्यापित रीसाइक्लर की पहचान और ऑफर',
      isCompleted: record?.status !== 'created' && record?.status !== 'collected',
    },
    {
      id: 'deal_confirmed',
      title: 'सौदा पक्का हुआ (Deal Confirmed)',
      desc: `दर और वजन पर सहमति: ${record?.agreedRatePerKg ? `₹${record.agreedRatePerKg}/kg` : ''}`,
      isCompleted: ['deal_confirmed', 'handover_pending', 'handover_confirmed', 'payment_pending', 'completed'].includes(record?.status || ''),
    },
    {
      id: 'handover_pending',
      title: 'हैंडओवर प्रक्रिया (Handover Started)',
      desc: record?.handoverReference ? `हैंडओवर संदर्भ #${record.handoverReference}` : 'हैंडओवर की तैयारी',
      isCompleted: ['handover_pending', 'handover_confirmed', 'payment_pending', 'completed'].includes(record?.status || ''),
    },
    {
      id: 'handover_confirmed',
      title: 'दो-तरफा हैंडओवर पुष्टि (Handover Confirmed)',
      desc: `कलेक्टर: ${record?.collectorConfirmedHandover ? 'पुष्ट' : 'लंबित'} | रीसाइक्लर: ${record?.recyclerConfirmedHandover ? 'पुष्ट' : 'लंबित'}`,
      isCompleted: ['handover_confirmed', 'payment_pending', 'completed'].includes(record?.status || ''),
    },
    {
      id: 'payment_pending',
      title: 'भुगतान स्थिति (Payment)',
      desc: record?.paymentStatus === 'completed' ? `भुगतान पूरा हुआ (${record.paymentMethod?.toUpperCase()})` : 'भुगतान प्रक्रियाधीन',
      isCompleted: record?.status === 'completed',
    },
    {
      id: 'completed',
      title: 'लेनदेन संपन्न (Transaction Completed)',
      desc: 'डिजिटल कस्टडी रिकॉर्ड पूर्ण और संरक्षित',
      isCompleted: record?.status === 'completed',
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader title="सामग्री ट्रैकिंग (Track Material)" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>डिजिटल कस्टडी रिकॉर्ड लोड हो रहा है...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title="डिजिटल कस्टडी (Chain of Custody)"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Reference & Status Card */}
        <View style={[styles.mainCard, shadows.md]}>
          <View style={styles.topStatusRow}>
            <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.badgeText, { color: statusColors.text }]}>
                {record?.status ? record.status.toUpperCase().replace('_', ' ') : 'COLLECTED'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.qrButton}
              onPress={() => setQrModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code" size={18} color={colors.textLight} />
              <Text style={styles.qrButtonText}>QR Code</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.refTitle}>ट्रेस संदर्भ (Trace ID):</Text>
          <Text style={styles.refValue}>{record?.traceabilityId || `LOT-${lotId}`}</Text>

          {record?.handoverReference && (
            <View style={styles.handoverBadgeRow}>
              <Text style={styles.handoverRefLabel}>हैंडओवर कोड:</Text>
              <Text style={styles.handoverRefValue}>{record.handoverReference}</Text>
            </View>
          )}

          {/* Weight Comparison Banner (Preserving Traceability) */}
          <View style={styles.weightBox}>
            <View style={styles.weightCol}>
              <Text style={styles.weightColLabel}>अनुमानित वजन (Est.):</Text>
              <Text style={styles.weightColValue}>{record?.estimatedWeight || 0} kg</Text>
            </View>

            <View style={styles.weightDivider} />

            <View style={styles.weightCol}>
              <Text style={styles.weightColLabel}>अंतिम वजन (Final):</Text>
              <Text style={[styles.weightColValue, record?.finalWeight ? { color: colors.primaryDark } : null]}>
                {record?.finalWeight !== undefined && record?.finalWeight !== null ? `${record.finalWeight} kg` : 'सत्यापन शेष'}
              </Text>
            </View>
          </View>

          {/* Weight Difference Alert */}
          {record?.weightDifference !== undefined && record?.weightDifference !== null && record.weightDifference > 0 && (
            <View style={styles.diffNotice}>
              <Ionicons name="information-circle-outline" size={18} color="#D97706" />
              <Text style={styles.diffNoticeText}>
                वजन अंतर: {record.weightDifference} kg ({record.weightDifferenceDirection === 'loss' ? 'कमी' : 'वृद्धि'})
              </Text>
            </View>
          )}

          {/* Conflict Flag Notice */}
          {record?.hasConflict && (
            <View style={styles.conflictBanner}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
              <Text style={styles.conflictBannerText}>{record.conflictDetails || 'ऑफलाइन रिकॉर्ड में समीक्षा आवश्यक है'}</Text>
            </View>
          )}
        </View>

        {/* Digital Chain of Custody Timeline */}
        <Text style={styles.sectionHeading}>डिजिटल कस्टडी समय-सीमा (Timeline)</Text>

        <View style={styles.timelineCard}>
          {TIMELINE_STEPS.map((step, idx) => {
            const isLast = idx === TIMELINE_STEPS.length - 1;

            return (
              <View key={step.id} style={styles.timelineItemRow}>
                {/* Visual Step Marker & Line */}
                <View style={styles.markerColumn}>
                  <View
                    style={[
                      styles.circleMarker,
                      step.isCompleted ? styles.circleCompleted : styles.circlePending,
                    ]}
                  >
                    <Ionicons
                      name={step.isCompleted ? 'checkmark' : 'ellipse'}
                      size={step.isCompleted ? 14 : 8}
                      color={step.isCompleted ? '#FFFFFF' : colors.textMuted}
                    />
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.verticalLine,
                        step.isCompleted ? styles.lineCompleted : styles.linePending,
                      ]}
                    />
                  )}
                </View>

                {/* Content */}
                <View style={styles.timelineContentBox}>
                  <Text
                    style={[
                      styles.timelineStepTitle,
                      step.isCompleted && styles.timelineStepTitleCompleted,
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text style={styles.timelineStepDesc}>{step.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Audit Events Trail */}
        {events.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>अपरिवर्तनीय ऑडिट लॉग (Audit Log)</Text>
            <View style={styles.auditCard}>
              {events.map((evt) => (
                <View key={evt.eventId} style={styles.auditRow}>
                  <View style={styles.auditIconBox}>
                    <MaterialCommunityIcons name="shield-check" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.auditDetails}>
                    <Text style={styles.auditType}>{evt.eventType.replace('_', ' ')}</Text>
                    <Text style={styles.auditActor}>
                      कर्ता (Actor): {evt.actorType.toUpperCase()} | {new Date(evt.timestamp).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* QR Code Modal */}
      {record && (
        <TraceabilityQRModal
          visible={qrModalVisible}
          onClose={() => setQrModalVisible(false)}
          traceabilityId={record.traceabilityId}
          lotId={record.lotId}
          handoverReference={record.handoverReference}
          qrReferenceToken={record.qrReferenceToken}
          materialName={record.materialCategory?.toUpperCase()}
        />
      )}
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
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  mainCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    marginBottom: spacing.xl,
  },
  topStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '800',
    fontSize: 11,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  qrButtonText: {
    ...typography.buttonSmall,
    color: colors.textLight,
    fontWeight: '700',
    fontSize: 12,
  },
  refTitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  refValue: {
    ...typography.h3,
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  handoverBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  handoverRefLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  handoverRefValue: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
  },
  weightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  weightCol: {
    flex: 1,
    alignItems: 'center',
  },
  weightColLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  weightColValue: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  weightDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  diffNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  diffNoticeText: {
    ...typography.caption,
    color: '#D97706',
    fontWeight: '700',
  },
  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  conflictBannerText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
    flex: 1,
  },
  sectionHeading: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '800',
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  timelineCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    marginBottom: spacing.xl,
  },
  timelineItemRow: {
    flexDirection: 'row',
  },
  markerColumn: {
    alignItems: 'center',
    width: 32,
  },
  circleMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: colors.primary,
  },
  circlePending: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
  },
  lineCompleted: {
    backgroundColor: colors.primaryLight,
  },
  linePending: {
    backgroundColor: colors.border,
  },
  timelineContentBox: {
    flex: 1,
    paddingBottom: spacing.lg,
    paddingLeft: spacing.sm,
  },
  timelineStepTitle: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    fontWeight: '700',
  },
  timelineStepTitleCompleted: {
    color: colors.textPrimary,
  },
  timelineStepDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  auditCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardAlt,
  },
  auditIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  auditDetails: {
    flex: 1,
  },
  auditType: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  auditActor: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
});
