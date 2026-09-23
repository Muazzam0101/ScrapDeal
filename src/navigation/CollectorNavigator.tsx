import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { CollectorTabParamList } from '../types';

import { CollectorHomeScreen } from '../screens/collector/CollectorHomeScreen';
import { CollectorDealsScreen } from '../screens/collector/CollectorDealsScreen';
import { CollectorSafetyScreen } from '../screens/collector/CollectorSafetyScreen';
import { CollectorProfileScreen } from '../screens/collector/CollectorProfileScreen';

const Tab = createBottomTabNavigator<CollectorTabParamList>();

export const CollectorNavigator: React.FC = () => {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          ...typography.caption,
          fontWeight: '700',
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="CollectorHome"
        component={CollectorHomeScreen}
        options={{
          tabBarLabel: t('tabHome'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="CollectorDeals"
        component={CollectorDealsScreen}
        options={{
          tabBarLabel: t('tabDeals'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'reader' : 'reader-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="CollectorSafetyTab"
        component={CollectorSafetyScreen}
        options={{
          tabBarLabel: t('tabLearn'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="CollectorProfile"
        component={CollectorProfileScreen}
        options={{
          tabBarLabel: t('tabProfile'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
