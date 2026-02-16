import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  storeSession,
  isSessionExpired,
  getSession,
  clearSession,
} from "./auth";

describe("auth service", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const TOKEN = "test-token";

  describe("storeSession", () => {
    it("stores token and current time in localStorage", () => {
      storeSession(TOKEN);
      expect(localStorage.getItem("authToken")).toBe(TOKEN);
      expect(localStorage.getItem("lastActivity")).not.toBeNull();
    });
  });

  describe("isSessionExpired", () => {
    it("returns true if no session exists", () => {
      expect(isSessionExpired()).toBe(true);
    });

    it("returns false if session is active (within 20 mins)", () => {
      storeSession(TOKEN);
      expect(isSessionExpired()).toBe(false);
    });

    it("returns true if session is expired (after 20 mins)", () => {
      storeSession(TOKEN);
      // Advance time by 21 minutes
      vi.advanceTimersByTime(21 * 60 * 1000);
      expect(isSessionExpired()).toBe(true);
    });
  });

  describe("getSession", () => {
    it("returns token if valid", () => {
      storeSession(TOKEN);
      expect(getSession()).toBe(TOKEN);
    });

    it("clears session and returns null if expired", () => {
      storeSession(TOKEN);
      vi.advanceTimersByTime(21 * 60 * 1000);
      
      expect(getSession()).toBeNull();
      expect(localStorage.getItem("authToken")).toBeNull();
    });
  });

  describe("clearSession", () => {
    it("removes token and lastActivity", () => {
      storeSession(TOKEN);
      clearSession();
      expect(localStorage.getItem("authToken")).toBeNull();
      expect(localStorage.getItem("lastActivity")).toBeNull();
    });
  });
});
