import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import ManagementTab from "./ManagementTab";

vi.mock("./AdminESIMManagement", () => ({ default: () => <div>esim orders list</div> }));
vi.mock("./AdminVPSManagement", () => ({ default: () => <div>vps orders list</div> }));
vi.mock("./AdminRDPManagement", () => ({ default: () => <div>rdp orders list</div> }));
vi.mock("./AdminProxyManagement", () => ({ default: () => <div>proxy orders list</div> }));
vi.mock("./AdminVPNManagement", () => ({ default: () => <div>vpn orders list</div> }));
vi.mock("./ProductsTab", () => ({ default: ({ category }: { category?: string }) => <div>products for {category}</div> }));
vi.mock("./AdminPurchaseView", () => ({ default: ({ initialTab }: { initialTab?: string }) => <div>provision at {initialTab}</div> }));
afterEach(cleanup);

const Where = () => <span data-testid="where">{useLocation().search}</span>;
const renderAt = (url = "/admin/management") =>
  render(<MemoryRouter initialEntries={[url]}><ManagementTab /><Where /></MemoryRouter>);

it("goes from a category card to its Orders, Products and Provision cards", async () => {
  const user = userEvent.setup();
  renderAt();

  await user.click(screen.getByRole("button", { name: /eSIM Management/ }));
  expect(await screen.findByRole("button", { name: /Orders/ })).toBeInTheDocument();
  expect(screen.getByText(/Travel data eSIMs/)).toBeInTheDocument();
  expect(screen.getByText(/paid from the customer's own wallet/)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Open Products/ }));
  expect(await screen.findByText("products for esim")).toBeInTheDocument();
  expect(screen.getByTestId("where").textContent).toBe("?type=esim&view=products");

  await user.click(screen.getByRole("button", { name: "Back to eSIM Management" }));
  await user.click(await screen.findByRole("button", { name: /Open Provision/ }));
  expect(await screen.findByText("provision at buy-esim")).toBeInTheDocument();
});

it("opens the orders list straight from a notification link", async () => {
  renderAt("/admin/management?type=vpn&view=orders");

  expect(await screen.findByText("vpn orders list")).toBeInTheDocument();
});
