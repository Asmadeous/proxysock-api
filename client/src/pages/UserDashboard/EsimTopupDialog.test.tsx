import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import api from "../../services/api";
import EsimTopupDialog from "./EsimTopupDialog";

vi.mock("../../services/api", () => ({
  default: { get: vi.fn(), post: vi.fn().mockResolvedValue({ data: {} }), delete: vi.fn().mockResolvedValue({ data: {} }) },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const state = (extra = {}) => ({
  data: {
    eligible: true, one_time_options: [{ value: 10, price: 15 }], min_subscription_value: 10,
    subscription: null, topups: [], available_balance: 40, ...extra,
  },
});

const open = () => render(<EsimTopupDialog orderId="o1" lineName="AT&T Unlimited" open onOpenChange={vi.fn()} />);

beforeEach(() => vi.mocked(api.get).mockResolvedValue(state()));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("EsimTopupDialog", () => {
  it("buys the $10 one-time top-up for $15", async () => {
    open();
    fireEvent.click(await screen.findByRole("button", { name: "Pay $15.00" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/web/api/orders/o1/topups", { value: 10 }));
  });

  it("charges the monthly amount with no markup and only accepts whole amounts from $10", async () => {
    open();
    const input = await screen.findByLabelText("Credit each month (USD)");
    fireEvent.change(input, { target: { value: "20" } });
    expect(screen.getByText("$20.00")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "5" } });
    expect(screen.getByText("Enter a whole amount of $10.00 or more")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();

    fireEvent.change(input, { target: { value: "25" } });
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/web/api/orders/o1/topup_subscription", { value: 25 }));
  });

  it("shows the active subscription and cancels it", async () => {
    vi.mocked(api.get).mockResolvedValue(state({
      subscription: { id: "s1", status: "active", topup_value: 20, price: 20, next_charge_at: "2026-10-26T00:00:00Z" },
    }));
    open();
    expect(await screen.findByText("$20.00 every month")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel auto top-up" }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/web/api/orders/o1/topup_subscription"));
  });

  it("warns when a monthly charge failed", async () => {
    vi.mocked(api.get).mockResolvedValue(state({
      subscription: { id: "s1", status: "past_due", topup_value: 10, price: 10, next_charge_at: "2026-09-20T00:00:00Z" },
    }));
    open();
    expect(await screen.findByRole("alert")).toHaveTextContent("didn't cover this month's charge");
  });
});
