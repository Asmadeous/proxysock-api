import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import api from "../../services/api";
import PhoneESIMCountries from "./PhoneESIMCountries";

vi.mock("../../services/api", () => ({ default: { get: vi.fn() } }));

const line = { id: "us-1", provider: "meisim", currency: "USD", meisim_line: "us_prepaid", requires_imei: true, validity_days: 30 };
const products = [
  { ...line, name: "AT&T Prepaid · Unlimited Saver", price: "53.04", network: "AT&T Prepaid" },
  { ...line, id: "us-2", name: "Moxee 2 Prepaid · 100 SMS Only", price: "9.84", network: "Moxee 2" },
  { ...line, id: "uk-1", name: "O2 UK · 8GB + EU Roaming", price: "14.87", network: "O2 UK", meisim_line: "uk_prepaid",
    number_country: "GB", data_limit: "8GB UK · 8GB roaming", requires_imei: false },
  { ...line, id: "fr-1", name: "France 2 GB", price: "3.99", network: "Orange", meisim_line: "travel" },
];

beforeEach(() => vi.mocked(api.get).mockResolvedValue({ data: { products } }));
afterEach(cleanup);

it("shows a USA and a UK card with what each country offers, and no plans", async () => {
  render(<MemoryRouter><PhoneESIMCountries /></MemoryRouter>);

  const usa = await screen.findByRole("link", { name: /USA phone number/ });
  const uk = screen.getByRole("link", { name: /UK phone number/ });
  expect(await within(usa).findByText("2 plans")).toBeInTheDocument();
  expect(within(usa).getByText("from $9.84")).toBeInTheDocument();
  expect(within(usa).getByText("AT&T")).toBeInTheDocument();
  expect(within(usa).getByText("Moxee 2")).toBeInTheDocument();
  expect(within(uk).getByText("1 plan")).toBeInTheDocument();
  expect(within(uk).getByText("O2 UK")).toBeInTheDocument();
  expect(usa).toHaveAttribute("href", "/dashboard/usa-esim");
  expect(uk).toHaveAttribute("href", "/dashboard/uk-esim");
  expect(screen.queryByRole("article")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to eSIM services" })).toHaveAttribute("href", "/dashboard/esim");
});

it("hands the chosen country to reseller and admin views", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<MemoryRouter><PhoneESIMCountries onSelect={onSelect} /></MemoryRouter>);

  await user.click(await screen.findByRole("button", { name: /UK phone number/ }));
  expect(onSelect).toHaveBeenCalledWith("GB");
  const onBack = vi.fn();
  cleanup();
  render(<MemoryRouter><PhoneESIMCountries onSelect={onSelect} onBack={onBack} /></MemoryRouter>);
  await user.click(screen.getByRole("button", { name: "Back to eSIM services" }));
  expect(onBack).toHaveBeenCalled();
});
