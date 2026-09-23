import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { LanguageProvider } from './src/context/LanguageContext';
import { RoleProvider } from './src/context/RoleContext';
import { CreateLotProvider } from './src/context/CreateLotContext';
import { RootNavigator } from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <RoleProvider>
          <CreateLotProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </CreateLotProvider>
        </RoleProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

