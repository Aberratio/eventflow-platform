import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityLogsSection } from '../ActivityLogsSection';
import type { AdminActivityLog } from '@/types';

// Regression test: `queryFn: getActivityLogs` used to pass react-query's
// QueryFunctionContext straight through as the (unused) filters argument at
// runtime, and the resulting `unknown`-typed response would throw on the
// following `.filter` calls, crashing this panel. The fix wraps it as
// `() => getActivityLogs()`. This asserts the API is called with no stray
// argument and that the resolved logs actually render.

const getActivityLogs = vi.fn();

vi.mock('@/api', () => ({
  getActivityLogs: (...args: unknown[]) => getActivityLogs(...args),
}));

const logs: AdminActivityLog[] = [
  {
    id: 'log-1',
    userId: 'user-1',
    action: 'login',
    description: 'Zalogowano do panelu',
    targetName: 'Jan Kowalski',
    timestamp: '2026-01-15T10:00:00.000Z',
  },
];

const renderSection = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ActivityLogsSection />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ActivityLogsSection', () => {
  it('calls getActivityLogs with no arguments and renders the resolved logs', async () => {
    getActivityLogs.mockResolvedValue({ data: logs });

    renderSection();

    expect(await screen.findByText('Zalogowano do panelu')).toBeInTheDocument();
    expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
    expect(getActivityLogs).toHaveBeenCalledTimes(1);
    expect(getActivityLogs).toHaveBeenCalledWith();
  });
});
