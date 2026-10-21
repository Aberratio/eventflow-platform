import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminProductEditPage } from '../AdminProductEditPage';
import { toast } from 'sonner';

// This is the only place an admin can create/edit a shop product,
// including its size/color variants. These tests exercise the real
// create/update calls and the client-side validation that mirrors the
// server's required-field check, so a regression here would either let bad
// data through or silently fail to build the right payload.

const mockCreateProduct = vi.fn().mockResolvedValue({ data: { id: 'new-1' } });
const mockUpdateProduct = vi.fn().mockResolvedValue({ data: { id: 'p1' } });

const { existingProduct } = vi.hoisted(() => ({
  existingProduct: {
    id: 'p1',
    name: 'Koszulka biegowa',
    slug: 'koszulka-biegowa',
    description: 'Opis',
    price: 99,
    category: 'apparel',
    brand: 'Marka',
    imageUrl: '/shirt.jpg',
    inStock: true,
    status: 'active' as const,
    sizes: ['M'],
    colors: [],
  },
}));

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getShopCategories: vi.fn().mockResolvedValue({
      data: [{ id: 'apparel', name: 'Odzież', sortOrder: 1 }],
    }),
    getProductById: vi.fn().mockResolvedValue({ data: existingProduct }),
    createProduct: (...args: unknown[]) => mockCreateProduct(...args),
    updateProduct: (...args: unknown[]) => mockUpdateProduct(...args),
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const renderNew = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/shop/products/new']}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/shop/products/new" element={<AdminProductEditPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const renderEdit = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/shop/products/p1/edit']}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/shop/products/:id/edit" element={<AdminProductEditPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('AdminProductEditPage validation', () => {
  beforeEach(() => {
    mockCreateProduct.mockClear();
    mockUpdateProduct.mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('blocks submission and shows an error when required fields are missing', async () => {
    const user = userEvent.setup();
    renderNew();

    await screen.findByText('Nowy produkt');
    await user.click(screen.getByRole('button', { name: /Zapisz/ }));

    expect(mockCreateProduct).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('submits a create request once all required fields are filled', async () => {
    // Typing across five fields with userEvent is comfortably under 2s in
    // isolation but can brush against the 5s default when the whole suite
    // runs in parallel under CPU contention.
    const user = userEvent.setup();
    renderNew();

    await screen.findByText('Nowy produkt');
    await user.type(screen.getByLabelText('Nazwa'), 'Nowa koszulka');
    await user.clear(screen.getByLabelText('Marka'));
    await user.type(screen.getByLabelText('Marka'), 'Marka');
    await user.type(screen.getByLabelText('Opis'), 'Opis produktu');
    await user.type(screen.getByLabelText('URL głównego obrazu'), 'https://example.test/x.jpg');
    await user.clear(screen.getByLabelText('Cena'));
    await user.type(screen.getByLabelText('Cena'), '150');

    await user.click(screen.getByRole('button', { name: /Zapisz/ }));

    await waitFor(() => expect(mockCreateProduct).toHaveBeenCalledTimes(1));
    const payload = mockCreateProduct.mock.calls[0][0];
    expect(payload).toMatchObject({
      name: 'Nowa koszulka',
      brand: 'Marka',
      description: 'Opis produktu',
      imageUrl: 'https://example.test/x.jpg',
      price: 150,
      category: 'apparel',
    });
  }, 15000);

  it('rejects a negative price', async () => {
    const user = userEvent.setup();
    renderNew();

    await screen.findByText('Nowy produkt');
    await user.type(screen.getByLabelText('Nazwa'), 'Nowa koszulka');
    await user.clear(screen.getByLabelText('Marka'));
    await user.type(screen.getByLabelText('Marka'), 'Marka');
    await user.type(screen.getByLabelText('Opis'), 'Opis produktu');
    await user.type(screen.getByLabelText('URL głównego obrazu'), 'https://example.test/x.jpg');
    fireEvent.change(screen.getByLabelText('Cena'), { target: { value: '-10' } });

    await user.click(screen.getByRole('button', { name: /Zapisz/ }));

    expect(mockCreateProduct).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('ujemna'));
  }, 15000);
});

describe('AdminProductEditPage variant editing', () => {
  beforeEach(() => {
    mockCreateProduct.mockClear();
    mockUpdateProduct.mockClear();
  });

  it('loads the existing product sizes and toggling a size updates the update payload', async () => {
    const user = userEvent.setup();
    renderEdit();

    await screen.findByText('Edycja produktu');
    const sizeM = await screen.findByLabelText('M');
    expect(sizeM).toBeChecked();

    await user.click(screen.getByLabelText('L'));
    await user.click(screen.getByRole('button', { name: /Zapisz/ }));

    await waitFor(() => expect(mockUpdateProduct).toHaveBeenCalledTimes(1));
    const [, payload] = mockUpdateProduct.mock.calls[0];
    expect(payload.sizes).toEqual(expect.arrayContaining(['M', 'L']));
  });

  it('adds a color and includes it in the saved payload', async () => {
    const user = userEvent.setup();
    renderEdit();

    await screen.findByText('Edycja produktu');
    await user.type(screen.getByPlaceholderText('Nazwa koloru'), 'Niebieski');
    await user.click(screen.getByRole('button', { name: 'Dodaj kolor' }));

    expect(screen.getByText('Niebieski')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Zapisz/ }));

    await waitFor(() => expect(mockUpdateProduct).toHaveBeenCalledTimes(1));
    const [, payload] = mockUpdateProduct.mock.calls[0];
    expect(payload.colors).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Niebieski' })]),
    );
  });

  it('removes a color when its remove button is clicked', async () => {
    const user = userEvent.setup();
    renderEdit();

    await screen.findByText('Edycja produktu');
    await user.type(screen.getByPlaceholderText('Nazwa koloru'), 'Zielony');
    await user.click(screen.getByRole('button', { name: 'Dodaj kolor' }));
    expect(screen.getByText('Zielony')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Usuń kolor Zielony' }));
    expect(screen.queryByText('Zielony')).not.toBeInTheDocument();
  });
});
