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

const inputClass = "ws-input";

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
                <dl className="ws-figures">
                    {TILES.map((tile) => (
                        <div key={tile.key}><dt>{tile.label}</dt><dd>{progress?.[tile.key] ?? 0}</dd></div>
                    ))}
                </dl>
                <p className="text-xs ws-muted">
                    {running ? `Checking ${(progress?.pending ?? 0) + (progress?.in_progress ?? 0)}… it keeps running if you leave; the result stays in Recent checks.` : "Done."}
                </p>
                <div className="flex gap-2">
                    <button type="button" onClick={download} className="ws-button" data-variant="secondary">Download CSV</button>
                    <button type="button" onClick={reset} className="ws-button" data-variant="primary">Verify more</button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <label htmlFor="verify-codes" className="ws-label">Activation codes</label>
                <textarea id="verify-codes" value={codes} onChange={(e) => setCodes(e.target.value)} rows={4}
                    placeholder="LPA:1$…  (one per line)" className={`${inputClass} font-mono resize-y`} />
                {invalid.length > 0 && (
                    <p className="text-xs ws-bad" role="alert">
                        Not a code: {invalid.slice(0, 2).join(", ")}{invalid.length > 2 ? ` +${invalid.length - 2}` : ""}
                    </p>
                )}
            </div>
            <div className="space-y-1.5">
                <label htmlFor="verify-email" className="ws-label">Results email <span className="ws-muted font-normal">(optional)</span></label>
                <input id="verify-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs ws-muted">
                    {unique.length} code{unique.length === 1 ? "" : "s"} · <span className="font-semibold">${unique.length}</span>
                </span>
                <button onClick={submit} disabled={submitting || unique.length === 0 || invalid.length > 0}
                    className="ws-button" data-variant="primary">
                    {submitting ? "Submitting…" : "Verify"}
                </button>
            </div>
        </div>
    );
}
