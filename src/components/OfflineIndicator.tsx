import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, borderRadius, spacing } from '../theme';
import { useNetworkStore } from '../store/useNetworkStore';
import { useSyncStore } from '../store/useSyncStore';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, simulateConnectivity } = useNetworkStore();
  const { isSyncing, pendingCount, triggerSync } = useSyncStore();

  const handlePress = () => {
    if (isOnline) {
      triggerSync();
    }
  };

  // 1. When actively syncing
  if (isOnline && isSyncing) {
    return (
      <View style={[styles.bar, styles.syncingBar]}>
        <ActivityIndicator size="small" color={colors.primaryDark} style={styles.spinner} />
        <Text style={styles.syncingText}>
          सिंक हो रहा है... ({pendingCount} शेष)
        </Text>
      </View>
    );
  }

  // 2. When device is OFFLINE
  if (!isOnline) {
    return (
      <View style={[styles.bar, styles.offlineBar]}>
        <View style={styles.dotOrange} />
        <Text style={styles.offlineText}>
          🟠 ऑफलाइन — डेटा सुरक्षित है, इंटरनेट आने पर सिंक होगा
        </Text>
      </View>
    );
  }

  // 3. When online with pending items waiting to sync
  if (pendingCount > 0) {
    return (
      <TouchableOpacity
        style={[styles.bar, styles.pendingBar]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Ionicons name="cloud-upload-outline" size={16} color={colors.warning} />
        <Text style={styles.pendingText}>
          {pendingCount} बदलाव सिंक होने बाकी हैं (टैप करें)
        </Text>
      </TouchableOpacity>
    );
  }

  // 4. Subtle Online state (clean and unobtrusive)
  return null;
};

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  offlineBar: {
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  syncingBar: {
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  pendingBar: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
    gap: 6,
  },
  offlineText: {
    ...typography.badge,
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  syncingText: {
    ...typography.badge,
    color: '#1E40AF',
    fontSize: 11,
    fontWeight: '700',
  },
  pendingText: {
    ...typography.badge,
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  dotOrange: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F59E0B',
    marginRight: 6,
  },
  spinner: {
    marginRight: 6,
    transform: [{ scale: 0.75 }],
  },
});
