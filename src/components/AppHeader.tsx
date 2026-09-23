import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useRole } from '../context/RoleContext';
import { useLanguage } from '../context/LanguageContext';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  location?: string;
  showNotification?: boolean;
  showRoleSwitch?: boolean;
  rightAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBack = false,
  onBackPress,
  location,
  showNotification = true,
  showRoleSwitch = true,
  rightAction,
}) => {
  const { role, switchRole } = useRole();
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onBackPress}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Ionicons name="sync-outline" size={18} color={colors.card} />
            </View>
            <Text style={styles.brandTitle}>SCRAPDEAL</Text>
          </View>
        )}

        {title && showBack && (
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>

      <View style={styles.rightRow}>
        {location && (
          <View style={styles.locationBadge}>
            <Ionicons name="location-sharp" size={14} color={colors.primary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>
        )}

        {rightAction}

        {showRoleSwitch && (
          <TouchableOpacity
            style={styles.roleSwitchButton}
            onPress={switchRole}
            accessibilityLabel="Switch Role"
          >
            <Ionicons
              name={role === 'collector' ? 'cube-outline' : 'person-outline'}
              size={15}
              color={colors.primaryDark}
            />
            <Text style={styles.roleSwitchText}>
              {role === 'collector' ? 'Recycler' : 'Kabadi'}
            </Text>
          </TouchableOpacity>
        )}

        {showNotification && (
          <TouchableOpacity
            style={styles.notificationButton}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    minHeight: 56,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    backgroundColor: colors.cardAlt,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  brandTitle: {
    ...typography.h3,
    color: colors.primaryDark,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    marginLeft: spacing.xs,
    flex: 1,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.primaryDark,
    fontWeight: '600',
    marginLeft: 2,
    maxWidth: 110,
  },
  roleSwitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.softBlueBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  roleSwitchText: {
    ...typography.caption,
    color: colors.softBlue,
    fontWeight: '700',
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardAlt,
    position: 'relative',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    position: 'absolute',
    top: 8,
    right: 8,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
});
