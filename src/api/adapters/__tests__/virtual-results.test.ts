import { afterEach, describe, expect, it } from 'vitest';
import { mockAdapter } from '../mock.adapter';
import { mockVirtualResultSubmissions } from '../../mock/virtual-results.mock';

const TEST_PREFIX = 'virtual-test-';

describe('mockAdapter virtual results', () => {
  afterEach(() => {
    for (let index = mockVirtualResultSubmissions.length - 1; index >= 0; index -= 1) {
      if (mockVirtualResultSubmissions[index].id.startsWith(TEST_PREFIX)) {
        mockVirtualResultSubmissions.splice(index, 1);
      }
    }
  });

  it('stores submitted virtual result as pending and returns it in filtered list', async () => {
    const submission = await mockAdapter.submitVirtualResult({
      id: `${TEST_PREFIX}pending`,
      eventId: `${TEST_PREFIX}event`,
      eventName: 'Virtual Test Event',
      distanceId: `${TEST_PREFIX}10k`,
      distanceName: '10 km',
      userId: `${TEST_PREFIX}user`,
      userName: 'Virtual Runner',
      userEmail: 'runner@example.test',
      submittedTime: '00:45:12',
      submittedTimeInSeconds: 2712,
    });

    expect(submission.success).toBe(true);
    expect(submission.data.status).toBe('pending');

    const filtered = await mockAdapter.getVirtualResultSubmissions({
      eventId: `${TEST_PREFIX}event`,
      status: 'pending',
    });

    expect(filtered.data.map((item) => item.id)).toContain(`${TEST_PREFIX}pending`);
  });

  it('updates submission status during review', async () => {
    mockVirtualResultSubmissions.unshift({
      id: `${TEST_PREFIX}review`,
      eventId: `${TEST_PREFIX}event`,
      eventName: 'Virtual Test Event',
      distanceId: `${TEST_PREFIX}10k`,
      distanceName: '10 km',
      userId: `${TEST_PREFIX}user`,
      userName: 'Virtual Runner',
      userEmail: 'runner@example.test',
      submittedTime: '00:50:00',
      submittedTimeInSeconds: 3000,
      submittedAt: '2026-06-21T08:00:00Z',
      status: 'pending',
    });

    const reviewed = await mockAdapter.reviewVirtualResult(
      `${TEST_PREFIX}review`,
      'rejected',
      'Brak dowodu',
    );

    expect(reviewed.success).toBe(true);
    expect(reviewed.data.status).toBe('rejected');
    expect(reviewed.data.rejectionReason).toBe('Brak dowodu');
    expect(reviewed.data.reviewedAt).toBeTruthy();
    expect(
      mockVirtualResultSubmissions.find((item) => item.id === `${TEST_PREFIX}review`)?.status,
    ).toBe('rejected');
  });
});
