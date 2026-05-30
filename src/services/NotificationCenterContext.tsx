import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from './CustomAlertContext';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string; // Time representation e.g. "12:50 PM", "Hace 2 min"
  read: boolean;
  type: 'whatsapp' | 'system' | 'billing';
  targetScreen?: string;
  targetParams?: any;
}

interface NotificationCenterContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (title: string, body: string, type?: 'whatsapp' | 'system' | 'billing') => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationCenterContext = createContext<NotificationCenterContextType | undefined>(undefined);

export function useNotificationCenter() {
  const context = useContext(NotificationCenterContext);
  if (!context) {
    throw new Error('useNotificationCenter must be used within a NotificationCenterProvider');
  }
  return context;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Cita Agendada por WhatsApp',
    body: 'Reinold Carrasco reservó un Combo Corte + Barba para hoy a las 3:00 PM con Carlos M.',
    time: '12:51 PM',
    read: false,
    type: 'whatsapp',
  },
  {
    id: 'n2',
    title: 'Autopilot Activado',
    body: 'El bot de WhatsApp está gestionando activamente tu agenda en piloto automático.',
    time: '12:00 PM',
    read: true,
    type: 'system',
  },
  {
    id: 'n3',
    title: 'Facturación SaaS Sincronizada',
    body: 'Tu suscripción Premium se ha verificado exitosamente con el App Store.',
    time: 'Ayer',
    read: true,
    type: 'billing',
  },
];

export function NotificationCenterProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { showToast } = useAlert();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('@barberlink_notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        setNotifications(DEFAULT_NOTIFICATIONS);
        await AsyncStorage.setItem('@barberlink_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
      }
    } catch {
      setNotifications(DEFAULT_NOTIFICATIONS);
    }
  };

  const saveNotifications = async (list: NotificationItem[]) => {
    try {
      setNotifications(list);
      await AsyncStorage.setItem('@barberlink_notifications', JSON.stringify(list));
    } catch (e) {
      console.log('Failed to save notifications', e);
    }
  };

  const addNotification = (
    title: string,
    body: string,
    type: 'whatsapp' | 'system' | 'billing' = 'system'
  ) => {
    const now = new Date();
    let timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newNotification: NotificationItem = {
      id: `n_${Date.now()}`,
      title,
      body,
      time: timeStr,
      read: false,
      type,
    };

    const updated = [newNotification, ...notifications];
    saveNotifications(updated);

    // Dynamic clean flash toast
    showToast(title, type === 'whatsapp' ? 'success' : 'info');
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
    showToast('Notificaciones leídas', 'success');
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
  };

  const clearAll = () => {
    saveNotifications([]);
    showToast('Centro de notificaciones vacío', 'info');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationCenterContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationCenterContext.Provider>
  );
}
