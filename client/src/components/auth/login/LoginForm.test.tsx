import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LoginForm from "./LoginForm";
import { BrowserRouter } from "react-router-dom";

// Wrap in Router since LoginForm uses <Link>
const renderLoginForm = (props: any) => {
    return render(
        <BrowserRouter>
            <LoginForm {...props} />
        </BrowserRouter>
    );
};

describe("LoginForm", () => {
    const defaultProps = {
        email: "",
        setEmail: vi.fn(),
        password: "",
        setPassword: vi.fn(),
        isLoading: false,
        showPassword: false,
        setShowPassword: vi.fn(),
        rememberMe: false,
        setRememberMe: vi.fn(),
        error: "",
        isOAuthDisabled: false,
        onSubmit: vi.fn((e) => e.preventDefault()),
    };

    it("renders email and password inputs", () => {
        renderLoginForm(defaultProps);
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("calls inputs change handlers", () => {
        renderLoginForm(defaultProps);

        const emailInput = screen.getByLabelText(/email address/i);
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        expect(defaultProps.setEmail).toHaveBeenCalledWith("test@example.com");

        const passwordInput = screen.getByLabelText(/password/i);
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        expect(defaultProps.setPassword).toHaveBeenCalledWith("password123");
    });

    it("toggles password visibility", () => {
        renderLoginForm(defaultProps);
        // The visual icon changes, but for logic we check the setShowPassword call

        const buttons = screen.getAllByRole("button");
        const toggleBtn = buttons.find(btn => (btn as HTMLButtonElement).type === "button");

        if (toggleBtn) {
            fireEvent.click(toggleBtn);
            expect(defaultProps.setShowPassword).toHaveBeenCalledWith(true);
        } else {
            throw new Error("Toggle password button not found");
        }
    });

    it("calls onSubmit when form is submitted", () => {
        const { container } = renderLoginForm(defaultProps);
        const form = container.querySelector("form");
        if (form) {
            fireEvent.submit(form);
            expect(defaultProps.onSubmit).toHaveBeenCalled();
        } else {
            throw new Error("Form not found");
        }
    });

    it("displays loading state", () => {
        renderLoginForm({ ...defaultProps, isLoading: true });
        expect(screen.getByText(/signing in.../i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /signing in.../i })).toBeDisabled();
        expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    });

    it("displays error message", () => {
        renderLoginForm({ ...defaultProps, error: "Invalid credentials" });
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
});
