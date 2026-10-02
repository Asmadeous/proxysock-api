import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResVPNManagement from "./ResVPNManagement";
import { fetchResellerOrders } from "@/services/resellerApi";

vi.mock("@/services/resellerApi", () => ({ fetchResellerOrders: vi.fn() }));
afterEach(cleanup);

it("shows each VPN's server, login and expiry, and hides logins of closed orders", async () => {
  vi.mocked(fetchResellerOrders).mockResolvedValue({
    data: {
      orders: [
        { id: "a", order_number: "ORD-1", product_name: "US VPN", status: "active", country: "US, North Carolina, NC",
          expires_at: "2026-11-01T00:00:00Z",
          credentials: { server: "vpnMPA-2063", protocol: "OpenVPN", username: "vpnuser1", password: "vpnpass1" } },
        { id: "b", order_number: "ORD-2", product_name: "Old VPN", status: "expired",
          credentials: { username: "olduser", password: "oldpass" } },
      ],
    },
  } as never);
  const user = userEvent.setup();
  render(<ResVPNManagement />);

  expect(await screen.findByText("vpnMPA-2063")).toBeInTheDocument();
  expect(screen.getByText("vpnuser1")).toBeInTheDocument();
  expect(screen.getByText("US, North Carolina, NC")).toBeInTheDocument();
  expect(fetchResellerOrders).toHaveBeenCalledWith({ product_type: "vpn" });

  await user.click(screen.getByRole("button", { name: "Show password" }));
  expect(screen.getByText("vpnpass1")).toBeInTheDocument();

  expect(screen.queryByText("olduser")).not.toBeInTheDocument();
  expect(screen.getByText(/This subscription is expired/)).toBeInTheDocument();
});
