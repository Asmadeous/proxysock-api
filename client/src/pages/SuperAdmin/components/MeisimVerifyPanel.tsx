import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { downloadMeisimVerifyResults, fetchMeisimVerify, submitMeisimVerify } from "../../../services/adminApi";

interface Progress {
    total?: number;
    pending?: number;
    in_progress?: number;
    available?: number;
    used?: number;
    invalid?: number;
    error_count?: number;
    unknown?: number;
}

const LPA = /^LPA:1\$[^$\s]+\$\S+$/i;
const POLL_MS = 15000;

const apiError = (error: unknown, fallback: string) =>
    (error as { response?: { data?: { error?: string } } })?.response?.data?.error || fallback;

const TILES: { key: keyof Progress; label: string }[] = [
    { key: "available", label: "Available" },
    { key: "used", label: "Used" },
    { key: "invalid", label: "Invalid" },
    { key: "unknown", label: "Unknown" },
    { key: "error_count", label: "Error" },
];

const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm";

// MeiSIM eSIM Verify: checks activation codes without using them up. $1 per code from
// the MeiSIM wallet; codes whose check errors are refunded. Every batch also stays in the
// recent checks list, so leaving the page loses nothing.
export default function MeisimVerifyPanel({ onSubmitted }: { onSubmitted?: () => void }) {
    const [codes, setCodes] = useState("");
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [batchId, setBatchId] = useState<string | null>(null);
    const [progress, setProgress] = useState<Progress | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout>>();

    const lines = codes.split(/[\s,]+/).map((c) => c.trim()).filter(Boolean);
    const unique = [...new Set(lines)];
    const invalid = unique.filter((c) => !LPA.test(c));
    const running = !!progress && ((progress.pending ?? 0) + (progress.in_progress ?? 0)) > 0;

    const poll = async (id: string) => {
        try {
            const data = await fetchMeisimVerify(id);
            setProgress(data.progress || {});
            const left = (data.progress?.pending ?? 0) + (data.progress?.in_progress ?? 0);
            if (left > 0) timer.current = setTimeout(() => poll(id), POLL_MS);
        } catch (error) {
            toast.error(apiError(error, "Could not read the verification progress"));
        }
    };

    useEffect(() => () => clearTimeout(timer.current), []);

    const reset = () => {
        clearTimeout(timer.current);
        setCodes("");
        setEmail("");
        setBatchId(null);
        setProgress(null);
    };

    const submit = async () => {
        if (unique.length === 0 || invalid.length > 0) return;
        if (!confirm(`Verify ${unique.length} eSIM${unique.length === 1 ? "" : "s"} for $${unique.length} from the MeiSIM wallet?`)) return;
        setSubmitting(true);
        try {
            const data = await submitMeisimVerify(unique.join("\n"), email.trim() || undefined);
            setBatchId(data.batch_id);
            setProgress({ total: data.total_rows, pending: data.total_rows });
            toast.success(`Submitted. $${Number(data.charged_usd ?? unique.length).toFixed(2)} charged to the MeiSIM wallet.`);
            onSubmitted?.();
            timer.current = setTimeout(() => poll(data.batch_id), POLL_MS);
        } catch (error) {
            toast.error(apiError(error, "Verification could not be submitted"));
        } finally {
            setSubmitting(false);
        }
    };

    const download = async () => {
        if (!batchId) return;
        try {
            const url = URL.createObjectURL(await downloadMeisimVerifyResults(batchId));
            const a = document.createElement("a");
            a.href = url;
            a.download = `esim-verify-${batchId}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            toast.error(apiError(error, "Could not download the results"));
        }
    };

    if (batchId) {
        return (
            <div className="space-y-3" aria-live="polite">
                <div className="grid grid-cols-5 gap-2">
                    {TILES.map((tile) => (
                        <div key={tile.key} className="rounded-lg border border-border bg-muted/40 px-2 py-2 text-center">
                            <div className="text-lg font-semibold tabular-nums">{progress?.[tile.key] ?? 0}</div>
                            <div className="text-[11px] text-muted-foreground">{tile.label}</div>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                    {running ? `Checking ${(progress?.pending ?? 0) + (progress?.in_progress ?? 0)}… it keeps running if you leave; the result stays in Recent checks.` : "Done."}
                </p>
                <div className="flex gap-2">
                    <button onClick={download} className="px-3 py-2 rounded-lg border border-border text-sm">Download CSV</button>
                    <button onClick={reset} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Verify more</button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <label htmlFor="verify-codes" className="text-sm font-medium">Activation codes</label>
                <textarea id="verify-codes" value={codes} onChange={(e) => setCodes(e.target.value)} rows={4}
                    placeholder="LPA:1$…  (one per line)" className={`${inputClass} font-mono resize-y`} />
                {invalid.length > 0 && (
                    <p className="text-xs text-destructive" role="alert">
                        Not a code: {invalid.slice(0, 2).join(", ")}{invalid.length > 2 ? ` +${invalid.length - 2}` : ""}
                    </p>
                )}
            </div>
            <div className="space-y-1.5">
                <label htmlFor="verify-email" className="text-sm font-medium">Results email <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input id="verify-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                    {unique.length} code{unique.length === 1 ? "" : "s"} · <span className="font-semibold text-foreground">${unique.length}</span>
                </span>
                <button onClick={submit} disabled={submitting || unique.length === 0 || invalid.length > 0}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                    {submitting ? "Submitting…" : "Verify"}
                </button>
            </div>
        </div>
    );
}
