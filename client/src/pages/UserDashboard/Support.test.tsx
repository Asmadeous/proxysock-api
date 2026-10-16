import { AxiosHeaders } from 'axios';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CustomerTickets from './CustomerTickets';
import SupportChat from './SupportChat';
import SupportHub from './SupportHub';
import api, { createTicket, replyTicket, fetchUserSupportChat, sendUserSupportMessage } from '@/services/api';
vi.mock('@/services/api', () => ({ default: { get: vi.fn() }, createTicket: vi.fn(), replyTicket: vi.fn(), fetchUserSupportChat: vi.fn(), sendUserSupportMessage: vi.fn() }));
vi.mock('@/services/resellerApi', () => ({ fetchSupportChat: vi.fn(), sendSupportMessage: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 9 }, accessToken: 'token' }) }));
vi.mock('@/services/cable', () => ({ getCableConsumer: () => ({ subscriptions: { create: () => ({ unsubscribe: vi.fn() }) } }) }));
const ticket = { id: 7, subject: 'Connection issue', status: 'open', updated_at: '2026-10-01T12:00:00Z' };
const list = { tickets: [ticket], meta: { total_pages: 1, total_count: 1 } };
const response = (data: unknown) => ({ data, status: 200, statusText: 'OK', headers: new AxiosHeaders(), config: { headers: new AxiosHeaders() } });
let client: QueryClient;
function show(component = <CustomerTickets />, path = '/dashboard/tickets') {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } }, logger: { log: console.log, warn: console.warn, error: () => {} } });
  render(<QueryClientProvider client={client}><HelmetProvider><MemoryRouter initialEntries={[path]}>{component}</MemoryRouter></HelmetProvider></QueryClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.get).mockResolvedValue({ data: list });
  vi.mocked(fetchUserSupportChat).mockResolvedValue(response({ chat: { id: 1 }, messages: [] }));
});
afterEach(() => { cleanup(); client.clear(); });

it('creates a ticket with the deposit reference from its support link', async () => {
  vi.mocked(createTicket).mockResolvedValue(response({}));
  show(<CustomerTickets />, '/dashboard/tickets?deposit_id=73&subject=Payment+issue');
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  expect(screen.getByLabelText('Deposit ID')).toHaveValue('73');
  expect(screen.getByLabelText('Subject')).toHaveValue('Payment issue');
  fireEvent.click(screen.getByRole('button', { name: 'Submit ticket' }));
  await waitFor(() => expect(createTicket).toHaveBeenCalledWith({ subject: 'Payment issue', body: 'I need help with my deposit 73.', priority: 'normal', order_id: null, deposit_id: '73' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

it('requires a reference for new tickets and preserves a rejected form', async () => {
  vi.mocked(createTicket).mockRejectedValue({ response: { data: { errors: { order_id: ['is invalid'] } } } });
  show();
  fireEvent.click(screen.getByRole('button', { name: 'New ticket' }));
  fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Help' } });
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Connection failed' } });
  expect(screen.getByRole('button', { name: 'Submit ticket' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Order ID or number'), { target: { value: '123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit ticket' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('order id is invalid');
  expect(screen.getByLabelText('Message')).toHaveValue('Connection failed');
});

it('loads existing messages before replying and keeps the conversation open', async () => {
  vi.mocked(api.get).mockImplementation(async url => ({ data: url === '/web/api/tickets/7' ? { messages: [{ id: 1, body: 'Please check the connection settings.', sender_type: 'Support', created_at: ticket.updated_at }] } : list }));
  vi.mocked(replyTicket).mockResolvedValue(response({}));
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'View ticket 7' }));
  expect(await screen.findByText('Please check the connection settings.')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Your reply'), { target: { value: 'Checked, thank you' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send reply' }));
  await waitFor(() => expect(replyTicket).toHaveBeenCalledWith(7, 'Checked, thank you'));
  await waitFor(() => expect(screen.getByLabelText('Your reply')).toHaveValue(''));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

it('shows ticket loading failures instead of an empty history and retries', async () => {
  vi.mocked(api.get).mockRejectedValueOnce(new Error('offline'));
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t update your tickets.');
  expect(screen.queryByText('No tickets yet')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Connection issue')).toBeInTheDocument();
});

it('restores failed chat drafts and labels the send control', async () => {
  vi.mocked(sendUserSupportMessage).mockRejectedValue(new Error('offline'));
  show(<SupportChat />);
  const input = await screen.findByRole('textbox', { name: 'Message to support' });
  fireEvent.change(input, { target: { value: 'I need help' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  await waitFor(() => expect(sendUserSupportMessage).toHaveBeenCalledWith('I need help'));
  await waitFor(() => expect(input).toHaveValue('I need help'));
  expect(screen.queryByText(/End-To-End encrypted/)).not.toBeInTheDocument();
});

it('opens the tickets tab for a referenced support link', async () => {
  show(<SupportHub />, '/dashboard/support?deposit_id=73');
  expect(await screen.findByLabelText('Deposit ID')).toHaveValue('73');
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.getByRole('button', { name: 'Support tickets' })).toHaveAttribute('aria-pressed', 'true');
});

it('allows retrying a failed chat load without presenting an empty conversation', async () => {
  vi.mocked(fetchUserSupportChat).mockRejectedValueOnce(new Error('offline'));
  show(<SupportChat />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t load your conversation.');
  expect(screen.queryByRole('textbox', { name: 'Message to support' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('textbox', { name: 'Message to support' })).toBeInTheDocument();
});
