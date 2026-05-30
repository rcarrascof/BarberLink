import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  cardBackground: string;
  cardHeader: string;
  cardSub: string;
  border: string;
  text: string;
  textMuted: string;
  textDim: string;
  primary: string;
  primaryContainer: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  whatsapp: string;
  inputBackground: string;
}

const darkColors: ThemeColors = {
  background: '#0a0a0a',
  cardBackground: '#0f0f11',
  cardHeader: '#18181b',
  cardSub: '#1a1a1e',
  border: '#27272a',
  text: '#ffffff',
  textMuted: '#a1a1aa',
  textDim: '#71717a',
  primary: '#10b981',
  primaryContainer: '#064e3b',
  accent: '#10b981',
  success: '#10b981',
  error: '#ef4444',
  warning: '#fbbf24',
  info: '#3b82f6',
  whatsapp: '#25d366',
  inputBackground: '#18181b',
};

const lightColors: ThemeColors = {
  background: '#f4f4f5',
  cardBackground: '#ffffff',
  cardHeader: '#e4e4e7',
  cardSub: '#fafafa',
  border: '#d4d4d8',
  text: '#18181b',
  textMuted: '#52525b',
  textDim: '#71717a',
  primary: '#10b981',
  primaryContainer: '#d1fae5',
  accent: '#10b981',
  success: '#10b981',
  error: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
  whatsapp: '#25d366',
  inputBackground: '#e4e4e7',
};

interface ThemeContextProps {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('dark');

  useEffect(() => {
    AsyncStorage.getItem('@barberlink_theme').then((savedTheme) => {
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme as ThemeType);
      }
    });
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    AsyncStorage.setItem('@barberlink_theme', nextTheme);
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
