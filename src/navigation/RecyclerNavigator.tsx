import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { RecyclerTabParamList } from '../types';

import { RecyclerHomeScreen } from '../screens/recycler/RecyclerHomeScreen';
import { RecyclerLotsScreen } from '../screens/recycler/RecyclerLotsScreen';
import { RecyclerRatesScreen } from '../screens/recycler/RecyclerRatesScreen';
import { RecyclerProfileScreen } from '../screens/recycler/RecyclerProfileScreen';

const Tab = createBottomTabNavigator<RecyclerTabParamList>();

export const RecyclerNavigator: React.FC = () => {
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
        name="RecyclerHome"
        component={RecyclerHomeScreen}
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
        name="RecyclerLots"
        component={RecyclerLotsScreen}
        options={{
          tabBarLabel: t('tabLots'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'cube' : 'cube-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="RecyclerRateCard"
        component={RecyclerRatesScreen}
        options={{
          tabBarLabel: t('tabRateCard'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'pricetag' : 'pricetag-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="RecyclerProfile"
        component={RecyclerProfileScreen}
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
