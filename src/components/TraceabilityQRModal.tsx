import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { useLanguage } from '../context/LanguageContext';

interface TraceabilityQRModalProps {
  visible: boolean;
  onClose: () => void;
  traceabilityId: string;
  lotId: string;
  handoverReference?: string;
  qrReferenceToken: string;
  materialName?: string;
}

const { width } = Dimensions.get('window');
const QR_BOX_SIZE = Math.min(width - 80, 220);

// Deterministic matrix generator for visual QR pattern based on token hash
function generateMatrix(seed: string, size: number = 19): boolean[][] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const matrix: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    matrix[r] = [];
    for (let c = 0; c < size; c++) {
      // Corner finder patterns (7x7 blocks in top-left, top-right, bottom-left)
      const isTopLeft = r < 7 && c < 7;
      const isTopRight = r < 7 && c >= size - 7;
      const isBottomLeft = r >= size - 7 && c < 7;

      if (isTopLeft || isTopRight || isBottomLeft) {
        const localR = isBottomLeft ? r - (size - 7) : r;
        const localC = isTopRight ? c - (size - 7) : c;
        // Outer border or inner 3x3 box
        const isBorder = localR === 0 || localR === 6 || localC === 0 || localC === 6;
        const isCenter = localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4;
        matrix[r][c] = isBorder || isCenter;
      } else {
        // Pseudo-random deterministic fill from token hash
        const cellHash = Math.sin(hash + r * 31 + c * 17) * 10000;
        matrix[r][c] = (cellHash - Math.floor(cellHash)) > 0.45;
      }
    }
  }
  return matrix;
}

export const TraceabilityQRModal: React.FC<TraceabilityQRModalProps> = ({
  visible,
  onClose,
  traceabilityId,
  lotId,
  handoverReference,
  qrReferenceToken,
  materialName,
}) => {
  const { t } = useLanguage();
  const matrix = React.useMemo(() => generateMatrix(qrReferenceToken || traceabilityId), [qrReferenceToken, traceabilityId]);
  const cellSize = QR_BOX_SIZE / matrix.length;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `ScrapDeal Digital Traceability Reference: ${traceabilityId}\nLot: ${lotId}${
          handoverReference ? `\nHandover: ${handoverReference}` : ''
        }\nVerification Token: ${qrReferenceToken}`,
      });
    } catch {}
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, shadows.lg]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleBox}>
              <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
              <Text style={styles.title}>डिजिटल क्यूआर कोड (Traceability QR)</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            हैंडओवर सत्यापन और डिजिटल कस्टडी के लिए अधिकृत क्यूआर
          </Text>

          {/* Visual QR Pattern Box */}
          <View style={styles.qrContainer}>
            <View style={[styles.qrBox, { width: QR_BOX_SIZE, height: QR_BOX_SIZE }]}>
              {matrix.map((row, rIdx) => (
                <View key={`r-${rIdx}`} style={styles.matrixRow}>
                  {row.map((cell, cIdx) => (
                    <View
                      key={`c-${cIdx}`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: cell ? '#0F172A' : '#FFFFFF',
                      }}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* Reference Meta */}
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>ट्रेस नंबर (Trace ID):</Text>
              <Text style={styles.metaValue}>{traceabilityId}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>लॉट संदर्भ (Lot ID):</Text>
              <Text style={styles.metaValue}>{lotId}</Text>
            </View>
            {handoverReference && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>हैंडओवर संदर्भ (Handover):</Text>
                <Text style={styles.metaValue}>{handoverReference}</Text>
              </View>
            )}
            {materialName && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>सामग्री (Material):</Text>
                <Text style={styles.metaValue}>{materialName}</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={18} color={colors.primary} />
              <Text style={styles.shareBtnText}>शेयर करें (Share)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>बंद करें (Done)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dialog: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 380,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  matrixRow: {
    flexDirection: 'row',
  },
  metaCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: 6,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  metaValue: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    gap: 6,
  },
  shareBtnText: {
    ...typography.buttonSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
  },
  doneBtnText: {
    ...typography.buttonSmall,
    color: colors.textLight,
    fontWeight: '700',
  },
});
