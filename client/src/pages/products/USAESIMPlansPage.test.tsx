import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import api from "../../services/api";
import USAESIMPlansPage from "./USAESIMPlansPage";

vi.mock("../../services/api", () => ({ default: { get: vi.fn() } }));
vi.mock("@/utils/redditPixel", () => ({
  conversionTracker: { trackAddToCart: vi.fn() },
}));

const product = {
  id: 42, name: "USA test plan", provider: "colt", country_code: "US",
  price: 25, currency: "USD", data_gb: 2, duration_days: 30,
  calling_minutes: null, sms_quota: null, features: [], moq: 5,
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.mocked(api.get).mockResolvedValue({ data: { products: [product] } });
});
afterEach(cleanup);

it("keeps cart quantities and other cart items when switching country", async () => {
  const user = userEvent.setup();
  const otherItem = { productType: "vpn", quantity: 1 };
  localStorage.setItem("cartItems", JSON.stringify([otherItem]));
  render(<MemoryRouter><USAESIMPlansPage /></MemoryRouter>);
  await user.click(await screen.findByRole("button", { name: "Add to Cart" }));
  expect(screen.getByText("5 in cart")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Decrease quantity for USA test plan" }));
  expect(screen.getByText("5 in cart")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "UK", exact: true }));
  expect(screen.getByText("UK plans are currently unavailable")).toBeInTheDocument();
  expect(screen.queryByText("USA test plan")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "USA", exact: true }));
  expect(screen.getByText("5 in cart")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Remove from cart" }));
  expect(JSON.parse(localStorage.getItem("cartItems")!)).toEqual([otherItem]);
});

it("sends the original product ID and minimum quantity through direct purchase", async () => {
  const user = userEvent.setup();
  const purchase = vi.fn().mockResolvedValue(undefined);
  render(<MemoryRouter><USAESIMPlansPage isDirectBuy onDirectBuy={purchase} /></MemoryRouter>);
  await user.click(await screen.findByRole("button", { name: "Instantly Provision" }));
  expect(purchase).toHaveBeenCalledWith("42", 5, {});
  expect(localStorage.getItem("cartItems")).toBeNull();
});

it("shows UK records only under the UK selector", async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { products: [
    product, { ...product, id: 43, name: "UK test plan", country_code: "GB" },
  ] } });
  const user = userEvent.setup();
  render(<MemoryRouter><USAESIMPlansPage /></MemoryRouter>);
  await screen.findByText("USA test plan");
  expect(screen.queryByText("UK test plan")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "UK", exact: true }));
  expect(screen.getByText("UK test plan")).toBeInTheDocument();
  expect(screen.queryByText("USA test plan")).not.toBeInTheDocument();
});
