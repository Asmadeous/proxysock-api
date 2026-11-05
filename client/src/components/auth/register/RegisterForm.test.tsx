import type { ComponentProps } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RegisterForm from "./RegisterForm";

const checkUsername = vi.hoisted(() => vi.fn());
vi.mock("@/services/api", () => ({ checkUsername }));
vi.mock("@/data/countryCities", () => ({
  getCountries: () => [{ isoCode: "CA", name: "Canada" }, { isoCode: "NG", name: "Nigeria" }],
  getCitiesForCountry: () => [{ name: "Toronto" }],
}));
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); checkUsername.mockResolvedValue({ data: { available: true, message: "Available" } }); });
function props(): ComponentProps<typeof RegisterForm> {
  return {
    firstName: "Test", setFirstName: vi.fn(), lastName: "User", setLastName: vi.fn(),
    username: "test_user", setUsername: vi.fn(), email: "user@example.com", setEmail: vi.fn(),
    password: "ExamplePass1!", setPassword: vi.fn(), passwordConfirmation: "ExamplePass1!", setPasswordConfirmation: vi.fn(),
    country: "CA", setCountry: vi.fn(), city: "Toronto", setCity: vi.fn(),
    showPassword: false, setShowPassword: vi.fn(), agreedToTerms: true, setAgreedToTerms: vi.fn(),
    isLoading: false, isRateLimited: false, remainingTime: null, submitAttempts: 0,
    passwordError: null, passwordStrength: 4, profilePicture: null, setProfilePicture: vi.fn(),
    referralCode: "", setReferralCode: vi.fn(), onSubmit: vi.fn(),
  };
}

describe("Registration form", () => {
  it("keeps username verification, password matching and terms acceptance as submission gates", async () => {
    const values = props();
    const { rerender } = render(<MemoryRouter><RegisterForm {...values} /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Create account" })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Create account" })).toBeEnabled());
    expect(checkUsername).toHaveBeenCalledWith("test_user");
    rerender(<MemoryRouter><RegisterForm {...values} passwordConfirmation="Mismatch" /></MemoryRouter>);
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeDisabled();
    rerender(<MemoryRouter><RegisterForm {...values} agreedToTerms={false} /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Create account" })).toBeDisabled();
  });

  it("clears the selected city when the country changes", () => {
    const values = props();
    render(<MemoryRouter><RegisterForm {...values} /></MemoryRouter>);
    fireEvent.click(screen.getByLabelText("Country"));
    fireEvent.click(screen.getByRole("button", { name: "Nigeria" }));
    expect(values.setCountry).toHaveBeenCalledWith("NG");
    expect(values.setCity).toHaveBeenCalledWith("");
  });
});
