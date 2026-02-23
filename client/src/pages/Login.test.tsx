import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Login from "./Login";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { toast } from "react-hot-toast";

// Mocks
vi.mock("react-hot-toast", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock("../services/auth", () => ({
    isSessionExpired: vi.fn(() => false),
}));

vi.mock("../utils/redditPixel", () => ({
    useRedditTracking: () => ({
        trackPageView: vi.fn(),
    }),
}));

        auth: {
            signInWithOAuth: vi.fn(),
        },
    },
}));


// Mock child components that might use window or complex logic that we don't want to test in integration
vi.mock("../components/auth/carousel", () => ({
    AuroraBackground: () => <div data-testid="aurora-bg">Aurora Background</div>,
    LoginFeaturesCarousel: () => <div data-testid="features-carousel">Carousel</div>,
}));

// Mock AuthContext login function
const loginMock = vi.fn();

// Custom render to mock AuthContext
const renderLogin = () => {
    // We need to mock useAuth. 
    // Since useAuth is a hook exported from AuthContext, we can mock the whole module or 
    // just pass a value to keys if we wrap it.
    // Actually, standard way is to mock the module `../context/AuthContext`.

    return render(
        <MemoryRouter initialEntries={["/login"]}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<div>Dashboard Page</div>} />
            </Routes>
        </MemoryRouter>
    );
};

// We will mock the module itself to control the return value of useAuth
const useAuthMockFn = vi.fn();
// Default implementation
useAuthMockFn.mockReturnValue({
    login: loginMock,
    isAuthenticated: false,
});

vi.mock("../context/AuthContext", () => ({
    useAuth: () => useAuthMockFn(),
}));

describe("Login Page Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it("renders login page elements", () => {
        renderLogin();
        expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByTestId("aurora-bg")).toBeInTheDocument();
    });

    // ...

    // ...

    it("handles successful login", async () => {
        renderLogin();

        // Fill form
        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "user@example.com" } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });

        // Submit
        const form = screen.getByRole("button", { name: /sign in/i }).closest("form");
        if (!form) throw new Error("Form not found");
        fireEvent.submit(form);

        await waitFor(() => {
            expect(loginMock).toHaveBeenCalledWith("user@example.com", "password123");
        });

        // Toast success
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("successful"));
        });

        // Should navigate to dashboard (check if Dashboard Page text is visible)
        // Note: In a real integration test with MemoryRouter, we can check if the rendered component changed.
        expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
    });

    it("handles failed login", async () => {
        loginMock.mockRejectedValueOnce(new Error("Invalid credentials"));
        renderLogin();

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "user@example.com" } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong" } });

        const form = screen.getByRole("button", { name: /sign in/i }).closest("form");
        if (!form) throw new Error("Form not found");
        fireEvent.submit(form);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("failed"));
        });

        // Should NOT navigate to dashboard
        expect(screen.queryByText("Dashboard Page")).not.toBeInTheDocument();
    });

    it("redirects if already authenticated", () => {
        // Override mock to return authenticated
        useAuthMockFn.mockReturnValue({
            login: loginMock,
            isAuthenticated: true,
        });

        renderLogin();
        expect(screen.getByText("Dashboard Page")).toBeInTheDocument();

        // Reset for valid state flow if needed (though beforeEach clears mocks)
        useAuthMockFn.mockReturnValue({
            login: loginMock,
            isAuthenticated: false,
        });
    });
});
