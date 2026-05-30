import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from './translations';

type Locale = 'es' | 'en';

interface LanguageContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('es');

  // Load saved locale from AsyncStorage on startup
  useEffect(() => {
    const loadLocale = async () => {
      try {
        const savedLocale = await AsyncStorage.getItem('barberlink_locale');
        if (savedLocale === 'es' || savedLocale === 'en') {
          setLocaleState(savedLocale);
        }
      } catch (e) {
        console.error('Failed to load locale', e);
      }
    };
    loadLocale();
  }, []);

  const setLocale = async (newLocale: Locale) => {
    try {
      setLocaleState(newLocale);
      await AsyncStorage.setItem('barberlink_locale', newLocale);
    } catch (e) {
      console.error('Failed to save locale', e);
    }
  };

  // Translation lookup function
  const t = (key: string, replacements?: Record<string, string>): string => {
    const dict = translations[locale];
    // @ts-ignore
    let value = dict[key] || translations['es'][key] || key;

    // Apply any inline string replacements (e.g. {client} -> Reinold Carrasco)
    if (replacements) {
      Object.keys(replacements).forEach((repKey) => {
        value = value.replace(new RegExp(`{${repKey}}`, 'g'), replacements[repKey]);
      });
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
