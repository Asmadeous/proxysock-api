import { useEffect, useState } from "react";
import { ArrowPathIcon, CheckIcon, ClipboardDocumentIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

import { cancelEsimTopup, completeEsimTopup, fetchEsimTopups } from "@/services/adminApi";

// Paid top-ups on MeiSIM phone-number lines. Staff apply the credit in the MeiSIM portal,
// then mark it done here; cancelling refunds the customer's balance.

interface EsimTopup {
    id: string;
    reference: string;
    status: "pending" | "completed" | "cancelled";
    topup_value: number;
    price: number;
    auto: boolean;
    admin_note: string | null;
    order_number: string;
    line: string | null;
    phone_number: string | null;
    iccid: string | null;
    customer: string | null;
    customer_type: string;
    created_at: string;
}

const FILTERS = [
    { value: "pending", label: "To apply" },
    { value: "completed", label: "Done" },
    { value: "cancelled", label: "Refunded" },
    { value: "", label: "All" },
];

const usd = (n: number) => `$${n.toFixed(2)}`;

export default function EsimTopupQueue() {
    const [status, setStatus] = useState("pending");
    const [topups, setTopups] = useState<EsimTopup[]>([]);
    const [pending, setPending] = useState(0);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await fetchEsimTopups(status ? { status } : {});
            setTopups(data.topups);
            setPending(data.pending);
        } catch {
            toast.error("Failed to load eSIM top-ups");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [status]);

    const act = async (topup: EsimTopup, action: "complete" | "cancel") => {
        const question = action === "complete"
            ? `Mark ${topup.reference} as applied? Only do this after adding ${usd(topup.topup_value)} in the MeiSIM portal.`
            : `Cancel ${topup.reference} and refund ${usd(topup.price)} to the customer's balance?`;
        if (!globalThis.confirm(question)) return;
        const note = globalThis.prompt("Note (optional)") ?? undefined;

        setBusyId(topup.id);
        try {
            await (action === "complete" ? completeEsimTopup(topup.id, note) : cancelEsimTopup(topup.id, note));
            toast.success(action === "complete" ? "Marked as applied" : "Cancelled and refunded");
            await load();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Action failed");
        } finally {
            setBusyId(null);
        }
    };

    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied!");
    };

    return (
        <section className="bg-card rounded-xl border border-border p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-foreground">
                        eSIM top-ups
                        {pending > 0 && (
                            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{pending} to apply</span>
                        )}
                    </h2>
                    <p className="text-sm text-muted-foreground">Apply the credit in the MeiSIM portal, then mark it done.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        aria-label="Filter top-ups"
                        className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    >
                        {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <button onClick={load} aria-label="Refresh" className="p-2 rounded-lg border border-border hover:bg-muted">
                        <ArrowPathIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="py-6 text-center text-sm text-muted-foreground animate-pulse">Loading top-ups...</p>
            ) : topups.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No top-ups here.</p>
            ) : (
                <ul className="divide-y divide-border">
                    {topups.map((t) => (
                        <li key={t.id} className="py-3 flex flex-col lg:flex-row lg:items-center gap-3">
                            <div className="min-w-0 flex-1 space-y-1 text-sm">
                                <p className="font-semibold text-foreground">
                                    {usd(t.topup_value)} credit · paid {usd(t.price)}
                                    <span className="ml-2 text-xs font-normal text-muted-foreground">{t.auto ? "Monthly" : "One-time"} · {t.reference}</span>
                                </p>
                                <p className="text-muted-foreground">{t.line || "Line"} · #{t.order_number} · {t.customer} ({t.customer_type})</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
                                    {[["Phone", t.phone_number], ["ICCID", t.iccid]].map(([label, value]) => (
                                        <span key={label} className="flex items-center gap-1">
                                            <span className="text-muted-foreground">{label}:</span> {value || "N/A"}
                                            {value && (
                                                <button onClick={() => copy(value)} aria-label={`Copy ${label}`} className="text-muted-foreground hover:text-foreground">
                                                    <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(t.created_at).toLocaleString()}
                                    {t.admin_note && ` · Note: ${t.admin_note}`}
                                </p>
                            </div>
                            {t.status === "pending" ? (
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => act(t, "complete")}
                                        disabled={busyId === t.id}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
                                    >
                                        <CheckIcon className="w-4 h-4" /> Mark done
                                    </button>
                                    <button
                                        onClick={() => act(t, "cancel")}
                                        disabled={busyId === t.id}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50"
                                    >
                                        <XMarkIcon className="w-4 h-4" /> Cancel &amp; refund
                                    </button>
                                </div>
                            ) : (
                                <span className="shrink-0 rounded-full bg-secondary px-2 py-1 text-[10px] font-bold uppercase text-secondary-foreground">
                                    {t.status === "completed" ? "Applied" : "Refunded"}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
