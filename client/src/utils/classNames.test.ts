import { describe, it, expect } from "vitest";
import { classNames } from "./classNames";

describe("classNames", () => {
  it("joins multiple class names", () => {
    expect(classNames("foo", "bar")).toBe("foo bar");
  });

  it("filters out falsy values", () => {
    expect(classNames("foo", false, "bar", undefined, null)).toBe("foo bar");
  });

  it("returns empty string if no valid classes", () => {
    expect(classNames(false, null, undefined)).toBe("");
  });

  it("handles conditional classes", () => {
    const isTrue = true;
    const isFalse = false;
    expect(classNames("base", isTrue && "active", isFalse && "hidden")).toBe("base active");
  });
});
