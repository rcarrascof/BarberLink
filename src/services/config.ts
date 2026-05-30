export interface AppConfig {
  env: 'development' | 'production' | 'staging';
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  apiEndpoint: string;
  botSyncInterval: number; // in ms
}

// Development configuration with simulator keys
const DEV_CONFIG: AppConfig = {
  env: 'development',
  firebase: {
    apiKey: 'AIzaSyFakeApiKey-ForBarberLinkPlatform-123',
    authDomain: 'barberlink-app.firebaseapp.com',
    projectId: 'barberlink-app',
    storageBucket: 'barberlink-app.appspot.com',
    messagingSenderId: '123456789012',
    appId: '1:123456789012:web:a1b2c3d4e5f6g7h8i9j0',
  },
  apiEndpoint: 'http://localhost:3000/api',
  botSyncInterval: 15000,
};

// Production configuration keys
// Replace values here with actual production keys prior to store publishing
const PROD_CONFIG: AppConfig = {
  env: 'production',
  firebase: {
    apiKey: 'YOUR_PRODUCTION_API_KEY_HERE',
    authDomain: 'YOUR_PRODUCTION_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PRODUCTION_PROJECT_ID',
    storageBucket: 'YOUR_PRODUCTION_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_PRODUCTION_MESSAGING_SENDER_ID',
    appId: 'YOUR_PRODUCTION_APP_ID',
  },
  apiEndpoint: 'https://api.barberlink.com/v1',
  botSyncInterval: 30000,
};

// ACTIVE ENVIRONMENT TOGGLE
// Switch this value to 'development' or 'production' depending on build type
const ACTIVE_ENV: 'development' | 'production' = 'production';

export const config = ACTIVE_ENV === 'production' ? PROD_CONFIG : DEV_CONFIG;
