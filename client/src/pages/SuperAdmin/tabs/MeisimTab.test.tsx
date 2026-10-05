import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MeisimTab from "./MeisimTab";
import { fetchProviderBalances } from "../../../services/adminApi";

vi.mock("../../../services/adminApi", () => ({ fetchProviderBalances: vi.fn() }));
vi.mock("../components/MeisimWalletPanel", () => ({ default: () => <div>wallet tools</div> }));
vi.mock("../components/MeisimVerifyPanel", () => ({ default: () => <div>verify form</div> }));
vi.mock("../components/MeisimVerifyHistory", () => ({ default: () => <div>recent checks</div> }));
vi.mock("../components/MeisimLineTopupPanel", () => ({ default: () => <div>recharge form</div> }));
vi.mock("../components/MeisimLineTopupHistory", () => ({ default: () => <div>recent recharges</div> }));
vi.mock("../components/EsimTopupQueue", () => ({ default: () => <div>customer top-ups</div> }));
afterEach(cleanup);

it("puts the MeiSIM balance and every MeiSIM tool on one page", async () => {
  vi.mocked(fetchProviderBalances).mockResolvedValue({ meisim: { balance: 245.3, markup_pct: 15 } });
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>
        <MeisimTab />
      </QueryClientProvider>
    </MemoryRouter>,
  );

  expect(await screen.findByText("$245.30")).toBeInTheDocument();
  expect(screen.getByText("15%")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Overview/ })).toHaveAttribute("href", "/admin/overview");
  for (const tool of ["wallet tools", "verify form", "recent checks", "recharge form", "recent recharges", "customer top-ups"]) {
    expect(screen.getByText(tool)).toBeInTheDocument();
  }
});
