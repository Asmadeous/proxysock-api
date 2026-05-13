import { describe, it, expect, vi, beforeEach } from "vitest";
import api from "./api";
import { toast } from "sonner";

vi.mock("react-hot-toast", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("api service interceptors", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("request interceptor adds authorization header if token exists", async () => {
    const token = "stored-token";
    localStorage.setItem("authToken", token);

    // @ts-ignore - accessing internal handlers for testing
    const requestInterceptor = api.interceptors.request.handlers[0].fulfilled;

    const config: any = { headers: {} };
    const result: any = requestInterceptor(config);

    expect(result.headers.Authorization).toBe(`Bearer ${token}`);
  });

  it("request interceptor does not add header if no token", () => {
    // @ts-ignore
    const requestInterceptor = api.interceptors.request.handlers[0].fulfilled;

    const config: any = { headers: {} };
    const result: any = requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it("response interceptor handles error by showing toast", async () => {
    // @ts-ignore
    const responseErrorInterceptor = api.interceptors.response.handlers[0].rejected!;

    const error = {
      response: {
        data: {
          message: "API Error Occurred",
        },
      },
    };

    await expect(responseErrorInterceptor(error)).rejects.toEqual(error);
    expect(toast.error).toHaveBeenCalledWith("API Error Occurred");
  });
});
