import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthStore } from '../../store/useAuthStore';
import { useRole } from '../../context/RoleContext';
import { notificationService } from '../../services/notification/notificationService';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { AppNotification } from '../../types';

interface NotificationsScreenProps {
  navigation: any;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuthStore();
  const { role } = useRole();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = currentUser?.id || 'LOCAL-USER';

  const loadNotifications = async () => {
    try {
      const list = await notificationService.getNotifications(userId);
      setNotifications(list);
    } catch (e) {
      console.warn('[NotificationsScreen] Error loading notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(userId);
    await loadNotifications();
  };

  const handleNotificationPress = async (item: AppNotification) => {
    if (!item.read) {
      await notificationService.markAsRead(item.notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === item.notificationId ? { ...n, read: true } : n))
      );
    }

    const currentRole: 'collector' | 'recycler' = role === 'recycler' ? 'recycler' : 'collector';
    const deepLink = notificationService.getDeepLinkForNotification(item, currentRole);
    try {
      navigation.navigate(deepLink.screen, deepLink.params);
    } catch (navErr) {
      console.warn('[NotificationsScreen] Deep link navigation error:', navErr);
    }
  };

  const filteredNotifications = notifications.filter((n) => (filter === 'unread' ? !n.read : true));
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIconForType = (type: string) => {
    switch (type) {
      case 'new_offer':
        return { name: 'pricetag-outline', color: colors.primary };
      case 'offer_accepted':
      case 'deal_created':
      case 'deal_confirmed':
        return { name: 'hand-left-outline', color: '#00875A' };
      case 'handover_pending':
      case 'handover_confirmed':
        return { name: 'cube-outline', color: '#D97706' };
      case 'payment_completed':
        return { name: 'checkmark-circle-outline', color: '#00875A' };
      case 'payment_pending':
        return { name: 'time-outline', color: '#2563EB' };
      case 'payment_failed':
        return { name: 'alert-circle-outline', color: colors.danger };
      default:
        return { name: 'notifications-outline', color: colors.primary };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader
        title={t('notifications') || 'Notifications'}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showNotification={false}
        showRoleSwitch={false}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>{t('markAllAsRead') || 'Mark all read'}</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            {t('allNotifications') || 'All'} ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, filter === 'unread' && styles.filterTabTextActive]}>
            {t('unreadNotifications') || 'Unread'} ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {loading && <LoadingState message={t('loadingNotifications') || 'Loading notifications...'} />}

        {!loading && filteredNotifications.length === 0 && (
          <EmptyState
            icon="notifications-off-outline"
            title={t('noNotifications') || 'No Notifications Yet'}
            description={t('noNotificationsDesc') || "You're all caught up! Real updates on deals, handovers, and payments will appear here."}
          />
        )}

        {!loading && filteredNotifications.length > 0 && (
          <View style={styles.list}>
            {filteredNotifications.map((item) => {
              const icon = getIconForType(item.type);
              return (
                <TouchableOpacity
                  key={item.notificationId}
                  style={[styles.card, shadows.sm, !item.read && styles.unreadCard]}
                  onPress={() => handleNotificationPress(item)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: `${icon.color}15` }]}>
                    <Ionicons name={icon.name as any} size={22} color={icon.color} />
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.cardTopRow}>
                      <Text style={[styles.title, !item.read && styles.unreadTitle]}>
                        {item.title}
                      </Text>
                      {!item.read && <View style={styles.unreadDot} />}
                    </View>

                    <Text style={styles.body}>{item.body}</Text>
                    <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  filtersRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filterTab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardAlt,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: colors.textLight,
    fontWeight: '700',
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  markAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
  },
  unreadCard: {
    backgroundColor: '#F8FAFC',
    borderColor: colors.primaryPale,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.xs,
  },
  body: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  time: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
