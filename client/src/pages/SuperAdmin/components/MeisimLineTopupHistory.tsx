import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMeisimLineTopups } from "../../../services/adminApi";
import { adminQueryKeys } from "../queries/queryKeys";

interface LineTopup {
    id: string;
    at: string;
    by?: string | null;
    network: string;
    line: string;
    value: string;
    plan_code?: string | null;
    result: "applied" | "failed" | "unknown";
    message?: string | null;
}

const LABEL: Record<LineTopup["result"], string> = {
    applied: "Recharged",
    failed: "Failed, nothing charged",
    unknown: "No clear answer, check MeiSIM",
};

const when = (iso: string) =>
    new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

// The last line recharges on the MeiSIM page, so every result stays visible.
export default function MeisimLineTopupHistory({ refreshKey = 0 }: { refreshKey?: number }) {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: adminQueryKeys.meisimLineTopups.history(),
        queryFn: fetchMeisimLineTopups,
    });

    useEffect(() => {
        if (refreshKey) refetch();
    }, [refreshKey, refetch]);

    if (isLoading) return null;
    if (isError) return <p className="text-xs text-destructive">Could not load recent line recharges</p>;

    const topups: LineTopup[] = data?.topups ?? [];
    if (topups.length === 0) return <p className="text-xs text-muted-foreground">No line recharges yet.</p>;

    return (
        <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Recent line recharges</p>
            <ul className="space-y-1.5">
                {topups.map((t) => (
                    <li key={t.id} className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5 text-xs">
                        <p className="text-muted-foreground">
                            {when(t.at)} · <span className="font-mono">{t.line}</span> · {t.network}{t.by ? ` · ${t.by}` : ""}
                        </p>
                        <p className={t.result === "applied" ? "text-foreground" : "text-destructive"}>
                            {LABEL[t.result] ?? t.result}: {t.plan_code ? `plan ${t.plan_code} (${t.value})` : `${t.value} credit`}
                            {t.result !== "applied" && t.message ? ` · ${t.message}` : ""}
                        </p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
