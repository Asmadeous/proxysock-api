import axios from "axios";

/**
 * Extract a human-readable error message from an API error.
 *
 * Priority:
 *  1. response.data.message  (Rails: "Validation failed: Username has already been taken")
 *  2. response.data.error    (Rails: "Validation Failed" / "Unauthorized")
 *  3. response.data.errors   (Rails: field-level errors object/array joined as a string)
 *  4. fallback               (the static string passed by the caller)
 */
export function getApiError(err: unknown, fallback = "Something went wrong"): string {
    if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (!data) return fallback;

        if (typeof data.message === "string" && data.message) return data.message;
        if (typeof data.error === "string" && data.error) return data.error;

        // Rails errors hash: { email: ["has already been taken"], username: [...] }
        if (data.errors) {
            if (typeof data.errors === "string") return data.errors;
            if (Array.isArray(data.errors)) return data.errors.join(", ");
            if (typeof data.errors === "object") {
                return Object.entries(data.errors)
                    .map(([field, msgs]) => {
                        const list = Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
                        return `${field.charAt(0).toUpperCase() + field.slice(1)} ${list}`;
                    })
                    .join("; ");
            }
        }
        return fallback;
    }
    if (err instanceof Error) return err.message || fallback;
    return fallback;
}
