import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Loading } from "./loading";

describe("Loading component", () => {
    it("does not render text by default for medium size", () => {
        render(<Loading />);
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    it("renders with custom text", () => {
        render(<Loading text="Please wait" />);
        expect(screen.getByText("Please wait")).toBeInTheDocument();
    });

    it("renders without text when showText is false", () => {
        render(<Loading showText={false} />);
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    it("applies size classes", () => {
        const { container } = render(<Loading size="large" />);
        // Check for large border class in the spinner div
        // We look for the spinner element. The implementation has `sizeClasses` applied to motion.div
        // Logic: Loading -> div -> div -> div (relative) -> motion.div (animate-spin ...)
        // Simpler: check if container has relevant class or text exists.
        // Ideally we inspect specific elements, but given the structure, snapshots might be better or simple existence checks.
        expect(container.getElementsByClassName("h-16 w-16").length).toBeGreaterThan(0);
    });
});
