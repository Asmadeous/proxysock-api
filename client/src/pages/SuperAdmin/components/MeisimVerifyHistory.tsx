import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { downloadMeisimVerifyResults, fetchMeisimVerifyHistory } from "../../../services/adminApi";
import { adminQueryKeys } from "../queries/queryKeys";

interface Progress {
    total?: number;
    pending?: number;
    in_progress?: number;
    available?: number;
    used?: number;
    invalid?: number;
    unknown?: number;
    error_count?: number;
}

interface Batch {
    batch_id: string;
    codes: number;
    submitted_at: string;
    submitted_by?: string | null;
    progress: Progress | null;
}

const BUCKETS: [keyof Progress, string][] = [
    ["used", "used"],
    ["available", "available"],
    ["invalid", "invalid"],
    ["unknown", "unknown"],
    ["error_count", "error (refunded)"],
];

const left = (progress: Progress | null) => (progress?.pending ?? 0) + (progress?.in_progress ?? 0);

const summary = (progress: Progress | null) => {
    if (!progress) return "MeiSIM did not answer, try again shortly";
    if (left(progress) > 0) return `Checking ${left(progress)} of ${progress.total ?? left(progress)}…`;
    const counts = BUCKETS.filter(([key]) => (progress[key] ?? 0) > 0).map(([key, label]) => `${progress[key]} ${label}`);
    return counts.join(" · ") || "No results";
};

const when = (iso: string) =>
    new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

// Recent bulk eSIM Verify checks on the MeiSIM page, so their results stay after leaving
// the page. Refreshes every 15s while MeiSIM is still checking a batch.
export default function MeisimVerifyHistory({ refreshKey = 0 }: { refreshKey?: number }) {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: adminQueryKeys.meisimVerify.history(),
        queryFn: fetchMeisimVerifyHistory,
        refetchInterval: (current?: { batches?: Batch[] }) =>
            current?.batches?.some((batch) => left(batch.progress) > 0) ? 15000 : false,
    });

    useEffect(() => {
        if (refreshKey) refetch();
    }, [refreshKey, refetch]);

    const download = async (batch: Batch) => {
        try {
            const url = URL.createObjectURL(await downloadMeisimVerifyResults(batch.batch_id));
            const a = document.createElement("a");
            a.href = url;
            a.download = `esim-verify-${batch.batch_id}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Could not download the results");
        }
    };

    if (isLoading) return <p className="text-xs ws-muted">Loading recent eSIM checks…</p>;
    if (isError) return <p className="text-xs ws-bad">Could not load recent eSIM checks</p>;

    const batches: Batch[] = data?.batches ?? [];
    if (batches.length === 0) return <p className="text-xs ws-muted">No eSIM checks yet.</p>;

    return (
        <div className="space-y-1.5">
            <p className="ws-section-title">Recent eSIM checks</p>
            <ul className="ws-list">
                {batches.map((batch) => (
                    <li key={batch.batch_id} className="!block text-[11px]">
                        <div className="flex items-center justify-between gap-2">
                            <span className="ws-muted">
                                {when(batch.submitted_at)} · {batch.codes} code{batch.codes === 1 ? "" : "s"}
                                {batch.submitted_by ? ` · ${batch.submitted_by}` : ""}
                            </span>
                            <button
                                onClick={() => download(batch)}
                                aria-label={`Download results (CSV) of the ${when(batch.submitted_at)} check`}
                                className="flex items-center gap-1 text-[var(--ov-accent)]"
                            >
                                <Download className="w-3.5 h-3.5" aria-hidden="true" /> CSV
                            </button>
                        </div>
                        <p className="mt-1">{summary(batch.progress)}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
