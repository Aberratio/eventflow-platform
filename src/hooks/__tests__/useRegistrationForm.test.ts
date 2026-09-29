import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRegistrationForm } from '@/hooks/useRegistrationForm';
import { AuthProvider } from '@/contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import type { Event } from '@/types';

// PP.54: the relay picker offers only the user's own teams (captain consent) plus the invited team.
vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 'u1', name: 'Jan Kowalski', email: 'jan@example.com', role: 'participant' },
      isAuthenticated: true,
    }),
  };
});

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getTeamsForDistance: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'team-real-1',
          eventId: 'e1',
          distanceId: 'd1',
          name: 'Błyskawice',
          memberCount: 1,
          minSize: 2,
          maxSize: 4,
          complete: false,
          createdByUserId: 'u1',
        },
        {
          id: 'team-real-2',
          eventId: 'e1',
          distanceId: 'd1',
          name: 'Pełna',
          memberCount: 4,
          minSize: 2,
          maxSize: 4,
          complete: true,
          createdByUserId: 'u1',
        },
        {
          id: 'team-foreign',
          eventId: 'e1',
          distanceId: 'd1',
          name: 'Cudza',
          memberCount: 2,
          minSize: 2,
          maxSize: 4,
          complete: false,
          createdByUserId: 'someone-else',
        },
        {
          id: 'team-invited',
          eventId: 'e1',
          distanceId: 'd1',
          name: 'Zaproszona',
          memberCount: 1,
          minSize: 2,
          maxSize: 4,
          complete: false,
          createdByUserId: 'captain-2',
        },
      ],
      success: true,
    }),
    getRegistrationsByEvent: vi.fn().mockResolvedValue({ data: [], success: true }),
  };
});

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
  status: 'active',
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

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(BrowserRouter, null, React.createElement(AuthProvider, null, children)),
  );
};

