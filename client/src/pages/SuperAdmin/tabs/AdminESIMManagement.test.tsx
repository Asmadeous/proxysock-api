import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import AdminESIMManagement from "./AdminESIMManagement";
import { fetchAdminEsimVerification, fetchAdminOrders } from "../../../services/adminApi";

vi.mock("../../../services/adminApi", () => ({
  fetchAdminOrders: vi.fn(),
  verifyAdminEsim: vi.fn(),
  fetchAdminEsimVerification: vi.fn(),
}));
vi.mock("../components/ManagementFilters", () => ({ default: () => null }));
vi.mock("../components/EsimTopupQueue", () => ({ default: () => null }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

const listWith = (verification?: string) => ({
  data: {
    orders: [{
      id: "o1", product_name: "World 1 GB", status: "active",
      credentials_list: [{ id: "e1", iccid: "8901", activation_code: "LPA:1$X$Y", verification }],
    }],
  },
});

it("shows the saved Verify result after a reload, without checking again", async () => {
  vi.mocked(fetchAdminOrders).mockResolvedValue(listWith("used") as never);
  render(<AdminESIMManagement />);

  expect(await screen.findByText("Verify: Used — already installed")).toBeInTheDocument();
  expect(fetchAdminEsimVerification).not.toHaveBeenCalled();
});

it("keeps watching a check that is still running", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.mocked(fetchAdminOrders).mockResolvedValue(listWith("pending") as never);
  vi.mocked(fetchAdminEsimVerification).mockResolvedValue({ data: { status: "available" } } as never);
  render(<AdminESIMManagement />);

  expect(await screen.findByText("Verify: Checking…")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Verify eSIM ($1)" })).toBeDisabled();

  await act(() => vi.advanceTimersByTimeAsync(15000));

  expect(await screen.findByText("Verify: Available — not installed yet")).toBeInTheDocument();
  expect(fetchAdminEsimVerification).toHaveBeenCalledWith("e1");
});
