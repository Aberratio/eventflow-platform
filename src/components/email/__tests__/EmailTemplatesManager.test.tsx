import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@/test/test-utils';

const api = vi.hoisted(() => ({
  getMailTemplates: vi.fn(),
  saveMailTemplate: vi.fn(),
  resetMailTemplate: vi.fn(),
  previewMailTemplate: vi.fn(),
  getMailLog: vi.fn(),
}));
vi.mock('@/api', () => api);
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { EmailTemplatesManager } from '../EmailTemplatesManager';

const template = (over: Record<string, unknown>) => ({
  mailType: 'payment_confirmed',
  overridable: true,
  subject: 'Temat',
  bodyHtml: '<p>x</p>',
  version: 1,
  source: 'global',
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  api.getMailTemplates.mockResolvedValue({
    success: true,
    data: [
      template({}),
      template({ mailType: 'password_reset', overridable: false, subject: 'Reset' }),
      template({ mailType: 'event_changed', source: 'event_override', subject: 'Zmiana' }),
    ],
  });
  api.previewMailTemplate.mockResolvedValue({
    success: true,
    data: { variables: { eventName: 'Bieg', amountDue: '50 zł' }, unknownVariables: [] },
  });
  api.getMailLog.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 25, totalPages: 0 });
});

describe('EmailTemplatesManager (B-03)', () => {
  it('loads the global catalogue for the system scope', async () => {
    render(<EmailTemplatesManager scope="system" />);
    expect(await screen.findByText('Potwierdzenie płatności')).toBeInTheDocument();
    expect(api.getMailTemplates).toHaveBeenCalledWith(undefined);
    // authentication mails are editable globally
    expect(screen.getAllByRole('button', { name: /Edytuj/ })).toHaveLength(3);
  });

  it('locks non-overridable mails in the event scope and offers revert only for overrides', async () => {
    render(<EmailTemplatesManager scope="event" eventId="e1" />);
    expect(await screen.findByText('Reset hasła')).toBeInTheDocument();
    expect(api.getMailTemplates).toHaveBeenCalledWith('e1');
    expect(screen.getByText('Tylko globalnie')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Edytuj/ })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /Przywróć domyślny/ })).toHaveLength(1);
  });

  it('reverts an event override through DELETE and reloads', async () => {
    api.resetMailTemplate.mockResolvedValue({ success: true, data: template({}) });
    render(<EmailTemplatesManager scope="event" eventId="e1" />);
    fireEvent.click(await screen.findByRole('button', { name: /Przywróć domyślny/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Przywróć' }));
    await waitFor(() => expect(api.resetMailTemplate).toHaveBeenCalledWith('event_changed', 'e1'));
    await waitFor(() => expect(api.getMailTemplates).toHaveBeenCalledTimes(2));
  });

  it('edits a template: variables come from the server, preview and save use the draft', async () => {
    api.saveMailTemplate.mockResolvedValue({ success: true, data: template({}) });
    api.previewMailTemplate.mockResolvedValue({
      success: true,
      data: {
        subject: 'Podgląd',
        bodyHtml: '<p>Bieg</p>',
        variables: { eventName: 'Bieg', amountDue: '50 zł' },
        unknownVariables: ['nope'],
      },
    });
    render(<EmailTemplatesManager scope="event" eventId="e1" />);
    fireEvent.click((await screen.findAllByRole('button', { name: /Edytuj/ }))[0]);

    expect(await screen.findByText('{{eventName}}')).toBeInTheDocument();
    expect(screen.getByText('{{amountDue}}')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Temat'), { target: { value: 'Nowy {{eventName}}' } });
    fireEvent.click(screen.getByRole('button', { name: /Podgląd/ }));
    expect(await screen.findByTestId('mail-preview')).toHaveTextContent('Podgląd');
    expect(screen.getByTestId('mail-preview')).toHaveTextContent('{{nope}}');
    expect(api.previewMailTemplate).toHaveBeenLastCalledWith(
      'payment_confirmed',
      { subject: 'Nowy {{eventName}}', bodyHtml: '<p>x</p>' },
      'e1',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
    await waitFor(() =>
      expect(api.saveMailTemplate).toHaveBeenCalledWith(
        'payment_confirmed',
        { subject: 'Nowy {{eventName}}', bodyHtml: '<p>x</p>' },
        'e1',
      ),
    );
  });

  it('shows the server validation error and keeps the dialog open', async () => {
    api.saveMailTemplate.mockRejectedValue(new Error('unknown_variable: nope'));
    render(<EmailTemplatesManager scope="system" />);
    fireEvent.click((await screen.findAllByRole('button', { name: /Edytuj/ }))[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Zapisz' }));
    expect(await screen.findByText('unknown_variable: nope')).toBeInTheDocument();
  });

  it('log tab: paginates and filters through the API', async () => {
    api.getMailLog.mockResolvedValue({
      data: [
        {
          id: 'm1',
          mailType: 'payment_confirmed',
          priority: 'normal',
          recipient: 'j***@example.com',
          subject: 'Bilet',
          eventId: 'e1',
          status: 'sent',
          attempts: 1,
          nextAttemptAt: null,
          createdAt: '2026-09-01T10:00:00+00:00',
          sentToMailerAt: null,
          lastCheckedAt: null,
        },
      ],
      total: 40,
      page: 1,
      pageSize: 25,
      totalPages: 2,
    });
    render(<EmailTemplatesManager scope="event" eventId="e1" />);
    fireEvent.mouseDown(await screen.findByRole('tab', { name: /Dziennik wysyłek/ }), {
      button: 0,
    });
    expect(await screen.findByText('j***@example.com')).toBeInTheDocument();
    expect(api.getMailLog).toHaveBeenLastCalledWith({ page: 1, pageSize: 25 }, 'e1');

    fireEvent.click(screen.getByRole('button', { name: 'Następna' }));
    await waitFor(() =>
      expect(api.getMailLog).toHaveBeenLastCalledWith({ page: 2, pageSize: 25 }, 'e1'),
    );
  });
});
