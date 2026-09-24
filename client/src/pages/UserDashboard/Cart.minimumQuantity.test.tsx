import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const item = {
  productType: "usa-esim", quantity: 5, totalPrice: 125,
  usaEsimPlan: {
    id: "42", name: "Colt USA Premium", provider: "colt", moq: 5,
    price: 25, currency_code: "USD", voice_minutes: "Unlimited",
    sms_included: true, data_amount: "2 GB", duration: 30, duration_unit: "days",
  },
};
const savedItem = () => JSON.parse(localStorage.getItem("cartItems")!)[0];

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe.each(["customer", "reseller"])("%s cart minimum order", (kind) => {
  const openCart = () => render(
    <HelmetProvider><MemoryRouter>
      {kind === "customer" ? <Cart /> : <ResellerCart onBrowse={vi.fn()} onCheckout={vi.fn()} />}
    </MemoryRouter></HelmetProvider>,
  );

  it("stops at five, allows six back to five, and permits explicit removal", async () => {
    localStorage.setItem("cartItems", JSON.stringify([item]));
    const user = userEvent.setup();
    openCart();
    const decrease = await screen.findByRole("button", { name: "Decrease quantity for Colt USA Premium" });
    expect(decrease).toBeDisabled();
    expect(screen.getByText("Minimum order: 5 eSIMs.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Increase quantity for Colt USA Premium" }));
    expect(savedItem().quantity).toBe(6);
    expect(savedItem().totalPrice).toBe(150);
    expect(decrease).toBeEnabled();
    await user.click(decrease);
    expect(savedItem().quantity).toBe(5);
    expect(savedItem().totalPrice).toBe(125);
    expect(decrease).toBeDisabled();
    await user.click(decrease);
    expect(savedItem().quantity).toBe(5);
    await user.click(screen.getByRole("button", { name: "Remove Colt USA Premium from cart" }));
    expect(JSON.parse(localStorage.getItem("cartItems")!)).toEqual([]);
  });

  it("repairs a previously saved quantity below the minimum and its stale total", async () => {
    localStorage.setItem("cartItems", JSON.stringify([{ ...item, quantity: 2, totalPrice: 50 }]));
    openCart();
    await waitFor(() => expect(savedItem().quantity).toBe(5));
    expect(savedItem().totalPrice).toBe(125);
    expect(await screen.findByRole("button", { name: "Decrease quantity for Colt USA Premium" })).toBeDisabled();
  });

  it("allows a plan with a minimum of one to decrease from two to one", async () => {
    localStorage.setItem("cartItems", JSON.stringify([{
      ...item, quantity: 2, totalPrice: 50, usaEsimPlan: { ...item.usaEsimPlan, moq: 1 },
    }]));
    const user = userEvent.setup();
    openCart();
    await user.click(await screen.findByRole("button", { name: "Decrease quantity for Colt USA Premium" }));
    expect(savedItem().quantity).toBe(1);
    expect(savedItem().totalPrice).toBe(25);
  });
});
