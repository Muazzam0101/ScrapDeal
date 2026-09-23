import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { LanguageProvider } from './src/context/LanguageContext';
import { RoleProvider } from './src/context/RoleContext';
import { CreateLotProvider } from './src/context/CreateLotContext';
import { RootNavigator } from './src/navigation';
import { OfflineIndicator } from './src/components/OfflineIndicator';
import { getDatabase } from './src/services/sqlite/database';
import { useAuthStore } from './src/store/useAuthStore';

export default function App() {
  useEffect(() => {
    // 1. Initialize SQLite tables and indices
    getDatabase()
      .then(() => {
        console.log('[ScrapDeal] Local SQLite database initialized successfully');
        // 2. Restore any persisted user session
        return useAuthStore.getState().restoreSession();
      })
      .then((user) => {
        if (user) {
          console.log(`[ScrapDeal] Restored session for ${user.role} (id: ${user.id})`);
        }
      })
      .catch((err) => {
        console.error('[ScrapDeal] Initialization error:', err);
      });
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <RoleProvider>
          <CreateLotProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <OfflineIndicator />
              <RootNavigator />
            </NavigationContainer>
          </CreateLotProvider>
        </RoleProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
