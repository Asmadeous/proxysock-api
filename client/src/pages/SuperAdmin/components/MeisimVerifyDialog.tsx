import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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

const ROWS: { key: keyof Progress; label: string; hint: string }[] = [
    { key: "available", label: "Available", hint: "never installed, still usable" },
    { key: "used", label: "Used", hint: "already installed on a phone" },
    { key: "invalid", label: "Invalid", hint: "not a real activation code" },
    { key: "unknown", label: "Unknown", hint: "carrier gave no answer" },
    { key: "error_count", label: "Error", hint: "check failed, refunded" },
];

// MeiSIM eSIM Verify: checks activation codes without using them up. $1 per code from
// the MeiSIM wallet; codes whose check errors are refunded.
export default function MeisimVerifyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
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
            const blob = await downloadMeisimVerifyResults(batchId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `esim-verify-${batchId}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            toast.error(apiError(error, "Could not download the results"));
        }
    };

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next); }}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Verify eSIM</DialogTitle>
                    <DialogDescription>
                        Checks whether eSIM activation codes are still unused, without using them up. Costs $1 per code from the MeiSIM wallet; codes whose check errors are refunded.
                    </DialogDescription>
                </DialogHeader>

                {!batchId ? (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label htmlFor="verify-codes" className="text-sm font-medium">Activation codes</label>
                            <textarea
                                id="verify-codes"
                                value={codes}
                                onChange={(e) => setCodes(e.target.value)}
                                rows={5}
                                placeholder={"LPA:1$T-MOBILE.IDEMIA.IO$AYU36-O48VE-8PWDE-ZRXGS\nOne per line"}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                One per line, each starting with LPA:1$. Moxee lines have no activation code and cannot be verified.
                            </p>
                            {invalid.length > 0 && (
                                <p className="text-xs text-destructive" role="alert">
                                    Not an activation code: {invalid.slice(0, 3).join(", ")}{invalid.length > 3 ? ` and ${invalid.length - 3} more` : ""}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="verify-email" className="text-sm font-medium">Email the results to (optional)</label>
                            <input
                                id="verify-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ops@proxysock.com"
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                            />
                        </div>
                        <p className="text-sm">
                            {unique.length} code{unique.length === 1 ? "" : "s"} · <span className="font-semibold">${unique.length.toFixed(2)}</span> from the MeiSIM wallet
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3" aria-live="polite">
                        <p className="text-sm text-muted-foreground">
                            {running ? "Checking… results usually arrive within minutes. You can close this window; the batch keeps running." : "Done."}
                        </p>
                        <dl className="grid grid-cols-1 gap-1.5 text-sm">
                            {running && (
                                <div className="flex justify-between"><dt>Still checking</dt><dd className="font-mono">{(progress?.pending ?? 0) + (progress?.in_progress ?? 0)}</dd></div>
                            )}
                            {ROWS.map((row) => (
                                <div key={row.key} className="flex justify-between gap-4">
                                    <dt>{row.label} <span className="text-xs text-muted-foreground">— {row.hint}</span></dt>
                                    <dd className="font-mono">{progress?.[row.key] ?? 0}</dd>
                                </div>
                            ))}
                        </dl>
                        <p className="text-xs text-muted-foreground font-mono break-all">Batch {batchId}</p>
                    </div>
                )}

                <DialogFooter className="gap-2">
                    {!batchId ? (
                        <button
                            onClick={submit}
                            disabled={submitting || unique.length === 0 || invalid.length > 0}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                        >
                            {submitting ? "Submitting…" : `Verify ${unique.length || ""} for $${unique.length}`}
                        </button>
                    ) : (
                        <>
                            <button onClick={download} className="px-4 py-2 rounded-lg border border-border text-sm">Download results (CSV)</button>
                            <button onClick={reset} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Verify more</button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
