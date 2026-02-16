import { describe, it, expect, vi, beforeEach } from "vitest";
import api from "./api";
import { toast } from "react-hot-toast";

// Mock axios create to stick with our api instance logic which is already created in the file
// But since we are testing the exported 'api' instance which utilizes the global axios, we mocked axios above.
// Actually, `api.ts` exports an instance created by `axios.create()`.
// Vitest will mock axios, but `api` wraps the interceptors.
// To test interceptors, we can check if they were added.

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
    
    // api.ts uses "token" at line 14: localStorage.getItem("token")
    
    // We can simulate a request manually invoking the interceptor handler
    // Accessing the private properties of axios instance for testing purposes
    // @ts-ignore
    const requestInterceptor = api.interceptors.request.handlers[0].fulfilled;

    const config = { headers: {} };
    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBe(`Bearer ${token}`);
  });

  it("request interceptor does not add header if no token", () => {
    // @ts-ignore
    const requestInterceptor = api.interceptors.request.handlers[0].fulfilled;

    const config = { headers: {} };
    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it("response interceptor handles error by showing toast", async () => {
    // @ts-ignore
    const responseErrorInterceptor = api.interceptors.response.handlers[0].rejected;

    const error = {
      response: {
        data: {
          message: "API Error Occurred",
        },
      },
    };

    // The interceptor returns a rejected promise
    await expect(responseErrorInterceptor(error)).rejects.toEqual(error);
    expect(toast.error).toHaveBeenCalledWith("API Error Occurred");
  });
});
