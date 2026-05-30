import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './src/services/LanguageContext';
import { CustomAlertProvider } from './src/services/CustomAlertContext';
import { NotificationCenterProvider } from './src/services/NotificationCenterContext';
import { ThemeProvider } from './src/services/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CustomAlertProvider>
          <NotificationCenterProvider>
            <SafeAreaProvider>
              <AppNavigator />
            </SafeAreaProvider>
          </NotificationCenterProvider>
        </CustomAlertProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
