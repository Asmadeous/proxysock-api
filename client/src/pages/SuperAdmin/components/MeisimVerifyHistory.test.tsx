import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MeisimVerifyHistory from "./MeisimVerifyHistory";
import { downloadMeisimVerifyResults, fetchMeisimVerifyHistory } from "../../../services/adminApi";

vi.mock("../../../services/adminApi", () => ({
  fetchMeisimVerifyHistory: vi.fn(),
  downloadMeisimVerifyResults: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MeisimVerifyHistory />
    </QueryClientProvider>,
  );

it("keeps each bulk check's results on the card, with its CSV", async () => {
  vi.mocked(fetchMeisimVerifyHistory).mockResolvedValue({
    batches: [
      { batch_id: "b-2", codes: 5, submitted_at: "2026-10-02T19:40:00Z", submitted_by: "Ana",
        progress: { total: 5, pending: 2, in_progress: 1, used: 2 } },
      { batch_id: "b-1", codes: 12, submitted_at: "2026-10-02T18:00:00Z", submitted_by: "Sam",
        progress: { total: 12, pending: 0, in_progress: 0, used: 8, available: 3, invalid: 1 } },
    ],
  });
  vi.mocked(downloadMeisimVerifyResults).mockResolvedValue(new Blob(["iccid,lpa,status\n"]));
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
  const user = userEvent.setup();
  renderCard();

  expect(await screen.findByText("8 used · 3 available · 1 invalid")).toBeInTheDocument();
  expect(screen.getByText("Checking 3 of 5…")).toBeInTheDocument();

  await user.click(screen.getAllByRole("button", { name: /Download results \(CSV\)/ })[1]);
  expect(downloadMeisimVerifyResults).toHaveBeenCalledWith("b-1");
});

it("says so when MeiSIM cannot answer for a batch, and shows nothing when there are no checks", async () => {
  vi.mocked(fetchMeisimVerifyHistory).mockResolvedValueOnce({
    batches: [{ batch_id: "b-3", codes: 1, submitted_at: "2026-10-02T19:40:00Z", progress: null }],
  });
  renderCard();
  expect(await screen.findByText("MeiSIM did not answer, try again shortly")).toBeInTheDocument();
  cleanup();

  vi.mocked(fetchMeisimVerifyHistory).mockResolvedValueOnce({ batches: [] });
  const { container } = renderCard();
  await vi.waitFor(() => expect(fetchMeisimVerifyHistory).toHaveBeenCalledTimes(2));
  await vi.waitFor(() => expect(container).toBeEmptyDOMElement());
});