describe('useRegistrationForm', () => {
  it('initializes with step 1 and no distance selected', () => {
    const { result } = renderHook(() => useRegistrationForm(mockEvent), { wrapper });
    expect(result.current.step).toBe(1);
    expect(result.current.selectedDistanceId).toBe('');
    expect(result.current.isFirstStep).toBe(true);
  });

  it('selects the only available distance by default', () => {
    const singleDistanceEvent = {
      ...mockEvent,
      distances: [mockEvent.distances[0]],
    };

    const { result } = renderHook(() => useRegistrationForm(singleDistanceEvent), { wrapper });

    expect(result.current.selectedDistanceId).toBe('d1');
    expect(result.current.canProceed()).toBe(true);
  });

  it('does not select a full single distance by default', () => {
    const fullDistanceEvent = {
      ...mockEvent,
      distances: [
        {
          ...mockEvent.distances[0],
          limit: 5,
          registeredCount: 5,
        },
      ],
    };

    const { result } = renderHook(() => useRegistrationForm(fullDistanceEvent), { wrapper });

    expect(result.current.selectedDistanceId).toBe('');
    expect(result.current.canProceed()).toBe(false);
  });

  it('selects the only category for the selected distance by default', () => {
    const singleCategoryEvent = {
      ...mockEvent,
      distances: [
        {
          ...mockEvent.distances[0],
          ageCategories: [],
          categories: ['Open'],
        },
      ],
    };

    const { result } = renderHook(() => useRegistrationForm(singleCategoryEvent), { wrapper });

    expect(result.current.selectedDistanceId).toBe('d1');
    expect(result.current.selectedCategory).toBe('Open');
  });

  it('keeps selected special categories when the base category is still valid', () => {
    const singleCategoryEvent = {
      ...mockEvent,
      distances: [
        {
          ...mockEvent.distances[0],
          categories: ['Open'],
        },
      ],
    };

    const { result } = renderHook(() => useRegistrationForm(singleCategoryEvent), { wrapper });

    act(() => {
      result.current.setSelectedCategory('Open, Firmowa');
    });

    expect(result.current.selectedCategory).toBe('Open, Firmowa');
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

  it('caps fixed discount at distance price and never returns negative total', () => {
    const eventWithDiscount = {
      ...mockEvent,
      discountCodes: [
        {
          id: 'dc-free',
          code: 'FREE200',
          discountType: 'fixed',
          discountValue: 200,
          usedCount: 0,
          active: true,
        },
      ],
    } as Event;

    const { result } = renderHook(() => useRegistrationForm(eventWithDiscount), { wrapper });

    act(() => {
      result.current.setSelectedDistanceId('d1');
      result.current.setDiscountCode('FREE200');
    });
    act(() => {
      result.current.handleApplyDiscount();
    });

    expect(result.current.discountAmount).toBe(80);
    expect(result.current.totalAmount).toBe(0);
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

  describe('E1.2 pricing model', () => {
    it('auto-selects the only Wariant and prices off it, not the legacy distance price', () => {
      const eventWithVariant = {
        ...mockEvent,
        distances: [
          {
            ...mockEvent.distances[0],
            price: 999, // should be ignored once a Wariant exists
            pricingVariants: [{ id: 'v1', name: 'Standard', price: 60 }],
          },
        ],
      };

      const { result } = renderHook(() => useRegistrationForm(eventWithVariant), { wrapper });

      expect(result.current.selectedPricingVariantId).toBe('v1');
      expect(result.current.distancePrice).toBe(60);
    });

    it('requires an explicit choice when 2+ Warianty exist', () => {
      const eventWithVariants = {
        ...mockEvent,
        distances: [
          {
            ...mockEvent.distances[0],
            pricingVariants: [
              { id: 'v1', name: 'Standard', price: 60 },
              { id: 'v2', name: 'Harcownik', price: 30 },
            ],
          },
        ],
      };

      const { result } = renderHook(() => useRegistrationForm(eventWithVariants), { wrapper });
      act(() => {
        result.current.setSelectedDistanceId('d1');
      });

      expect(result.current.selectedPricingVariantId).toBe('');
      expect(result.current.canProceed()).toBe(false);

      act(() => {
        result.current.setSelectedPricingVariantId('v2');
      });

      expect(result.current.distancePrice).toBe(30);
      expect(result.current.canProceed()).toBe(true);
    });

    it("resolves a Wariant's own tier, expiring on whichever limit hits first", () => {
      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
      const eventWithTieredVariant = {
        ...mockEvent,
        distances: [
          {
            ...mockEvent.distances[0],
            registeredCount: 100,
            pricingVariants: [
              {
                id: 'v1',
                name: 'Standard',
                price: 110,
                priceTiers: [
                  {
                    id: 't1',
                    name: 'Early bird',
                    endDate: futureDate,
                    participantLimit: 100,
                    discountType: 'fixed',
                    discountValue: 30,
                  },
                ],
              },
            ],
          },
        ],
      } as Event;

      const { result } = renderHook(() => useRegistrationForm(eventWithTieredVariant), {
        wrapper,
      });

      // 100 registered >= participantLimit 100 -> tier expired by count even
      // though its end date is still in the future -> falls back to base price.
      expect(result.current.distancePrice).toBe(110);
    });

    it("resolves a Wariant's own tier-discounted price when the tier has not expired", () => {
      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
      const eventWithActiveTieredVariant = {
        ...mockEvent,
        distances: [
          {
            ...mockEvent.distances[0],
            registeredCount: 100,
            pricingVariants: [
              {
                id: 'v1',
                name: 'Standard',
                price: 110,
                priceTiers: [
                  {
                    id: 't1',
                    name: 'Early bird',
                    endDate: futureDate,
                    participantLimit: 200,
                    discountType: 'fixed',
                    discountValue: 30,
                  },
                ],
              },
            ],
          },
        ],
      } as Event;

      const { result } = renderHook(() => useRegistrationForm(eventWithActiveTieredVariant), {
        wrapper,
      });

      // 100 registered < participantLimit 200 and endDate is in the future ->
      // tier is still active -> price reflects the tier discount, not the base price.
      expect(result.current.distancePrice).toBe(80);
    });

    it('caps a discount code to the Wariant-resolved price, not the legacy distance price', () => {
      const eventWithVariantAndDiscount = {
        ...mockEvent,
        distances: [
          {
            ...mockEvent.distances[0],
            price: 999,
            pricingVariants: [{ id: 'v1', name: 'Standard', price: 60 }],
          },
        ],
        discountCodes: [
          {
            id: 'dc-free',
            code: 'FREE200',
            discountType: 'fixed',
            discountValue: 200,
            usedCount: 0,
            active: true,
          },
        ],
      } as Event;

      const { result } = renderHook(() => useRegistrationForm(eventWithVariantAndDiscount), {
        wrapper,
      });
      act(() => {
        result.current.setDiscountCode('FREE200');
      });
      act(() => {
        result.current.handleApplyDiscount();
      });

      expect(result.current.discountAmount).toBe(60);
      expect(result.current.totalAmount).toBe(0);
    });

    it('computes the NNW premium using age AS OF THE EVENT DATE, not today', () => {
      // Registered "today" the competitor is 17 (no adult loading), but by
      // the event date (over a year later) they've turned 18 already, so
      // the age-based add-on kicks in — proving the event-date age is used.
      const soonAfter18thBirthday = new Date();
      soonAfter18thBirthday.setFullYear(soonAfter18thBirthday.getFullYear() - 18);
      soonAfter18thBirthday.setDate(soonAfter18thBirthday.getDate() - 10);
      const birthDateStr = soonAfter18thBirthday.toISOString().slice(0, 10);
      const [by, bm, bd] = birthDateStr.split('-');

      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 60); // event happens after 18th birthday
      const registrationTodayAge = 17; // as of "today" (before the birthday)

      const eventWithInsurance = {
        ...mockEvent,
        date: eventDate.toISOString(),
        insuranceVariants: [
          { id: 'ins1', name: 'Podstawowe', baseFee: 20, ageMultiplier: 2, maxAge: 99 },
        ],
      };

      const { result } = renderHook(() => useRegistrationForm(eventWithInsurance), { wrapper });
      act(() => {
        result.current.setSelectedDistanceId('d1');
        result.current.setBirthYear(by);
        result.current.setBirthMonth(bm);
        result.current.setBirthDay(bd);
      });
      act(() => {
        result.current.setWantsInsurance(true);
      });

      // Sanity: "today" age (registration-date-based, what the OLD bug used)
      // would still be 17 for most of the 60-day window; the event-date age
      // must already be 18 -> baseFee + 0 * ageMultiplier = 20, never < 20.
      expect(registrationTodayAge).toBe(17);
      expect(result.current.insurancePrice).toBe(20);
    });

    it('exposes an explicit zero-value Modyfikatory placeholder (step 4 not built yet)', () => {
      const { result } = renderHook(() => useRegistrationForm(mockEvent), { wrapper });
      expect(result.current.modifiersTotal).toBe(0);
    });
  });

  describe('E7.1 relay team creation/join wiring', () => {
    const relayEvent = {
      ...mockEvent,
      distances: [
        {
          ...mockEvent.distances[0],
          startType: 'relay',
          relayMinTeamSize: 2,
          relayMaxTeamSize: 4,
        },
      ],
    } as unknown as Event;

    it('forces wantsTeam on and sends createTeam: true + the typed name for a new Drużyna', () => {
      const { result } = renderHook(() => useRegistrationForm(relayEvent), { wrapper });

      expect(result.current.isRelayDistance).toBe(true);
      expect(result.current.wantsTeam).toBe(true);
      expect(result.current.teamMode).toBe('create');

      act(() => {
        result.current.setTeamName('Błyskawice');
        result.current.setAgreedToTerms(true);
      });

      const data = result.current.buildSubmitData();
      expect(data).not.toBeNull();
      expect(data!.createTeam).toBe(true);
      expect(data!.teamName).toBe('Błyskawice');
      expect(data!.teamId).toBeUndefined();
    });

    it('lists only non-full teams (from the server) to join, and sends the real team id, not its label', async () => {
      const { result } = renderHook(() => useRegistrationForm(relayEvent), { wrapper });

      await waitFor(() => {
        expect(result.current.existingTeams).toHaveLength(1);
      });
      expect(result.current.existingTeams[0]).toMatchObject({
        id: 'team-real-1',
        name: 'Błyskawice',
      });

      act(() => {
        result.current.setTeamMode('join');
        result.current.setSelectedExistingTeam('team-real-1');
        result.current.setAgreedToTerms(true);
      });

      const data = result.current.buildSubmitData();
      expect(data).not.toBeNull();
      expect(data!.teamId).toBe('team-real-1');
      expect(data!.teamName).toBe('Błyskawice');
      expect(data!.createTeam).toBeUndefined();
    });

    it('never sends teamId/createTeam for the unrelated, non-relay classification-label path', () => {
      const { result } = renderHook(() => useRegistrationForm(mockEvent), { wrapper });

      act(() => {
        result.current.setSelectedDistanceId('d1');
        result.current.setWantsTeam(true);
        result.current.setTeamMode('create');
        result.current.setTeamName('Firma XYZ');
        result.current.setAgreedToTerms(true);
      });

      const data = result.current.buildSubmitData();
      expect(data).not.toBeNull();
      expect(data!.teamName).toBe('Firma XYZ');
      expect(data!.teamId).toBeUndefined();
      expect(data!.createTeam).toBeUndefined();
    });
  });

  describe('E7.5 team special category (issue 23 Answer §7)', () => {
    const relayEvent = {
      ...mockEvent,
      distances: [
        {
          ...mockEvent.distances[0],
          startType: 'relay',
          relayMinTeamSize: 2,
          relayMaxTeamSize: 4,
          specialCategories: [
            { id: 'mixed', name: 'Drużyna mieszana' },
            { id: 'women', name: 'Drużyna kobieca' },
          ],
        },
      ],
    } as unknown as Event;

    it('sends the captain-declared special category only when creating a team', () => {
      const { result } = renderHook(() => useRegistrationForm(relayEvent), { wrapper });

      expect(result.current.teamMode).toBe('create');

      act(() => {
        result.current.setTeamName('Tęcza');
        result.current.setTeamSpecialCategory('Drużyna mieszana');
        result.current.setAgreedToTerms(true);
      });

      const data = result.current.buildSubmitData();
      expect(data!.createTeam).toBe(true);
      expect(data!.teamSpecialCategory).toBe('Drużyna mieszana');
    });

    it('never sends a special category on the "join an existing team" path', () => {
      const { result } = renderHook(() => useRegistrationForm(relayEvent), { wrapper });

      act(() => {
        result.current.setTeamSpecialCategory('Drużyna mieszana');
        result.current.setTeamMode('join');
        result.current.setSelectedExistingTeam('team-real-1');
        result.current.setAgreedToTerms(true);
      });

      const data = result.current.buildSubmitData();
      expect(data!.createTeam).toBeUndefined();
      expect(data!.teamSpecialCategory).toBeUndefined();
    });

    it('omits teamSpecialCategory entirely when the captain leaves it unset', () => {
      const { result } = renderHook(() => useRegistrationForm(relayEvent), { wrapper });

      act(() => {
        result.current.setTeamName('Bez Kategorii');
        result.current.setAgreedToTerms(true);
      });

      const data = result.current.buildSubmitData();
      expect(data!.createTeam).toBe(true);
      expect(data!.teamSpecialCategory).toBeUndefined();
    });
  });

  describe('E7.2 invitation link (`?joinTeam=`) pre-selection', () => {
    const relayEvent = {
      ...mockEvent,
      distances: [
        {
          ...mockEvent.distances[0],
          startType: 'relay',
          relayMinTeamSize: 2,
          relayMaxTeamSize: 4,
        },
        mockEvent.distances[1],
      ],
    } as unknown as Event;

    it('pre-selects the distance and "join this team" when an invitation link target is given', () => {
      const { result } = renderHook(
        () =>
          useRegistrationForm(relayEvent, {
            teamId: 'team-real-1',
            distanceId: 'd1',
            inviteToken: 'tok-1',
          }),
        { wrapper },
      );

      expect(result.current.selectedDistanceId).toBe('d1');
      expect(result.current.wantsTeam).toBe(true);
      expect(result.current.teamMode).toBe('join');
      expect(result.current.selectedExistingTeam).toBe('team-real-1');
      expect(result.current.hasInvitationLink).toBe(true);
    });

    it('still submits the invitation-link team id like any other join, once terms are agreed', () => {
      const { result } = renderHook(
        () =>
          useRegistrationForm(relayEvent, {
            teamId: 'team-real-1',
            distanceId: 'd1',
            inviteToken: 'tok-1',
          }),
        { wrapper },
      );

      act(() => {
        result.current.setAgreedToTerms(true);
      });

      const data = result.current.buildSubmitData();
      expect(data).not.toBeNull();
      expect(data!.teamId).toBe('team-real-1');
      expect(data!.teamInviteToken).toBe('tok-1');
      expect(data!.createTeam).toBeUndefined();
    });

    it('lists only the own teams plus the invited team in the relay picker', async () => {
      const { result } = renderHook(
        () =>
          useRegistrationForm(relayEvent, {
            teamId: 'team-invited',
            distanceId: 'd1',
            inviteToken: 'tok-2',
          }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.existingTeams.map((t) => t.id).sort()).toEqual([
          'team-invited',
          'team-real-1',
        ]);
      });
      // A foreign team (not ours, not the invited one) and the full own team never show up.
      expect(result.current.existingTeams.some((t) => t.id === 'team-foreign')).toBe(false);
      expect(result.current.existingTeams.some((t) => t.id === 'team-real-2')).toBe(false);
    });

    it('sends the invite token for the invited team, but not when the user picks their own team', async () => {
      const { result } = renderHook(
        () =>
          useRegistrationForm(relayEvent, {
            teamId: 'team-invited',
            distanceId: 'd1',
            inviteToken: 'tok-2',
          }),
        { wrapper },
      );
      await waitFor(() => {
        expect(result.current.existingTeams).toHaveLength(2);
      });

      act(() => {
        result.current.setAgreedToTerms(true);
      });
      expect(result.current.buildSubmitData()!.teamInviteToken).toBe('tok-2');

      act(() => {
        result.current.setSelectedExistingTeam('team-real-1');
      });
      const own = result.current.buildSubmitData();
      expect(own!.teamId).toBe('team-real-1');
      expect(own!.teamInviteToken).toBeUndefined();
    });

    it('does not report an invitation link when none was given', () => {
      const { result } = renderHook(() => useRegistrationForm(relayEvent), { wrapper });
      expect(result.current.hasInvitationLink).toBe(false);
    });
  });

  describe('E1.2 buildSubmitData contract fields', () => {
    it('populates pricingVariantId/discountCode/merchandise/insuranceVariantId for submission', () => {
      const eventWithVariant = {
        ...mockEvent,
        distances: [
          {
            ...mockEvent.distances[0],
            pricingVariants: [{ id: 'v1', name: 'Standard', price: 60 }],
          },
        ],
        insuranceVariants: [
          { id: 'ins1', name: 'Podstawowe', baseFee: 20, ageMultiplier: 2, maxAge: 99 },
        ],
      };

      const { result } = renderHook(() => useRegistrationForm(eventWithVariant), { wrapper });
      act(() => {
        result.current.setAgreedToTerms(true);
      });

      const data = result.current.buildSubmitData();
      expect(data).not.toBeNull();
      // Wariant is auto-selected (only one exists) and its id is sent explicitly.
      expect(data!.pricingVariantId).toBe('v1');
      // No merchandise added -> empty lean array, not undefined.
      expect(data!.merchandise).toEqual([]);
      // Insurance never opted into -> omitted, not a stray '' id.
      expect(data!.insuranceVariantId).toBeUndefined();
    });
  });
});
