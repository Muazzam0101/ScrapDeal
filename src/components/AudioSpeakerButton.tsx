import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useLanguage } from '../context/LanguageContext';

interface AudioSpeakerButtonProps {
  label?: string;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const AudioSpeakerButton: React.FC<AudioSpeakerButtonProps> = ({
  label,
  size = 'medium',
  style,
  onPress,
}) => {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const displayLabel = label || t('listen');

  const handlePress = () => {
    setIsPlaying(true);
    if (onPress) onPress();
    setTimeout(() => {
      setIsPlaying(false);
    }, 2400);
  };

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isSmall && styles.buttonSmall,
        isLarge && styles.buttonLarge,
        isPlaying && styles.buttonPlaying,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Audio readout: ${displayLabel}`}
    >
      <View style={styles.contentRow}>
        <Ionicons
          name={isPlaying ? 'volume-high' : 'volume-medium-outline'}
          size={isSmall ? 18 : isLarge ? 26 : 22}
          color={isPlaying ? colors.textLight : colors.primaryDark}
        />
        <Text
          style={[
            styles.text,
            isSmall && styles.textSmall,
            isLarge && styles.textLarge,
            isPlaying && styles.textPlaying,
          ]}
        >
          {isPlaying ? t('audioPlaying') : displayLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primaryPale,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
  },
  buttonSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  buttonLarge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  buttonPlaying: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    ...typography.buttonSmall,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 16,
  },
  textPlaying: {
    color: colors.textLight,
  },
});
