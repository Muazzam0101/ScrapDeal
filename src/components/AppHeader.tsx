import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, rf } from '../theme';
import { useRole } from '../context/RoleContext';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguage } from '../context/LanguageContext';
import { notificationRepository } from '../services/sqlite/repositories/notificationRepository';

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
  const navigation = useNavigation<any>();
  const { role, switchRole } = useRole();
  const { currentUser, switchRole: switchAuthRole } = useAuthStore();
  const { t } = useLanguage();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    let isMounted = true;
    const checkUnread = async () => {
      try {
        if (currentUser?.id) {
          const count = await notificationRepository.getUnreadCount(currentUser.id);
          if (isMounted) setUnreadCount(count);
        }
      } catch {}
    };
    checkUnread();
    const interval = setInterval(checkUnread, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser?.id]);

  const handleRoleSwitch = () => {
    const nextRole = role === 'collector' ? 'recycler' : 'collector';
    switchRole();
    switchAuthRole();
    try {
      navigation.reset({
        index: 0,
        routes: [{ name: nextRole === 'collector' ? 'CollectorRoot' : 'RecyclerRoot' }],
      });
    } catch (e) {
      console.warn('[AppHeader] Navigation switch error:', e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
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
              <Image
                source={require('../../assets/logo.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
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
              onPress={handleRoleSwitch}
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
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              {unreadCount > 0 && <View style={styles.notificationDot} />}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: '100%',
    maxWidth: 540,
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
  headerLogo: {
    width: 130,
    height: 36,
  },
  headerTitle: {
    ...typography.h3,
    fontSize: rf(16),
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
    fontSize: rf(11.5),
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
    fontSize: rf(11.5),
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
