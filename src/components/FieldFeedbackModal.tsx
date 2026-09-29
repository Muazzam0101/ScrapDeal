import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { useAuthStore } from '../store/useAuthStore';
import { FieldFeedbackIssueType } from '../types';
import { safetyService } from '../services/safety/safetyService';

interface FieldFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  currentScreen: string;
}

interface IssueOption {
  type: FieldFeedbackIssueType;
  icon: string;
  iconSet: 'ionicons' | 'material';
  color: string;
  labelKey: string;
}

const ISSUE_OPTIONS: IssueOption[] = [
  { type: 'confusing', icon: 'help-circle-outline', iconSet: 'ionicons', color: '#8B5CF6', labelKey: 'feedbackConfusing' },
  { type: 'slow', icon: 'speedometer-outline', iconSet: 'ionicons', color: '#F59E0B', labelKey: 'feedbackSlow' },
  { type: 'hard_to_read', icon: 'eye-outline', iconSet: 'ionicons', color: '#EC4899', labelKey: 'feedbackHardToRead' },
  { type: 'translation', icon: 'language-outline', iconSet: 'ionicons', color: '#06B6D4', labelKey: 'feedbackTranslation' },
  { type: 'button_issue', icon: 'gesture-tap', iconSet: 'material', color: '#EF4444', labelKey: 'feedbackButton' },
  { type: 'offline_issue', icon: 'cloud-offline-outline', iconSet: 'ionicons', color: '#64748B', labelKey: 'feedbackOffline' },
  { type: 'camera_issue', icon: 'camera-outline', iconSet: 'ionicons', color: '#10B981', labelKey: 'feedbackCamera' },
  { type: 'other', icon: 'chatbubble-ellipses-outline', iconSet: 'ionicons', color: '#3B82F6', labelKey: 'feedbackOther' },
];

export const FieldFeedbackModal: React.FC<FieldFeedbackModalProps> = ({
  visible,
  onClose,
  currentScreen,
}) => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuthStore();
  const [selectedIssue, setSelectedIssue] = useState<FieldFeedbackIssueType | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedIssue) return;
    setIsSubmitting(true);
    try {
      await safetyService.submitFieldFeedback({
        userType: (currentUser?.role as any) || 'collector',
        screen: currentScreen,
        issueType: selectedIssue,
        comments: comments.trim() || undefined,
        language,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelectedIssue(null);
        setComments('');
        onClose();
      }, 1500);
    } catch (e) {
      console.warn('[FieldFeedbackModal] Error saving feedback:', e);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, shadows.lg]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Ionicons name="chatbox-ellipses-outline" size={24} color={colors.primary} />
              <Text style={styles.headerTitle}>{t('giveFeedback')}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close feedback modal"
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {submitted ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={styles.successText}>{t('feedbackThanks')}</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              <Text style={styles.promptText}>
                {language === 'mr'
                  ? 'या स्क्रीनवर काय अडचण आली?'
                  : language === 'hi'
                  ? 'इस स्क्रीन पर क्या समस्या आई?'
                  : 'What issue did you face on this screen?'}
              </Text>

              {/* Large touch targets issue grid */}
              <View style={styles.grid}>
                {ISSUE_OPTIONS.map((opt) => {
                  const isSelected = selectedIssue === opt.type;
                  return (
                    <TouchableOpacity
                      key={opt.type}
                      style={[
                        styles.issueCard,
                        isSelected && { borderColor: opt.color, backgroundColor: `${opt.color}15` },
                      ]}
                      onPress={() => setSelectedIssue(opt.type)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={t(opt.labelKey as any)}
                    >
                      {opt.iconSet === 'ionicons' ? (
                        <Ionicons name={opt.icon as any} size={28} color={isSelected ? opt.color : colors.textSecondary} />
                      ) : (
                        <MaterialCommunityIcons name={opt.icon as any} size={28} color={isSelected ? opt.color : colors.textSecondary} />
                      )}
                      <Text
                        style={[
                          styles.issueLabel,
                          isSelected && { color: opt.color, fontWeight: '700' },
                        ]}
                      >
                        {t(opt.labelKey as any)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Optional comments input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    language === 'mr'
                      ? 'काही सांगायचे आहे का? (ऐच्छिक)'
                      : language === 'hi'
                      ? 'कुछ और बताना चाहते हैं? (वैकल्पिक)'
                      : 'Additional note (optional)...'
                  }
                  placeholderTextColor={colors.textMuted}
                  value={comments}
                  onChangeText={setComments}
                  multiline
                  maxLength={200}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  !selectedIssue && styles.submitBtnDisabled,
                ]}
                disabled={!selectedIssue || isSubmitting}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.textLight} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>{t('submit')}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  closeBtn: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: spacing.lg,
  },
  promptText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  issueCard: {
    width: '48%',
    minHeight: 56,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    gap: 4,
  },
  issueLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 64,
    ...typography.body,
    color: colors.text,
    textAlignVertical: 'top',
  },
  submitBtn: {
    minHeight: 52,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  submitBtnText: {
    ...typography.button,
    color: colors.textLight,
  },
  successBox: {
    paddingVertical: spacing.huge,
    alignItems: 'center',
    gap: spacing.md,
  },
  successText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.success,
    textAlign: 'center',
  },
});
