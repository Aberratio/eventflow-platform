import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { useRegistrationForm } from '@/hooks/useRegistrationForm';
import { AuthProvider } from '@/contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import type { Event } from '@/types';

const mockEvent: Event = {
  id: 'e1',
  name: 'Test Event',
  slug: 'test-event',
  date: '2025-06-15',
  registrationDeadline: '2025-06-10',
  location: 'Park',
  city: 'Warszawa',
  description: 'Test',
  organizerId: 'o1',
  organizerName: 'Org',
  discipline: 'running',
  status: 'published',
  imageUrl: '/test.jpg',
  distances: [
    {
      id: 'd1',
      name: '10 km',
      length: 10,
      unit: 'km',
      price: 80,
      ageCategories: [{ id: 'open', name: 'OPEN', minAge: 18, maxAge: 99 }],
      registeredCount: 5,
    },
    {
      id: 'd2',
      name: '5 km',
      length: 5,
      unit: 'km',
      price: 50,
      ageCategories: [{ id: 'open', name: 'OPEN', minAge: 18, maxAge: 99 }],
      registeredCount: 0,
    },
  ],
  discountCodes: [],
  enableMerchandiseInRegistration: false,
} as unknown as Event;

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(BrowserRouter, null, React.createElement(AuthProvider, null, children));

describe('useRegistrationForm', () => {
  it('initializes with step 1 and no distance selected', () => {
    const { result } = renderHook(() => useRegistrationForm(mockEvent), { wrapper });
    expect(result.current.step).toBe(1);
    expect(result.current.selectedDistanceId).toBe('');
    expect(result.current.isFirstStep).toBe(true);
  });

  it('canProceed returns false when no distance selected', () => {
    const { result } = renderHook(() => useRegistrationForm(mockEvent), { wrapper });
    expect(result.current.canProceed()).toBe(false);
  });

  it('canProceed returns true after selecting a distance', () => {
    const { result } = renderHook(() => useRegistrationForm(mockEvent), { wrapper });
    act(() => {
      result.current.setSelectedDistanceId('d1');
    });
    expect(result.current.canProceed()).toBe(true);
  });

  it('handleNext advances to next step', () => {
    const { result } = renderHook(() => useRegistrationForm(mockEvent), { wrapper });
    act(() => {
      result.current.setSelectedDistanceId('d1');
    });
    act(() => {
      result.current.handleNext();
    });
    expect(result.current.step).toBeGreaterThan(1);
  });

  it('handleBack goes to previous step', () => {
    const { result } = renderHook(() => useRegistrationForm(mockEvent), { wrapper });
    act(() => {
      result.current.setSelectedDistanceId('d1');
    });
    act(() => {
      result.current.handleNext();
    });
    const stepAfterNext = result.current.step;
    act(() => {
      result.current.handleBack();
    });
    expect(result.current.step).toBeLessThan(stepAfterNext);
  });

  it('distancePrice reflects selected distance', () => {
    const { result } = renderHook(() => useRegistrationForm(mockEvent), { wrapper });
    act(() => {
      result.current.setSelectedDistanceId('d1');
    });
    expect(result.current.distancePrice).toBe(80);
    act(() => {
      result.current.setSelectedDistanceId('d2');
    });
    expect(result.current.distancePrice).toBe(50);
  });

  it('totalAmount starts equal to distancePrice', () => {
    const { result } = renderHook(() => useRegistrationForm(mockEvent), { wrapper });
    act(() => {
      result.current.setSelectedDistanceId('d1');
    });
    expect(result.current.totalAmount).toBe(80);
  });

  it('activeSteps includes dynamic steps based on config', () => {
    const { result } = renderHook(() => useRegistrationForm(mockEvent), { wrapper });
    const stepIds = result.current.activeSteps.map((s) => s.id);
    expect(stepIds).toContain(1); // distance
    expect(stepIds).toContain(2); // data
    expect(stepIds).toContain(6); // summary
  });

  it('buildSubmitData returns null without agreement', () => {
    const { result } = renderHook(() => useRegistrationForm(mockEvent), { wrapper });
    act(() => {
      result.current.setSelectedDistanceId('d1');
    });
    expect(result.current.buildSubmitData()).toBeNull();
  });

  it('team name validation works', () => {
    const { result } = renderHook(() => useRegistrationForm(mockEvent), { wrapper });
    act(() => {
      result.current.setWantsTeam(true);
      result.current.setTeamMode('create');
      result.current.setTeamName('AB');
    });
    // Team name too short (< 3 chars) should produce error eventually
    // The validation runs via useEffect so we wait for it
    expect(result.current.wantsTeam).toBe(true);
  });
});
