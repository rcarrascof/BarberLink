import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Barber {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'inactive';
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number; // in RD$
  duration: number; // in minutes
}

export interface AvailabilityDay {
  day: string; // e.g., 'Lunes', 'Martes', etc.
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  hasLunchBreak?: boolean;
  lunchStart?: string;
  lunchEnd?: string;
}

const DEFAULT_BARBERS: Barber[] = [
  { id: '1', name: 'Carlos M.', phone: '+1 555-555-1111', status: 'active' },
  { id: '2', name: 'Javier R.', phone: '+1 555-555-2222', status: 'active' },
];

const DEFAULT_SERVICES: ServiceItem[] = [
  { id: '1', name: 'Combo Corte + Barba', price: 800, duration: 45 },
  { id: '2', name: 'Corte Clásico', price: 500, duration: 30 },
  { id: '3', name: 'Coloración de Barba', price: 1200, duration: 60 },
];

const DEFAULT_AVAILABILITY: AvailabilityDay[] = [
  { day: 'Lunes', isOpen: true, openTime: '09:00 AM', closeTime: '08:00 PM', hasLunchBreak: true, lunchStart: '12:00 PM', lunchEnd: '01:00 PM' },
  { day: 'Martes', isOpen: true, openTime: '09:00 AM', closeTime: '08:00 PM', hasLunchBreak: true, lunchStart: '12:00 PM', lunchEnd: '01:00 PM' },
  { day: 'Miércoles', isOpen: true, openTime: '09:00 AM', closeTime: '08:00 PM', hasLunchBreak: true, lunchStart: '12:00 PM', lunchEnd: '01:00 PM' },
  { day: 'Jueves', isOpen: true, openTime: '09:00 AM', closeTime: '08:00 PM', hasLunchBreak: true, lunchStart: '12:00 PM', lunchEnd: '01:00 PM' },
  { day: 'Viernes', isOpen: true, openTime: '09:00 AM', closeTime: '08:00 PM', hasLunchBreak: true, lunchStart: '12:00 PM', lunchEnd: '01:00 PM' },
  { day: 'Sábado', isOpen: true, openTime: '09:00 AM', closeTime: '08:00 PM', hasLunchBreak: true, lunchStart: '12:00 PM', lunchEnd: '01:00 PM' },
  { day: 'Domingo', isOpen: false, openTime: '10:00 AM', closeTime: '04:00 PM', hasLunchBreak: false, lunchStart: '12:00 PM', lunchEnd: '01:00 PM' },
];

