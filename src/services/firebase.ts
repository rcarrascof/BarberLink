import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { config } from './config';

// Initialize Firebase App dynamically using our centralized environment configuration
const app = getApps().length === 0 ? initializeApp(config.firebase) : getApp();

// Initialize Auth with AsyncStorage persistence to keep the barber logged in
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
