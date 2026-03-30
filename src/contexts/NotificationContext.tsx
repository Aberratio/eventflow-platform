import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification, NotificationType } from '@/types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Mock initial notifications
const initialNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'p1',
    type: 'registration',
    title: 'Potwierdzenie zapisu',
    message: 'Zostałeś zapisany na Bieg Górski Tatry Ultra 2026 - dystans Maraton 42K.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    actionUrl: '/participant?tab=registrations',
  },
  {
    id: 'notif-2',
    userId: 'o1',
    type: 'moderation',
    title: 'Wydarzenie zatwierdzone',
    message: 'Twoje wydarzenie "City Trail Łódź 2026" zostało zatwierdzone przez administratora.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    actionUrl: '/organizer',
  },
  {
    id: 'notif-3',
    userId: 'p1',
    type: 'order',
    title: 'Zamówienie wysłane',
    message: 'Twoje zamówienie #ORD-2026-X7Y8Z9 zostało wysłane. Numer przesyłki: 123456789.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    actionUrl: '/participant?tab=orders',
  },
  {
    id: 'notif-4',
    userId: 'p1',
    type: 'message',
    title: 'Nowa wiadomość',
    message: 'Otrzymałeś nową wiadomość od organizatora wydarzenia Maraton Rowerowy Mazury.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    actionUrl: '/participant?tab=messages',
  },
  {
    id: 'notif-5',
    userId: 'o1',
    type: 'moderation',
    title: 'Wydarzenie odrzucone',
    message: 'Twoje wydarzenie "Test Event" wymaga poprawek. Sprawdź szczegóły odrzucenia.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    actionUrl: '/organizer',
  },
  {
    id: 'notif-6',
    userId: 'p1',
    type: 'system',
    title: 'Witaj w ZmierzymyCzas!',
    message: 'Dziękujemy za dołączenie do platformy. Sprawdź nadchodzące wydarzenia.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    actionUrl: '/events',
  },
];

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const stored = localStorage.getItem('sporttime_notifications');
    return stored ? JSON.parse(stored) : initialNotifications;
  });

  useEffect(() => {
    localStorage.setItem('sporttime_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
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
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
