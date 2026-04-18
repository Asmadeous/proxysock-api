import { useSearchParams } from "react-router-dom";
import { useCallback } from "react";

export function useTabFilters() {
    const [params, setParams] = useSearchParams();

    const get = (key: string, fallback = "") => params.get(key) ?? fallback;

    const getNum = (key: string, fallback = 1) => {
        const val = Number(params.get(key));
        return val > 0 ? val : fallback;
    };

    const update = useCallback(
        (changes: Record<string, string | number>) => {
            setParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    Object.entries(changes).forEach(([k, v]) => {
                        if (v === "" || v === 0 || v == null) next.delete(k);
                        else next.set(k, String(v));
                    });
                    return next;
                },
                { replace: true },
            );
        },
        [setParams],
    );

    return { get, getNum, update };
}
