import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MeisimVerifyPanel from "./MeisimVerifyPanel";
import { submitMeisimVerify } from "../../../services/adminApi";

vi.mock("../../../services/adminApi", () => ({
  submitMeisimVerify: vi.fn(),
  fetchMeisimVerify: vi.fn(),
  downloadMeisimVerifyResults: vi.fn(),
}));
afterEach(cleanup);

it("prices the batch, refuses non-codes, submits the codes and tells the page", async () => {
  vi.mocked(submitMeisimVerify).mockResolvedValue({ batch_id: "b-9", total_rows: 2, charged_usd: 2 });
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const onSubmitted = vi.fn();
  const user = userEvent.setup();
  render(<MeisimVerifyPanel onSubmitted={onSubmitted} />);

  const codes = screen.getByLabelText("Activation codes");
  await user.type(codes, "8901240527188633351");
  expect(screen.getByRole("alert")).toHaveTextContent("8901240527188633351");
  expect(screen.getByRole("button", { name: "Verify" })).toBeDisabled();

  await user.clear(codes);
  await user.type(codes, "LPA:1$T-MOBILE.IDEMIA.IO$AAA{enter}LPA:1$T-MOBILE.IDEMIA.IO$BBB");
  await user.type(screen.getByLabelText(/Results email/), "ops@proxysock.com");
  expect(screen.getByText("$2")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Verify" }));

  expect(submitMeisimVerify).toHaveBeenCalledWith(
    "LPA:1$T-MOBILE.IDEMIA.IO$AAA\nLPA:1$T-MOBILE.IDEMIA.IO$BBB", "ops@proxysock.com");
  expect(onSubmitted).toHaveBeenCalled();
  expect(await screen.findByRole("button", { name: "Download CSV" })).toBeInTheDocument();
  expect(screen.getByText("Used")).toBeInTheDocument();
});
