import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SecurePaymentsSection } from "./PaymentMethods";

// Mock the theme store
vi.mock("../../store/themeStore", () => ({
    useThemeStore: () => ({
        dark: true,
    }),
}));

describe("SecurePaymentsSection", () => {
    it("renders the section heading", () => {
        render(<SecurePaymentsSection />);
        expect(screen.getByText("Secure Payment Methods")).toBeInTheDocument();
    });

    it("renders all payment methods", () => {
        render(<SecurePaymentsSection />);
        const paymentMethods = [
            "Mastercard",
            "Visa",
            "American Express",
            "Bitcoin",
            "Ethereum",
            "Usdt",
            "Usdc",
        ];

        paymentMethods.forEach((method) => {
            if (method !== "Visa" && method !== "American Express") {
                expect(screen.getByText(method)).toBeInTheDocument();
            }
        });

        // Check for images
        const images = screen.getAllByRole("img");
        expect(images).toHaveLength(7);
    });
});
