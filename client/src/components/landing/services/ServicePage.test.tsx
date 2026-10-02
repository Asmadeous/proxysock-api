import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/services/api";
import ServicePage from "./ServicePage";
import { servicePages, type ServiceKind } from "./service-pages-data";

vi.mock("@/services/api", () => ({ default: { get: vi.fn() } }));
const products = [
  { id: 1, name: "US phone line", meisim_line: "us_prepaid", country_code: "US", price: 20, data_gb: 5, voice_minutes: 100, sms: 100 },
  { id: 2, location_name: "Japan", price: 5, data_gb: 1, duration_days: 7 },
  { id: 3, location_name: "France", price: 8, data_gb: 2, duration_days: 14 },
];
beforeEach(() => vi.mocked(api.get).mockResolvedValue({ data: { products } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function show(kind: ServiceKind) {
  render(<HelmetProvider><MemoryRouter><ServicePage kind={kind} /></MemoryRouter></HelmetProvider>);
}

describe("Service pages", () => {
  it.each(["vps", "rdp", "vpn", "esim"] as const)("supports keyboard selection and service-specific destinations on %s", async (kind) => {
    const user = userEvent.setup();
    const page = servicePages[kind];
    show(kind);
    if (kind === "esim") await screen.findByText("US phone line");
    const alternative = screen.getByRole("button", { name: page.options[1].name });
    alternative.focus();
    await user.keyboard(" ");
    expect(alternative).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: page.options[0].name })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("heading", { name: page.options[1].title })).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: page.purchaseLabel });
    expect(links.some((link) => link.getAttribute("href") === `#${kind}-plans`)).toBe(true);
    expect(links.some((link) => link.getAttribute("href") === page.purchaseHref)).toBe(true);
    expect(screen.getByRole("link", { name: "View documentation" })).toHaveAttribute("href", "/HowToConnect");
  });

  it("opens answers without hiding the plan destinations", async () => {
    const user = userEvent.setup();
    show("rdp");
    const summary = screen.getByText(servicePages.rdp.faqs[0][0]);
    await user.click(summary);
    expect(summary.closest("details")).toHaveAttribute("open");
    expect(screen.getByRole("link", { name: "Choose Standard" })).toHaveAttribute("href", "/dashboard/rdp");
  });

  it("loads live eSIM plans, searches destinations and links to the matching purchase flow", async () => {
    const user = userEvent.setup();
    show("esim");
    await screen.findByText("US phone line");
    expect(api.get).toHaveBeenCalledWith("/web/api/products?product_type=esim&per_page=all");
    expect(screen.getByRole("link", { name: "View available plans" })).toHaveAttribute("href", "/dashboard/usa-esim");
    await user.click(screen.getByRole("button", { name: "Data Only eSIM" }));
    expect(screen.getByRole("heading", { name: "Japan" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "France" })).toBeInTheDocument();
    await user.type(screen.getByRole("searchbox", { name: "Search destinations" }), "Japan");
    expect(screen.getByRole("heading", { name: "Japan" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "France" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore all data plans" })).toHaveAttribute("href", "/dashboard/global-esim");
  });
});
