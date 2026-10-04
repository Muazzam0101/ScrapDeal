import { Platform } from 'react-native';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth } from 'firebase/auth';
import * as FirebaseAuth from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyPlaceholderKeyForScrapDealDev',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'scrapdeal-dev.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'scrapdeal-dev',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'scrapdeal-dev.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456',
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let isConfigured = false;

function setupAuth(firebaseApp: FirebaseApp): Auth {
  try {
    // If running on React Native (Android/iOS) and getReactNativePersistence is available,
    // initialize Auth with AsyncStorage to persist sessions and avoid missing persistence warning.
    const getReactNativePersistence = (FirebaseAuth as any).getReactNativePersistence;
    if (Platform.OS !== 'web' && typeof getReactNativePersistence === 'function') {
      return initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    }
  } catch (_e) {
    // If already initialized, getAuth will return existing instance
  }
  return getAuth(firebaseApp);
}

try {
  // Check if real API key is configured
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  if (apiKey && apiKey !== 'your_firebase_api_key_here' && !apiKey.includes('Placeholder')) {
    isConfigured = true;
  }

  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = setupAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.warn('[Firebase] Initialization warning (will operate in offline/local mode):', error);
  // Fallback app initialization to prevent runtime crash
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = setupAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage, isConfigured };
