import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { NotificationProvider, useNotifications } from '../NotificationContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NotificationProvider>{children}</NotificationProvider>
);

describe('NotificationContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides initial notifications when no localStorage data', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    expect(result.current.notifications.length).toBeGreaterThan(0);
  });

  it('calculates unreadCount correctly', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    const unread = result.current.notifications.filter((n) => !n.read).length;
    expect(result.current.unreadCount).toBe(unread);
  });

  it('addNotification prepends a new notification', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    const before = result.current.notifications.length;

    act(() => {
      result.current.addNotification({
        userId: 'test-user',
        type: 'system',
        title: 'Test',
        message: 'Test message',
      });
    });

    expect(result.current.notifications.length).toBe(before + 1);
    expect(result.current.notifications[0].title).toBe('Test');
    expect(result.current.notifications[0].read).toBe(false);
  });

  it('markAsRead marks a single notification as read', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    const unreadNotif = result.current.notifications.find((n) => !n.read);
    if (!unreadNotif) return;

    act(() => {
      result.current.markAsRead(unreadNotif.id);
    });

    const updated = result.current.notifications.find((n) => n.id === unreadNotif.id);
    expect(updated?.read).toBe(true);
  });

  it('markAllAsRead sets all notifications to read', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every((n) => n.read)).toBe(true);
  });

  it('deleteNotification removes a notification', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    const first = result.current.notifications[0];
    const before = result.current.notifications.length;

    act(() => {
      result.current.deleteNotification(first.id);
    });

    expect(result.current.notifications.length).toBe(before - 1);
    expect(result.current.notifications.find((n) => n.id === first.id)).toBeUndefined();
  });

  it('clearAll removes all notifications', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.notifications.length).toBe(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it('persists notifications to localStorage', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.addNotification({
        userId: 'u1',
        type: 'order',
        title: 'Persist Test',
        message: 'Should be saved',
      });
    });

    const stored = JSON.parse(localStorage.getItem('zmierzymyczas_notifications') || '[]');
    expect(stored.find((n: any) => n.title === 'Persist Test')).toBeTruthy();
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useNotifications());
    }).toThrow('useNotifications must be used within NotificationProvider');
  });
});