export const storage = {
  getBarbers: async (): Promise<Barber[]> => {
    try {
      const data = await AsyncStorage.getItem('@barberlink_barbers');
      if (data) return JSON.parse(data);
      await AsyncStorage.setItem('@barberlink_barbers', JSON.stringify(DEFAULT_BARBERS));
      return DEFAULT_BARBERS;
    } catch {
      return DEFAULT_BARBERS;
    }
  },
  saveBarbers: async (barbers: Barber[]): Promise<void> => {
    await AsyncStorage.setItem('@barberlink_barbers', JSON.stringify(barbers));
  },

  getServices: async (): Promise<ServiceItem[]> => {
    try {
      const data = await AsyncStorage.getItem('@barberlink_services');
      if (data) return JSON.parse(data);
      await AsyncStorage.setItem('@barberlink_services', JSON.stringify(DEFAULT_SERVICES));
      return DEFAULT_SERVICES;
    } catch {
      return DEFAULT_SERVICES;
    }
  },
  saveServices: async (services: ServiceItem[]): Promise<void> => {
    await AsyncStorage.setItem('@barberlink_services', JSON.stringify(services));
  },

  getAvailability: async (): Promise<AvailabilityDay[]> => {
    try {
      const data = await AsyncStorage.getItem('@barberlink_hours');
      if (data) return JSON.parse(data);
      await AsyncStorage.setItem('@barberlink_hours', JSON.stringify(DEFAULT_AVAILABILITY));
      return DEFAULT_AVAILABILITY;
    } catch {
      return DEFAULT_AVAILABILITY;
    }
  },
  saveAvailability: async (avail: AvailabilityDay[]): Promise<void> => {
    await AsyncStorage.setItem('@barberlink_hours', JSON.stringify(avail));
  },

  getShopName: async (): Promise<string> => {
    try {
      const data = await AsyncStorage.getItem('@barberlink_shop_name');
      return data || 'Barbería Real';
    } catch {
      return 'Barbería Real';
    }
  },
  saveShopName: async (name: string): Promise<void> => {
    await AsyncStorage.setItem('@barberlink_shop_name', name);
  },

  getOwnerName: async (): Promise<string> => {
    try {
      const data = await AsyncStorage.getItem('@barberlink_owner_name');
      return data || 'Carlos';
    } catch {
      return 'Carlos';
    }
  },
  saveOwnerName: async (name: string): Promise<void> => {
    await AsyncStorage.setItem('@barberlink_owner_name', name);
  },

  getBlockedSlots: async (): Promise<Record<string, string[]>> => {
    try {
      const data = await AsyncStorage.getItem('@barberlink_blocked_slots');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },
  saveBlockedSlots: async (blocked: Record<string, string[]>): Promise<void> => {
    await AsyncStorage.setItem('@barberlink_blocked_slots', JSON.stringify(blocked));
  },

  getCountryCode: async (): Promise<string> => {
    try {
      const data = await AsyncStorage.getItem('@barberlink_country_code');
      return data || 'US';
    } catch {
      return 'US';
    }
  },
  saveCountryCode: async (code: string): Promise<void> => {
    await AsyncStorage.setItem('@barberlink_country_code', code);
  },

  getShopPhone: async (): Promise<string> => {
    try {
      const data = await AsyncStorage.getItem('@barberlink_shop_phone');
      return data || '+15551234567';
    } catch {
      return '+15551234567';
    }
  },
  saveShopPhone: async (phone: string): Promise<void> => {
    await AsyncStorage.setItem('@barberlink_shop_phone', phone);
  },

  getBotMessage: async (): Promise<string> => {
    try {
      const data = await AsyncStorage.getItem('@barberlink_bot_message');
      return data || '¡Hola! Bienvenido a nuestra barbería. ¿Con qué barbero deseas agendar tu cita hoy?';
    } catch {
      return '¡Hola! Bienvenido a nuestra barbería. ¿Con qué barbero deseas agendar tu cita hoy?';
    }
  },
  saveBotMessage: async (message: string): Promise<void> => {
    await AsyncStorage.setItem('@barberlink_bot_message', message);
  },

  getOnboardingCompleted: async (): Promise<boolean> => {
    try {
      const data = await AsyncStorage.getItem('@barberlink_onboarding_completed');
      return data === 'true';
    } catch {
      return false;
    }
  },
  saveOnboardingCompleted: async (completed: boolean): Promise<void> => {
    await AsyncStorage.setItem('@barberlink_onboarding_completed', completed ? 'true' : 'false');
  },

  getBillingState: async (): Promise<{ mode: 'trial' | 'subscribed'; trialDays: number }> => {
    try {
      const data = await AsyncStorage.getItem('@barberlink_billing');
      if (data) return JSON.parse(data);
      const defaultVal = { mode: 'trial' as const, trialDays: 7 };
      await AsyncStorage.setItem('@barberlink_billing', JSON.stringify(defaultVal));
      return defaultVal;
    } catch {
      return { mode: 'trial', trialDays: 7 };
    }
  },
  saveBillingState: async (state: { mode: 'trial' | 'subscribed'; trialDays: number }): Promise<void> => {
    await AsyncStorage.setItem('@barberlink_billing', JSON.stringify(state));
  },
};
