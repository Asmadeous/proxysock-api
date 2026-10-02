import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MeisimVerifyDialog from "./MeisimVerifyDialog";
import { submitMeisimVerify } from "../../../services/adminApi";

vi.mock("../../../services/adminApi", () => ({
  submitMeisimVerify: vi.fn(),
  fetchMeisimVerify: vi.fn(),
  downloadMeisimVerifyResults: vi.fn(),
}));
afterEach(cleanup);

it("prices the batch, refuses non-codes and submits the codes", async () => {
  vi.mocked(submitMeisimVerify).mockResolvedValue({ batch_id: "b-9", total_rows: 2, charged_usd: 2 });
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const user = userEvent.setup();
  render(<MeisimVerifyDialog open onOpenChange={() => {}} />);

  const codes = screen.getByLabelText("Activation codes");
  await user.type(codes, "8901240527188633351");
  expect(screen.getByRole("alert")).toHaveTextContent("8901240527188633351");
  expect(screen.getByRole("button", { name: /Verify 1 for \$1/ })).toBeDisabled();

  await user.clear(codes);
  await user.type(codes, "LPA:1$T-MOBILE.IDEMIA.IO$AAA{enter}LPA:1$T-MOBILE.IDEMIA.IO$BBB");
  await user.type(screen.getByLabelText(/Email the results/), "ops@proxysock.com");
  expect(screen.getByText("$2.00")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Verify 2 for \$2/ }));

  expect(submitMeisimVerify).toHaveBeenCalledWith(
    "LPA:1$T-MOBILE.IDEMIA.IO$AAA\nLPA:1$T-MOBILE.IDEMIA.IO$BBB", "ops@proxysock.com");
  expect(await screen.findByText("Batch b-9")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Download results (CSV)" })).toBeInTheDocument();
});
