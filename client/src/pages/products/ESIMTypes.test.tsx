import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ESIMTypes from './ESIMTypes';
import { useEsimCatalog, useESIMPackages } from '@/hooks/useESIMPackages';

vi.mock('@/hooks/useESIMPackages', async importOriginal => ({
  ...await importOriginal<typeof import('@/hooks/useESIMPackages')>(),
  useEsimCatalog: vi.fn(), useESIMPackages: vi.fn(),
}));
const refetch = vi.fn();
function show(props = {}) { return render(<MemoryRouter initialEntries={['/dashboard/esim']}><ESIMTypes {...props} /></MemoryRouter>); }
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useEsimCatalog).mockReturnValue({ data: [], isLoading: false, isError: false, isFetching: false, refetch } as never);
  vi.mocked(useESIMPackages).mockReturnValue({ packages: [], loading: false } as never);
});
afterEach(cleanup);

it('routes each service to its existing catalog and preserves access to purchased eSIMs', () => {
  show();
  expect(screen.getByRole('link', { name: 'Browse phone-number plans' })).toHaveAttribute('href', '/dashboard/phone-esim');
  expect(screen.getByRole('link', { name: 'Browse data plans' })).toHaveAttribute('href', '/dashboard/global-esim');
  expect(screen.getByRole('link', { name: 'My eSIMs' })).toHaveAttribute('href', '/dashboard/Esim-management');
  expect(screen.getByText(/Your phone must be unlocked/)).toBeInTheDocument();
});

it('uses the navigation callbacks in embedded reseller and admin flows', () => {
  const onNavigateUSA = vi.fn();
  const onNavigateGlobal = vi.fn();
  show({ onNavigateUSA, onNavigateGlobal });
  fireEvent.click(screen.getByRole('button', { name: 'Browse phone-number plans' }));
  fireEvent.click(screen.getByRole('button', { name: 'Browse data plans' }));
  expect(onNavigateUSA).toHaveBeenCalledOnce();
  expect(onNavigateGlobal).toHaveBeenCalledOnce();
});

it('shows unavailable figures and a retry when the catalog fails', () => {
  vi.mocked(useEsimCatalog).mockReturnValue({ data: [], isLoading: false, isError: true, isFetching: false, refetch } as never);
  show();
  expect(screen.getByRole('alert')).toHaveTextContent('We couldn’t load eSIM availability.');
  expect(screen.getAllByText('Unavailable')).toHaveLength(6);
  expect(screen.queryByText('0')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(refetch).toHaveBeenCalledOnce();
});

it('keeps loading distinct from empty inventory', () => {
  vi.mocked(useEsimCatalog).mockReturnValue({ data: [], isLoading: true, isError: false, isFetching: true, refetch } as never);
  show();
  expect(screen.getAllByText('Loading…')).toHaveLength(6);
  expect(screen.queryByText('Not available')).not.toBeInTheDocument();
});
