import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EnhancedProductsGrid } from "./EnhancedProductsGrid";

vi.mock("framer-motion", () => ({ useReducedMotion: () => true }));
vi.mock("./InfrastructureVisual", () => ({
  InfrastructureVisual: ({ service, step }: { service: string; step: number }) => <figure aria-label={`${service} step ${step}`} />,
}));
beforeEach(() => { vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true }))); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function setup() {
  const trackConversion = vi.fn();
  const trackViewContent = vi.fn();
  const rendered = render(<MemoryRouter><EnhancedProductsGrid trackConversion={trackConversion} trackViewContent={trackViewContent} /></MemoryRouter>);
  const preview = within(rendered.container.querySelector(".infrastructure-visual-column") as HTMLElement);
  return { ...rendered, preview, trackConversion, trackViewContent };
}

describe("Infrastructure showcase", () => {
  it("lets visitors change preview steps with the keyboard", async () => {
    const user = userEvent.setup();
    const { preview } = setup();
    const control = screen.getByRole("button", { name: /Put your proxies to work/ });
    control.focus();
    await user.keyboard("{Enter}");
    expect(control).toHaveAttribute("aria-pressed", "true");
    expect(preview.getByRole("figure", { name: "proxies step 1" })).toBeInTheDocument();
  });

  it("changes the pinned preview to match the chapter and step reached by scrolling", async () => {
    let scroll = 0;
    const ids = ["proxies", "vps", "rdp", "vpn", "esim"];
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const index = ids.indexOf(this.id.replace("infrastructure-", ""));
      const top = Math.max(index, 0) * 800 - scroll;
      return { top, bottom: top + 800, height: 800, left: 0, right: 500, width: 500, x: 0, y: top, toJSON: () => ({}) };
    });
    const { preview } = setup();
    expect(preview.getByRole("figure", { name: "proxies step 0" })).toBeInTheDocument();
    scroll = 1000;
    act(() => { document.dispatchEvent(new Event("scroll")); });
    await waitFor(() => expect(preview.getByRole("figure", { name: "vps step 1" })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Take full control/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps product destinations and conversion tracking connected", async () => {
    const user = userEvent.setup();
    const { trackConversion, trackViewContent } = setup();
    const link = screen.getByRole("link", { name: "Explore remote desktops" });
    expect(link).toHaveAttribute("href", "/rdp");
    await user.click(link);
    expect(trackConversion).toHaveBeenCalledWith("rdp_plans_navigation", "product_interest", "/rdp");
    expect(trackViewContent).toHaveBeenCalledWith(expect.objectContaining({ productId: "rdp-hosting", category: "rdp" }));
  });
});
