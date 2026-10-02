import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MeisimWalletActions from "./MeisimWalletActions";
import { createMeisimTopup, previewMeisimTopup } from "../../../services/adminApi";

vi.mock("../../../services/adminApi", () => ({
  previewMeisimTopup: vi.fn(),
  createMeisimTopup: vi.fn(),
  downloadMeisimStatement: vi.fn(),
}));
afterEach(cleanup);

it("shows the card fee and opens MeiSIM's Stripe checkout", async () => {
  vi.mocked(previewMeisimTopup).mockResolvedValue({ fee: 3.2 });
  vi.mocked(createMeisimTopup).mockResolvedValue({ checkout_url: "https://checkout.stripe.com/c/pay/cs_x" });
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  const user = userEvent.setup();
  render(<MeisimWalletActions />);

  await user.click(screen.getByRole("button", { name: "Fee" }));
  expect(await screen.findByText(/Card fee \$3\.20 · you pay \$103\.20/)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Pay with card" }));
  expect(createMeisimTopup).toHaveBeenCalledWith(100);
  expect(open).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_x", "_blank", "noopener,noreferrer");
});

it("blocks amounts outside $50-$10,000", async () => {
  const user = userEvent.setup();
  render(<MeisimWalletActions />);

  const input = screen.getByLabelText(/Top up wallet/);
  await user.clear(input);
  await user.type(input, "20");

  expect(screen.getByRole("button", { name: "Pay with card" })).toBeDisabled();
  expect(screen.getByText("Enter between $50 and $10,000.")).toBeInTheDocument();
});
