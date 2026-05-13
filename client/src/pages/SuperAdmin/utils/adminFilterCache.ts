const cache = new Map<string, string>();

export function saveTabFilters(tabId: string, params: URLSearchParams): void {
    const copy = new URLSearchParams(params);
    copy.delete("tab");
    const str = copy.toString();
    if (str) cache.set(tabId, str);
    else cache.delete(tabId);
}

export function restoreTabFilters(tabId: string): URLSearchParams | null {
    const str = cache.get(tabId);
    return str ? new URLSearchParams(str) : null;
}
