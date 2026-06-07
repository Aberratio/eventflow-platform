import { afterEach, describe, expect, it } from 'vitest';
import { mockAdapter } from '../mock.adapter';
import { mockEvents } from '../../mock/events.mock';
import type { Event } from '@/types';

const TEST_PREFIX = 'workflow-test-';

function testEvent(overrides: Partial<Event> = {}): Event {
  const id = `${TEST_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    name: 'Workflow Test Event',
    slug: id,
    discipline: 'running',
    date: '2026-09-20',
    location: 'Test Stadium',
    city: 'Warszawa',
    description: 'Test event',
    imageUrl: 'https://example.test/event.jpg',
    distances: [
      {
        id: `${id}-10k`,
        name: '10 km',
        length: 10,
        unit: 'km',
        categories: ['Open'],
        registeredCount: 0,
        price: 100,
      },
    ],
    organizerId: 'o1',
    organizerName: 'Test Organizer',
    status: 'draft',
    registrationDeadline: '2026-09-10',
    featured: false,
    ...overrides,
  };
}

describe('mockAdapter event moderation workflow', () => {
  afterEach(() => {
    for (let index = mockEvents.length - 1; index >= 0; index -= 1) {
      if (mockEvents[index].id.startsWith(TEST_PREFIX)) {
        mockEvents.splice(index, 1);
      }
    }
  });

  it('keeps submitted and approved events hidden until organizer publishes', async () => {
    const event = testEvent();
    mockEvents.push(event);

    const submitted = await mockAdapter.submitEvent(event.id);
    expect(submitted.success).toBe(true);
    expect(submitted.data.status).toBe('awaiting_approval');
    expect(submitted.data.submittedAt).toBeTruthy();

    const publishBeforeApproval = await mockAdapter.publishEvent(event.id);
    expect(publishBeforeApproval.success).toBe(false);

    const approved = await mockAdapter.approveEvent(event.id);
    expect(approved.success).toBe(true);
    expect(approved.data.status).toBe('approved');
    expect(approved.data.approvedAt).toBeTruthy();

    const publicBeforePublish = await mockAdapter.getEvents({ search: event.name });
    expect(publicBeforePublish.data).toHaveLength(0);

    const published = await mockAdapter.publishEvent(event.id);
    expect(published.success).toBe(true);
    expect(published.data.status).toBe('active');
    expect(published.data.publishedAt).toBeTruthy();

    const publicAfterPublish = await mockAdapter.getEvents({ search: event.name });
    expect(publicAfterPublish.data.map((item) => item.id)).toContain(event.id);
  });

  it('rejects only events that were submitted for review', async () => {
    const draft = testEvent({ name: 'Workflow Draft Reject' });
    mockEvents.push(draft);

    const rejectedDraft = await mockAdapter.rejectEvent(draft.id, 'Brakuje danych');
    expect(rejectedDraft.success).toBe(false);

    await mockAdapter.submitEvent(draft.id);
    const rejectedSubmitted = await mockAdapter.rejectEvent(draft.id, 'Brakuje danych');
    expect(rejectedSubmitted.success).toBe(true);
    expect(rejectedSubmitted.data.status).toBe('draft');
    expect(rejectedSubmitted.data.rejectionReason).toBe('Brakuje danych');
  });

  it('does not allow manual status update to active', async () => {
    const event = testEvent({ name: 'Workflow Manual Active' });
    mockEvents.push(event);

    const response = await mockAdapter.updateEventStatus(event.id, 'active');

    expect(response.success).toBe(false);
    expect(mockEvents.find((item) => item.id === event.id)?.status).toBe('draft');
  });
});
