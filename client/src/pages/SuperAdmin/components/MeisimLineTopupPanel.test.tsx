import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MeisimLineTopupPanel from "./MeisimLineTopupPanel";
import MeisimLineTopupDialog from "./MeisimLineTopupDialog";
import { checkMeisimLine, fetchMeisimTopupNetworks, rechargeMeisimLine } from "../../../services/adminApi";

vi.mock("../../../services/adminApi", () => ({
  fetchMeisimTopupNetworks: vi.fn(),
  checkMeisimLine: vi.fn(),
  rechargeMeisimLine: vi.fn(),
}));
beforeEach(() => {
  vi.mocked(fetchMeisimTopupNetworks).mockResolvedValue({ networks: ["ATT-US", "O2-UK"] });
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const withQueries = (ui: ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

it("checks the line, then recharges the chosen plan with its amount", async () => {
  vi.mocked(checkMeisimLine).mockResolvedValue({
    plans: [{ code: "ATT-25", name: "Unlimited 30 days", value: 25 }], credit_amounts: [10, 20], raw: {},
  });
  vi.mocked(rechargeMeisimLine).mockResolvedValue({ result: "applied", message: "plan ATT-25 (25)" });
  const onDone = vi.fn();
  const user = userEvent.setup();
  withQueries(<MeisimLineTopupPanel onDone={onDone} />);

  await user.type(screen.getByLabelText("Carrier"), "ATT-US");
  await user.type(screen.getByLabelText("Phone number or ICCID"), "3055550123");
  await user.click(screen.getByRole("button", { name: "Check line" }));
  expect(checkMeisimLine).toHaveBeenCalledWith("ATT-US", "3055550123");

  await user.click(await screen.findByRole("radio", { name: /Unlimited 30 days/ }));
  expect(screen.getByLabelText(/Amount sent with the plan/)).toHaveValue(25);
  await user.click(screen.getByRole("button", { name: "Recharge" }));

  expect(rechargeMeisimLine).toHaveBeenCalledWith({
    network: "ATT-US", line: "3055550123", value: "25", plan_code: "ATT-25", esim_topup_id: undefined,
  });
  expect(await screen.findByText("Recharged: plan ATT-25 (25)")).toBeInTheDocument();
  expect(onDone).toHaveBeenCalled();
});

it("applies a queued customer top-up from its row, with its line filled in", async () => {
  vi.mocked(checkMeisimLine).mockResolvedValue({ plans: [], credit_amounts: [10], raw: {} });
  vi.mocked(rechargeMeisimLine).mockResolvedValue({ result: "applied", message: "10 credit" });
  const user = userEvent.setup();
  withQueries(
    <MeisimLineTopupDialog open onOpenChange={() => {}}
      preset={{ line: "+447700900123", topupId: "t-1", reference: "TOP-1", creditUsd: 10, lineName: "UK line" }} />,
  );

  expect(screen.getByText(/Customer paid for \$10.00 credit on UK line/)).toBeInTheDocument();
  expect(screen.getByLabelText("Phone number or ICCID")).toHaveValue("+447700900123");
  expect(screen.queryByRole("tab", { name: "Bulk" })).not.toBeInTheDocument();

  await user.type(screen.getByLabelText("Carrier"), "O2-UK");
  await user.click(screen.getByRole("button", { name: "Check line" }));
  await user.click(await screen.findByRole("radio", { name: "10" }));
  await user.click(screen.getByRole("button", { name: "Recharge" }));

  expect(rechargeMeisimLine).toHaveBeenCalledWith(expect.objectContaining({ value: "10", esim_topup_id: "t-1" }));
});

it("recharges many lines one after another and shows each result", async () => {
  vi.mocked(rechargeMeisimLine)
    .mockResolvedValueOnce({ result: "applied", message: "10 credit" })
    .mockRejectedValueOnce({ response: { data: { result: "refused", error: "15 is not one of this line's credit amounts (10, 20)" } } });
  const user = userEvent.setup();
  withQueries(<MeisimLineTopupPanel />);

  await user.click(screen.getByRole("tab", { name: "Bulk" }));
  await user.type(screen.getByLabelText(/One line per row/), "O2-UK, +447700900123, 10\nATT-US, 3055550123, 15");
  await user.click(screen.getByRole("button", { name: "Recharge 2 lines" }));

  expect(rechargeMeisimLine).toHaveBeenNthCalledWith(1, { network: "O2-UK", line: "+447700900123", value: "10", plan_code: undefined });
  expect(rechargeMeisimLine).toHaveBeenNthCalledWith(2, { network: "ATT-US", line: "3055550123", value: "15", plan_code: undefined });
  expect(await screen.findByText("Recharged")).toBeInTheDocument();
  expect(screen.getByText(/Not sent: 15 is not one of this line's credit amounts/)).toBeInTheDocument();
});
