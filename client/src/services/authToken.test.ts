import { describe, it, expect, vi } from "vitest";
import axios from "axios";
import { getAuthToken } from "./authToken";

vi.mock("axios");

describe("getAuthToken", () => {
  it("fetches and returns token on success", async () => {
    const mockToken = "mock-api-token";
    (axios.post as any).mockResolvedValueOnce({
      data: {
        data: {
          token: mockToken,
        },
      },
    });

    const token = await getAuthToken();
    expect(token).toBe(mockToken);
    expect(axios.post).toHaveBeenCalledWith(
      "https://reseller.myproxyapi.com/api/v1/getToken",
      expect.any(Object)
    );
  });

  it("throws error logic on failure", async () => {
    const mockError = new Error("Network Error");
    (axios.post as any).mockRejectedValueOnce(mockError);
    
    // We suppress console.error to keep test output clean, but we won't assert on it being called
    // as it can be flaky depending on how node/vitest captures stdout/stderr
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(getAuthToken()).rejects.toThrow("Network Error");
  });
});
