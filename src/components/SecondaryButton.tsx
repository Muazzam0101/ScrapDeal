import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'outline' | 'ghost' | 'dangerOutline';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  icon,
  variant = 'outline',
  disabled = false,
  style,
  textStyle,
}) => {
  const isDanger = variant === 'dangerOutline';
  const isGhost = variant === 'ghost';

  const borderColor = isDanger ? colors.danger : colors.border;
  const textColor = isDanger ? colors.danger : isGhost ? colors.textSecondary : colors.text;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          borderColor: isGhost ? 'transparent' : borderColor,
          borderWidth: isGhost ? 0 : 1.5,
          backgroundColor: isGhost ? 'transparent' : colors.card,
        },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <View style={styles.content}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={disabled ? colors.textMuted : textColor}
            style={styles.icon}
          />
        )}
        <Text
          style={[
            styles.title,
            { color: disabled ? colors.textMuted : textColor },
            textStyle,
          ]}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.buttonSmall,
    fontWeight: '600',
  },
  icon: {
    marginRight: spacing.xs,
  },
  disabled: {
    borderColor: colors.borderLight,
    backgroundColor: colors.cardAlt,
  },
});
