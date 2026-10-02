import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import WaitForVerification from "./WaitForVerification";
import VerifyEmail from "./VerifyEmail";

const mocks = vi.hoisted(() => ({ post: vi.fn(), resetPassword: vi.fn(), verifyEmail: vi.fn() }));
vi.mock("@/services/api", () => ({ default: { post: mocks.post } }));
vi.mock("@/services/railsAuth", () => ({ resetPassword: mocks.resetPassword, verifyEmail: mocks.verifyEmail }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
function show(page: React.ReactNode, path: string, state?: object) {
  render(<HelmetProvider><MemoryRouter initialEntries={[{ pathname: path.split("?")[0], search: path.includes("?") ? `?${path.split("?")[1]}` : "", state }]}><Routes><Route path="/login" element={<p>Login destination</p>} /><Route path="*" element={page} /></Routes></MemoryRouter></HelmetProvider>);
}

describe("Recovery and verification", () => {
  it("sends recovery email and shows the inbox confirmation", async () => {
    mocks.post.mockResolvedValue({ data: {} });
    show(<ForgotPassword />, "/forgot-password");
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "person@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("heading", { name: "Check your inbox." })).toBeInTheDocument();
    expect(mocks.post).toHaveBeenCalledWith("/web/api/auth/forgot_password", { email: "person@example.com" });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByLabelText("Email address")).toHaveValue("person@example.com");
  });
  it("shows recovery failures and re-enables submission", async () => {
    mocks.post.mockRejectedValue({ response: { data: { error: "Please try later" } } });
    show(<ForgotPassword />, "/forgot-password");
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "person@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please try later");
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeEnabled();
  });
  it("offers a new link when the reset token is missing", () => {
    show(<ResetPassword />, "/reset-password");
    expect(screen.getByRole("link", { name: "Request a new link" })).toHaveAttribute("href", "/forgot-password");
    expect(mocks.resetPassword).not.toHaveBeenCalled();
  });
  it("rejects mismatched passwords, then submits matching passwords and redirects", async () => {
    mocks.resetPassword.mockResolvedValue(undefined);
    show(<ResetPassword />, "/reset-password?token=example-token");
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "ExamplePass1!" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "DifferentPass1!" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match");
    expect(mocks.resetPassword).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "ExamplePass1!" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));
    expect(await screen.findByText("Login destination")).toBeInTheDocument();
    expect(mocks.resetPassword).toHaveBeenCalledWith("ExamplePass1!", "ExamplePass1!", "example-token");
  });
  it("resends verification using the email carried from registration", async () => {
    mocks.post.mockResolvedValue({ data: { message: "Email sent" } });
    show(<WaitForVerification />, "/wait-for-verification", { email: "new@example.com" });
    fireEvent.click(screen.getByRole("button", { name: "Resend verification email" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Email sent");
    expect(mocks.post).toHaveBeenCalledWith("/web/api/auth/resend_confirmation", { email: "new@example.com" });
  });
  it("allows entering an email when verification is opened directly", async () => {
    mocks.post.mockResolvedValue({ data: { message: "Email sent" } });
    show(<WaitForVerification />, "/wait-for-verification");
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "new@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Resend verification email" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Email sent");
    expect(mocks.post).toHaveBeenCalledWith("/web/api/auth/resend_confirmation", { email: "new@example.com" });
  });
  it("offers recovery for expired verification tokens", async () => {
    mocks.verifyEmail.mockRejectedValue(new Error("Expired"));
    show(<VerifyEmail />, "/verify-email?token=expired");
    expect(await screen.findByRole("link", { name: "Request another email" })).toHaveAttribute("href", "/wait-for-verification");
    expect(mocks.verifyEmail).toHaveBeenCalledWith("expired");
  });
});
