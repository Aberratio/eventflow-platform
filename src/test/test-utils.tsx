import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllProviders, ...options });

/**
 * The QueryClient above is a module-level singleton shared by every render()
 * within a test file (vitest isolates modules per file, not per test), so a
 * static queryKey used across multiple tests in the same file/describe block
 * will serve cached data from an earlier test instead of hitting the mock
 * again. Call this in beforeEach for any test file exercising a component
 * with a fixed (non-parameterized) queryKey.
 */
export const resetQueryClient = () => queryClient.clear();

export * from '@testing-library/react';
export { customRender as render };
