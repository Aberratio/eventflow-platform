import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { useIsMobile } from '@/hooks/use-mobile';

function mockViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  let changeHandler: (() => void) | null = null;
  const mql = {
    matches: width < 768,
    media: `(max-width: 767px)`,
    addEventListener: vi.fn((_event: string, handler: () => void) => {
      changeHandler = handler;
    }),
    removeEventListener: vi.fn(),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql);

  return {
    triggerChange: (newWidth: number) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: newWidth,
      });
      changeHandler?.();
    },
  };
}

describe('useIsMobile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports false for a desktop viewport width', () => {
    mockViewport(1280);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('reports true for a mobile viewport width', () => {
    mockViewport(375);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('updates when the viewport crosses the breakpoint', () => {
    const { triggerChange } = mockViewport(1280);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      triggerChange(500);
    });
    expect(result.current).toBe(true);
  });

  it('registers and cleans up the matchMedia listener', () => {
    mockViewport(1024);
    const { unmount } = renderHook(() => useIsMobile());
    const mql = (window.matchMedia as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
