import { describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import { ApiRequestError } from '@/api/errors';
import { RegistrationActionDialog } from '../RegistrationActionDialog';
import { apiErrorMessage, useRegistrationAction } from '../useRegistrationAction';

describe('apiErrorMessage', () => {
  it('uses the server message for API errors and the fallback otherwise', () => {
    expect(apiErrorMessage(new ApiRequestError('Brak miejsc', 'FULL', 409), 'Fallback')).toBe(
      'Brak miejsc',
    );
    expect(apiErrorMessage(new Error('boom'), 'Fallback')).toBe('Fallback');
  });
});

describe('useRegistrationAction', () => {
  it('is pending while the task runs and blocks closing, then releases', async () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() => useRegistrationAction(onOpenChange));
    let finish!: () => void;
    const task = () => new Promise<void>((resolve) => (finish = resolve));

    let promise!: Promise<void>;
    act(() => {
      promise = result.current.run(task, vi.fn());
    });
    expect(result.current.pending).toBe(true);
    result.current.guardOpenChange(false);
    expect(onOpenChange).not.toHaveBeenCalled();

    await act(async () => {
      finish();
      await promise;
    });
    expect(result.current.pending).toBe(false);
    result.current.guardOpenChange(false);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('routes a failure to onError and clears pending', async () => {
    const { result } = renderHook(() => useRegistrationAction(vi.fn()));
    const onError = vi.fn();
    const error = new Error('nope');

    await act(async () => {
      await result.current.run(() => Promise.reject(error), onError);
    });
    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.pending).toBe(false);
  });
});

describe('RegistrationActionDialog', () => {
  it('renders title, description, body and footer when open', () => {
    render(
      <RegistrationActionDialog
        open
        onOpenChange={vi.fn()}
        title="Tytuł"
        description="Opis"
        footer={<button>Zatwierdź</button>}
      >
        <p>Treść</p>
      </RegistrationActionDialog>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Tytuł')).toBeInTheDocument();
    expect(screen.getByText('Opis')).toBeInTheDocument();
    expect(screen.getByText('Treść')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zatwierdź' })).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    render(
      <RegistrationActionDialog
        open={false}
        onOpenChange={vi.fn()}
        title="Tytuł"
        description="Opis"
        footer={null}
      >
        <p>Treść</p>
      </RegistrationActionDialog>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
