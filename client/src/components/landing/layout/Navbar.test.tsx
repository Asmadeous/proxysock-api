import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Navbar from "./Navbar";

const mocks = vi.hoisted(() => ({
  isAuthenticated: false,
  trackViewContent: vi.fn(),
  toggleDark: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: mocks.isAuthenticated }),
}));
vi.mock("@/utils/redditPixel", () => ({
  useRedditTracking: () => ({ trackViewContent: mocks.trackViewContent }),
}));
vi.mock("@/store/themeStore", () => ({
  useThemeStore: () => ({ dark: true, toggleDark: mocks.toggleDark }),
}));

beforeEach(() => {
  mocks.isAuthenticated = false;
  vi.clearAllMocks();
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderNavigation() {
  render(<MemoryRouter><Navbar /></MemoryRouter>);
}

describe("Public navigation", () => {
  it("directs guests to registration and authenticated users to their dashboard", () => {
    renderNavigation();
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/register");
    cleanup();
    mocks.isAuthenticated = true;
    renderNavigation();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
  });

  it("closes the mobile menu with Escape and restores focus to its trigger", async () => {
    const user = userEvent.setup();
    renderNavigation();
    const button = screen.getByRole("button", { name: "Open navigation menu" });
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument();
  });

  it("navigates and closes the mobile menu when analytics is unavailable", async () => {
    const user = userEvent.setup();
    renderNavigation();
    await user.click(screen.getByRole("button", { name: "Open navigation menu" }));
    await user.click(screen.getByRole("link", { name: "Proxies" }));
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument();
    expect(mocks.trackViewContent).toHaveBeenCalledWith(expect.objectContaining({ productName: "Proxies" }));
  });
});
