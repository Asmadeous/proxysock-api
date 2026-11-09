import { useEffect, useState } from "react";
import { ArrowPathIcon, BoltIcon, CheckIcon, ClipboardDocumentIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Button from "./Button";
import { toast } from "react-hot-toast";

import { cancelEsimTopup, completeEsimTopup, fetchEsimTopups } from "@/services/adminApi";
import MeisimLineTopupDialog from "./MeisimLineTopupDialog";

// Paid top-ups on MeiSIM phone-number lines. Admins can recharge the line through MeiSIM's
// top-up API, which marks the request done; otherwise staff apply the credit in the MeiSIM
// portal and mark it done here. Cancelling refunds the customer's balance.

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

export default function EsimTopupQueue({ onRecharged }: { onRecharged?: () => void } = {}) {
    const [status, setStatus] = useState("pending");
    const [topups, setTopups] = useState<EsimTopup[]>([]);
    const [pending, setPending] = useState(0);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [rechargeFor, setRechargeFor] = useState<EsimTopup | null>(null);

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
        <section className="ws-panel" aria-labelledby="topups-title">
            <div className="ws-panel-heading">
                <div>
                    <h2 id="topups-title" className="flex items-center gap-2">eSIM top-ups {pending > 0 && <span className="ws-status" data-tone="wait">{pending} to apply</span>}</h2>
                    <p>Apply the credit in the MeiSIM portal, then mark it done.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter top-ups" className="ws-input" style={{ width: "auto" }}>
                        {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <button type="button" onClick={load} aria-label="Refresh" className="ws-icon-button"><ArrowPathIcon className={loading ? "animate-spin" : ""} /></button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3" role="status" aria-label="Loading top-ups">
                    <span className="ws-skeleton block" style={{ height: 14 }} />
                    <span className="ws-skeleton block" style={{ height: 14, maxWidth: "60%" }} />
                </div>
            ) : topups.length === 0 ? (
                <p className="py-4 text-center text-xs ws-muted">No top-ups here.</p>
            ) : (
                <ul className="ws-list">
                    {topups.map((t) => (
                        <li key={t.id} className="flex-col items-stretch lg:flex-row lg:items-center">
                            <div className="min-w-0 flex-1 space-y-1">
                                <p>
                                    <strong className="font-medium">{usd(t.topup_value)} credit</strong> · paid {usd(t.price)}
                                    <span className="ml-2 text-[11px] ws-muted">{t.auto ? "Monthly" : "One-time"} · {t.reference}</span>
                                </p>
                                <p className="text-[11px] ws-muted">{t.line || "Line"} · #{t.order_number} · {t.customer} ({t.customer_type})</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                                    {[["Phone", t.phone_number], ["ICCID", t.iccid]].map(([label, value]) => (
                                        <span key={label} className="flex items-center gap-1">
                                            <span className="ws-muted">{label}</span> <span className="ws-mono">{value || "N/A"}</span>
                                            {value && (
                                                <button type="button" onClick={() => copy(value)} aria-label={`Copy ${label}`} className="text-[var(--ov-accent)]">
                                                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[11px] ws-muted">
                                    {new Date(t.created_at).toLocaleString()}
                                    {t.admin_note && ` · Note: ${t.admin_note}`}
                                </p>
                            </div>
                            {t.status === "pending" ? (
                                <div className="flex shrink-0 flex-wrap gap-2">
                                    {(t.phone_number || t.iccid) && (
                                        <Button size="sm" onClick={() => setRechargeFor(t)} disabled={busyId === t.id}><BoltIcon /> Recharge via MeiSIM</Button>
                                    )}
                                    <Button size="sm" variant="secondary" onClick={() => act(t, "complete")} disabled={busyId === t.id}><CheckIcon /> Mark done</Button>
                                    <Button size="sm" variant="secondary" onClick={() => act(t, "cancel")} disabled={busyId === t.id}><XMarkIcon /> Cancel &amp; refund</Button>
                                </div>
                            ) : (
                                <span className="ws-status shrink-0" data-tone={t.status === "completed" ? "good" : "info"}>{t.status === "completed" ? "Applied" : "Refunded"}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            <MeisimLineTopupDialog
                open={!!rechargeFor}
                onOpenChange={(open) => { if (!open) setRechargeFor(null); }}
                preset={rechargeFor ? {
                    line: rechargeFor.phone_number || rechargeFor.iccid || "", topupId: rechargeFor.id,
                    reference: rechargeFor.reference, creditUsd: rechargeFor.topup_value, lineName: rechargeFor.line,
                } : undefined}
                onDone={() => { load(); onRecharged?.(); }}
            />
        </section>
    );
}
