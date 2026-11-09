import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MeisimWalletPanel from "./MeisimWalletPanel";
import { createMeisimTopup, downloadMeisimStatement, previewMeisimTopup } from "../../../services/adminApi";

vi.mock("../../../services/adminApi", () => ({
  previewMeisimTopup: vi.fn(),
  createMeisimTopup: vi.fn(),
  downloadMeisimStatement: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("tops up through MeiSIM's Stripe checkout", async () => {
  vi.mocked(previewMeisimTopup).mockResolvedValue({ fee: 3.2 });
  vi.mocked(createMeisimTopup).mockResolvedValue({ checkout_url: "https://checkout.stripe.com/c/pay/cs_x" });
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  const user = userEvent.setup();
  render(<MeisimWalletPanel />);

  await user.click(screen.getByRole("button", { name: "Fee" }));
  expect(await screen.findByText("Card fee $3.20 · total $103.20")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Pay with card" }));
  expect(createMeisimTopup).toHaveBeenCalledWith(100);
  expect(open).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_x", "_blank", "noopener,noreferrer");
});

it("blocks top-ups outside $50-$10,000 and downloads the statement", async () => {
  vi.mocked(downloadMeisimStatement).mockResolvedValue(new Blob(["Date,Type\n"]));
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
  const user = userEvent.setup();
  render(<MeisimWalletPanel />);

  const input = screen.getByLabelText("Top up amount (USD)");
  await user.clear(input);
  await user.type(input, "20");
  expect(screen.getByRole("button", { name: "Pay with card" })).toBeDisabled();
  expect(screen.getByText("Between $50 and $10,000")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Statement/ }));
  expect(downloadMeisimStatement).toHaveBeenCalled();
});
