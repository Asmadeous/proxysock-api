import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Cart from "./Cart";
import ResellerCart from "../Reseller/ResellerCart";

vi.mock("../../services/api", () => ({
  default: { get: vi.fn().mockResolvedValue({ data: { available_balance: 0 } }) },
}));
vi.mock("../../services/resellerApi", () => ({
  fetchResellerBalance: vi.fn().mockResolvedValue({ data: { available_balance: 0 } }),
}));

const plan = {
  id: "0cf1fe4c-c82b-4a15-9de5-62daf21ea00f", name: "AT&T Prepaid · $35 Unlimited Saver", provider: "AT&T Prepaid",
  price: 53.04, currency_code: "USD", data_amount: "See plan details", duration: 30, duration_unit: "Days",
  requires_imei: true, requires_eid: true,
};
const line = {
  productType: "usa-esim", quantity: 1, totalPrice: 53.04, usaEsimPlan: plan,
  deviceDetails: { imei: "350923389416420", eid: "89049032007108888100137471946359" },
};
const savedCart = () => JSON.parse(localStorage.getItem("cartItems")!);

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe.each(["customer", "reseller"])("%s cart with a US phone-number line", (kind) => {
  const openCart = () => render(
    <HelmetProvider><MemoryRouter>
      {kind === "customer" ? <Cart /> : <ResellerCart onBrowse={vi.fn()} onCheckout={vi.fn()} />}
    </MemoryRouter></HelmetProvider>,
  );

  it("shows one line for one phone, with no quantity controls", async () => {
    localStorage.setItem("cartItems", JSON.stringify([line]));
    openCart();
    expect(await screen.findByText("1 line")).toBeInTheDocument();
    expect(screen.getByText("ending 6420")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /quantity/i })).not.toBeInTheDocument();
  });

  it("repairs a saved quantity above one", async () => {
    localStorage.setItem("cartItems", JSON.stringify([{ ...line, quantity: 3, totalPrice: 159.12 }]));
    openCart();
    await waitFor(() => expect(savedCart()[0].quantity).toBe(1));
    expect(savedCart()[0].totalPrice).toBe(53.04);
  });

  it("drops USA eSIM items saved before phone details were required", async () => {
    const other = { productType: "vpn", quantity: 1, vpnPlan: { id: "v1", name: "VPN", price: 5, currency_code: "USD" } };
    localStorage.setItem("cartItems", JSON.stringify([{ ...line, deviceDetails: undefined }, other]));
    openCart();
    await waitFor(() => expect(savedCart()).toHaveLength(1));
    expect(savedCart()[0].productType).toBe("vpn");
  });
});
