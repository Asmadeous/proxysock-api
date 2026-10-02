import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Login from "./Login";

const mocks = vi.hoisted(() => ({ login: vi.fn().mockResolvedValue(undefined), trackPageView: vi.fn() }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ login: mocks.login, isAuthenticated: false }) }));
vi.mock("@/services/auth", () => ({ isSessionExpired: () => false }));
vi.mock("@/utils/redditPixel", () => ({ useRedditTracking: () => ({ trackPageView: mocks.trackPageView }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
afterEach(() => { cleanup(); localStorage.clear(); vi.clearAllMocks(); });

describe("Login return destination", () => {
  it.each(["/dashboard/proxies", { pathname: "/dashboard/proxies" }])("returns to proxy plans after sign-in for %j", async (from) => {
    render(<MemoryRouter initialEntries={[{ pathname: "/login", state: { from } }]}><Routes><Route path="/login" element={<Login />} /><Route path="/dashboard/proxies" element={<p>Proxy purchase page</p>} /></Routes></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "person@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "ExamplePass1!" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Proxy purchase page")).toBeInTheDocument();
    expect(mocks.login).toHaveBeenCalledWith("person@example.com", "ExamplePass1!", false);
  });
});
