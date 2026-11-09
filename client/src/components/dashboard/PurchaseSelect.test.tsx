import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import PurchaseSelect from './PurchaseSelect';

afterEach(cleanup);

function Filter() {
  const [country, setCountry] = useState('');
  return <><label htmlFor="country-filter">Country</label><PurchaseSelect id="country-filter" value={country} onValueChange={setCountry} emptyLabel="Any country" options={[{ value: 'US', label: 'United States' }, { value: 'CA', label: 'Canada' }]} /><output aria-label="Selected filter">{country || 'No filter'}</output></>;
}

it('allows choosing and clearing a filter through the shadcn options', async () => {
  render(<Filter />);
  const trigger = screen.getByRole('combobox', { name: 'Country' });
  expect(trigger).toHaveTextContent('Any country');
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('option', { name: 'Canada' }));
  expect(screen.getByLabelText('Selected filter')).toHaveTextContent('CA');
  expect(trigger).toHaveTextContent('Canada');
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('option', { name: 'Any country' }));
  expect(screen.getByLabelText('Selected filter')).toHaveTextContent('No filter');
});

it('shows the placeholder and prevents opening an unavailable selection', () => {
  render(<><label htmlFor="os-choice">Operating system</label><PurchaseSelect id="os-choice" value="" onValueChange={() => {}} options={[]} placeholder="No operating systems available" disabled /></>);
  const trigger = screen.getByRole('combobox', { name: 'Operating system' });
  expect(trigger).toHaveTextContent('No operating systems available');
  expect(trigger).toBeDisabled();
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});
