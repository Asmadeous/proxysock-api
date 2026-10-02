import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TestimonialsSection } from "./TestimonialsSection";

const motion = vi.hoisted(() => ({ reduced: false }));
vi.mock("framer-motion", () => ({ useReducedMotion: () => motion.reduced }));
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  motion.reduced = false;
  vi.stubGlobal("IntersectionObserver", undefined);
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("Testimonial globe", () => {
  it("automatically cycles into the additional demo stories without a click", () => {
    render(<TestimonialsSection />);
    expect(screen.getByText(/ProxySock's proxy service has been a game-changer/)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByText(/The RDP hosting is perfect/)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByText(/VPS performance exceeds expectations/)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByText(/I want to choose a data plan/)).toBeInTheDocument();
    expect(screen.getByText(/Not a customer review/)).toBeInTheDocument();
  });

  it("holds a hovered story and resumes when the pointer leaves", () => {
    render(<TestimonialsSection />);
    const node = screen.getByRole("button", { name: "Read Sarah Johnson's testimonial" });
    fireEvent(node, Object.assign(new Event("pointerover", { bubbles: true }), { pointerType: "mouse" }));
    act(() => vi.advanceTimersByTime(14000));
    expect(screen.getByText(/The RDP hosting is perfect/)).toBeInTheDocument();
    fireEvent(node, Object.assign(new Event("pointerout", { bubbles: true }), { pointerType: "mouse", relatedTarget: document.body }));
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByText(/VPS performance exceeds expectations/)).toBeInTheDocument();
  });

  it("holds keyboard focus and lets arrow keys select another story", () => {
    render(<TestimonialsSection />);
    const globe = screen.getByRole("group", { name: /Customer story globe/ });
    act(() => globe.focus());
    act(() => vi.advanceTimersByTime(14000));
    expect(screen.getByText(/ProxySock's proxy service has been a game-changer/)).toBeInTheDocument();
    fireEvent.keyDown(globe, { key: "ArrowRight" });
    expect(screen.getByText(/The RDP hosting is perfect/)).toBeInTheDocument();
  });

  it("keeps cycling when the pointer is over the review card", () => {
    render(<TestimonialsSection />);
    const quote = screen.getByText(/ProxySock's proxy service has been a game-changer/);
    fireEvent(quote, Object.assign(new Event("pointerover", { bubbles: true }), { pointerType: "mouse" }));
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByText(/The RDP hosting is perfect/)).toBeInTheDocument();
  });

  it("disables automatic changes for reduced motion", () => {
    motion.reduced = true;
    render(<TestimonialsSection />);
    act(() => vi.advanceTimersByTime(21000));
    expect(screen.getByText(/ProxySock's proxy service has been a game-changer/)).toBeInTheDocument();
  });
});
