import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Input } from "./input";

describe("Input component", () => {
    it("renders correctly", () => {
        render(<Input placeholder="Enter text" />);
        expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("handles user input", () => {
        const handleChange = vi.fn();
        render(<Input onChange={handleChange} title="input-test" />);
        const input = screen.getByTitle("input-test");

        fireEvent.change(input, { target: { value: "Hello" } });
        expect(handleChange).toHaveBeenCalled();
    });

    it("supports disabled state", () => {
        render(<Input disabled placeholder="Disabled" />);
        expect(screen.getByPlaceholderText("Disabled")).toBeDisabled();
    });

    it("applies custom className", () => {
        const { container } = render(<Input className="custom-class" />);
        expect(container.firstChild).toHaveClass("custom-class");
    });
});
