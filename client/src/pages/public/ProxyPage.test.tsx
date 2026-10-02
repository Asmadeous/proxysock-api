import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import ProxyPage from "./ProxyPage";

afterEach(cleanup);
function showPage() {
  render(<HelmetProvider><MemoryRouter><ProxyPage /></MemoryRouter></HelmetProvider>);
}

describe("Proxy services page", () => {
  it("updates the comparison and selected state when a proxy type is chosen", async () => {
    const user = userEvent.setup();
    showPage();
    expect(screen.getByRole("button", { name: "Datacenter" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Rotating residential" }));
    expect(screen.getByRole("button", { name: "Rotating residential" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Datacenter" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("heading", { name: "More addresses. More flexibility." })).toBeInTheDocument();
    expect(screen.getByText("Configurable rotation")).toBeInTheDocument();
  });

  it("supports keyboard selection and keeps the existing plan and documentation destinations", async () => {
    const user = userEvent.setup();
    showPage();
    screen.getByRole("button", { name: "Static residential" }).focus();
    await user.keyboard(" ");
    expect(screen.getByRole("heading", { name: "Keep your connection consistent." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse proxy plans" })).toHaveAttribute("href", "/dashboard/proxies");
    expect(screen.getByRole("link", { name: "Explore proxy plans" })).toHaveAttribute("href", "/dashboard/proxies");
    expect(screen.getByRole("link", { name: "View documentation" })).toHaveAttribute("href", "/HowToConnect");
  });

  it("opens FAQ answers on demand", async () => {
    const user = userEvent.setup();
    showPage();
    const question = screen.getByText("Do all plans include unlimited bandwidth?");
    const details = question.closest("details");
    expect(details).not.toHaveAttribute("open");
    await user.click(question);
    expect(details).toHaveAttribute("open");
    expect(details).toHaveTextContent("Bandwidth allowances depend on the proxy type and plan.");
  });
});
