interface AxiosLike {
    response?: { data?: { error?: string; message?: string } };
    message?: string;
}

function isAxiosLike(err: unknown): err is AxiosLike {
    return typeof err === "object" && err !== null && "response" in err;
}

export function getApiError(err: unknown, fallback = "An error occurred"): string {
    if (isAxiosLike(err)) {
        return err.response?.data?.error || err.response?.data?.message || err.message || fallback;
    }
    if (err instanceof Error) return err.message;
    return fallback;
}
