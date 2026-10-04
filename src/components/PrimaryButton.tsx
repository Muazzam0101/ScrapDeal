import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows, rf } from '../theme';

interface PrimaryButtonProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  subtitle,
  onPress,
  icon,
  iconPosition = 'right',
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return colors.cardAlt;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.softBlue;
      case 'danger':
        return colors.danger;
      case 'outline':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    if (variant === 'outline') return colors.primary;
    return colors.textLight;
  };

  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: isOutline ? 2 : 0,
          borderColor: isOutline ? colors.primary : 'transparent',
        },
        variant === 'primary' && !disabled ? shadows.md : shadows.none,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator
          color={isOutline ? colors.primary : colors.textLight}
          size="small"
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={22}
              color={getTextColor()}
              style={styles.leftIcon}
            />
          )}

          <View style={styles.textContainer}>
            <Text
              style={[styles.title, { color: getTextColor() }, textStyle]}
              numberOfLines={2}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  { color: isOutline ? colors.primaryDark : 'rgba(255,255,255,0.85)' },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={20}
              color={getTextColor()}
              style={styles.rightIcon}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
    maxWidth: '100%',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
    paddingHorizontal: spacing.xs,
  },
  title: {
    ...typography.button,
    fontSize: rf(15),
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    fontSize: rf(11),
    marginTop: 2,
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: spacing.xs + 2,
  },
  rightIcon: {
    marginLeft: spacing.xs + 2,
  },
});
