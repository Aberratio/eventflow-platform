import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/test-utils';
import { RegistrationForm } from '../RegistrationForm';
import type { Event, MerchandiseOrder } from '@/types';

const submitData = {
  distanceId: 'd1',
  distanceName: '5K',
  category: 'Open',
  price: 80,
  merchandiseOrders: [] as MerchandiseOrder[],
  totalAmount: 80,
};

const formState = {
  user: null,
  step: 6,
  activeSteps: [{ id: 6, name: 'Podsumowanie' }],
  selectedDistanceId: 'd1',
  setSelectedDistanceId: vi.fn(),
  selectedCategory: 'Open',
  setSelectedCategory: vi.fn(),
  birthYear: '1990',
  setBirthYear: vi.fn(),
  birthMonth: '01',
  setBirthMonth: vi.fn(),
  birthDay: '01',
  setBirthDay: vi.fn(),
  wantsInsurance: false,
  setWantsInsurance: vi.fn(),
  merchandiseOrders: new Map<string, MerchandiseOrder>(),
  updateMerchandise: vi.fn(),
  discountCode: '',
  setDiscountCode: vi.fn(),
  appliedDiscount: null,
  discountError: '',
  setDiscountError: vi.fn(),
  handleApplyDiscount: vi.fn(),
  handleRemoveDiscount: vi.fn(),
  agreedToTerms: true,
  setAgreedToTerms: vi.fn(),
  agreedToFinalAcceptance: false,
  setAgreedToFinalAcceptance: vi.fn(),
  wantsTeam: false,
  setWantsTeam: vi.fn(),
  teamMode: 'create',
  setTeamMode: vi.fn(),
  teamName: '',
  setTeamName: vi.fn(),
  selectedExistingTeam: '',
  setSelectedExistingTeam: vi.fn(),
  teamNameError: '',
  existingTeams: [],
  selectedVipId: '',
  setSelectedVipId: vi.fn(),
  vipCustomFieldValue: '',
  setVipCustomFieldValue: vi.fn(),
  isProfileComplete: false,
  selectedDistance: {
    id: 'd1',
    name: '5K',
    length: 5,
    unit: 'km',
    categories: ['Open'],
    registeredCount: 0,
    price: 80,
  },
  formCfg: undefined,
  hasMerchandise: false,
  hasInsurance: false,
  hasTeamOption: false,
  age: 36,
  insurancePrice: 0,
  activeVip: null,
  distancePrice: 80,
  merchandiseTotal: 0,
  discountAmount: 0,
  totalAmount: 80,
  isStepInActiveSteps: (stepId: number) => stepId === 6,
  canProceed: () => true,
  handleNext: vi.fn(),
  handleBack: vi.fn(),
  getFinalTeamName: () => undefined,
  buildSubmitData: () => submitData,
  isLastStep: true,
  isFirstStep: false,
};

vi.mock('@/hooks/useRegistrationForm', () => ({
  useRegistrationForm: () => formState,
}));

const event = {
  id: 'e1',
  name: 'Test Event',
  slug: 'test-event',
  discipline: 'running',
  date: '2026-06-01',
  location: 'Park',
  city: 'Warszawa',
  description: 'Test',
  imageUrl: '/test.jpg',
  distances: [formState.selectedDistance],
  organizerId: 'o1',
  organizerName: 'Organizer',
  publicationStatus: 'draft',
  registrationDeadline: '2026-05-20',
  featured: false,
} as Event;

describe('RegistrationForm preview mode', () => {
  it('keeps real prices but replaces payment CTA with test completion', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(
      <RegistrationForm event={event} onCancel={vi.fn()} onComplete={onComplete} previewMode />,
    );

    expect(screen.getByText('Tryb testowy formularza')).toBeInTheDocument();
    expect(screen.getAllByText('80,00 zł').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Zakończ testowo, bez płatności/i })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /Płacę/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Zakończ testowo, bez płatności/i }));
    expect(onComplete).toHaveBeenCalledWith(submitData);
  });
});
