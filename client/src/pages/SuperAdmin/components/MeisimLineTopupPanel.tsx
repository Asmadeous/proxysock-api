import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { checkMeisimLine, fetchMeisimTopupNetworks, rechargeMeisimLine } from "../../../services/adminApi";
import { adminQueryKeys } from "../queries/queryKeys";

interface Plan {
    code: string;
    name: string;
    value?: number | string | null;
}

interface Offer {
    plans: Plan[];
    credit_amounts: number[];
    raw?: unknown;
}

// A queued customer top-up being applied: the line is filled in, and success completes it.
export interface RechargePreset {
    line: string;
    topupId: string;
    reference: string;
    creditUsd: number;
    lineName?: string | null;
}

type Choice = { kind: "plan"; code: string } | { kind: "credit"; amount: number } | null;

interface BulkRow {
    network: string;
    line: string;
    value: string;
    plan_code?: string;
    status?: "running" | "applied" | "failed" | "unknown" | "refused";
    message?: string;
}

const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm";

// MeiSIM's answer for a failed call: { result, message } from a recharge, { error } otherwise.
const failure = (error: unknown) => {
    const data = (error as { response?: { data?: { result?: string; message?: string; error?: string } } })?.response?.data;
    return { result: data?.result || "failed", message: data?.message || data?.error || "MeiSIM could not be reached" };
};

// "network, phone or ICCID, amount, plan code (optional)" per line.
const parseRows = (text: string) =>
    text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
        const [network = "", line = "", value = "", plan_code = ""] = l.split(/\s*[,\t]\s*/);
        return { network, line, value, plan_code: plan_code || undefined } as BulkRow;
    });

const rowOk = (row: BulkRow) => row.network && row.line && Number(row.value) > 0;

const STATUS: Record<NonNullable<BulkRow["status"]>, string> = {
    running: "Sending…",
    applied: "Recharged",
    failed: "Failed, nothing charged",
    unknown: "No clear answer, check MeiSIM before retrying",
    refused: "Not sent",
};

// Recharge MeiSIM phone lines through MeiSIM's top-up API, paid from the MeiSIM wallet.
// MeiSIM has no bulk top-up, so bulk sends one line after another. With a preset (a queued
// customer top-up) the line is filled in, bulk is hidden, and success completes the request.
export default function MeisimLineTopupPanel({ preset, onDone, onBusyChange }: {
    preset?: RechargePreset;
    onDone?: () => void;
    onBusyChange?: (busy: boolean) => void;
}) {
    const [mode, setMode] = useState<"one" | "bulk">("one");
    const [network, setNetwork] = useState("");
    const [line, setLine] = useState("");
    const [offer, setOffer] = useState<Offer | null>(null);
    const [choice, setChoice] = useState<Choice>(null);
    const [value, setValue] = useState("");
    const [busy, setBusy] = useState(false);
    const [outcome, setOutcome] = useState<{ ok: boolean; message: string } | null>(null);
    const [bulkText, setBulkText] = useState("");
    const [rows, setRows] = useState<BulkRow[]>([]);

    const networks = useQuery({
        queryKey: adminQueryKeys.meisimLineTopups.networks(),
        queryFn: fetchMeisimTopupNetworks,
        staleTime: 60 * 60 * 1000,
    });
    const networkNames: string[] = networks.data?.networks ?? [];

    useEffect(() => {
        setMode("one");
        setNetwork("");
        setLine(preset?.line ?? "");
        setOffer(null);
        setChoice(null);
        setValue("");
        setOutcome(null);
    }, [preset?.topupId, preset?.line]);

    useEffect(() => {
        onBusyChange?.(busy);
    }, [busy, onBusyChange]);

    const check = async () => {
        setBusy(true);
        setOffer(null);
        setChoice(null);
        setOutcome(null);
        try {
            setOffer(await checkMeisimLine(network.trim(), line.trim()));
        } catch (error) {
            toast.error(failure(error).message);
        } finally {
            setBusy(false);
        }
    };

    const pick = (next: Choice, amount?: number | string | null) => {
        setChoice(next);
        setValue(amount != null && amount !== "" ? String(amount) : "");
    };

    const recharge = async () => {
        if (!choice || !(Number(value) > 0)) return;
        const what = choice.kind === "plan" ? `plan ${choice.code} (${value})` : `${value} credit`;
        if (!confirm(`Recharge ${line} on ${network} with ${what}? Paid from the MeiSIM wallet.`)) return;
        setBusy(true);
        try {
            const data = await rechargeMeisimLine({
                network: network.trim(), line: line.trim(), value,
                plan_code: choice.kind === "plan" ? choice.code : undefined,
                esim_topup_id: preset?.topupId,
            });
            setOutcome({ ok: true, message: `Recharged: ${data.message}` });
            toast.success(preset ? `Recharged and marked ${preset.reference} done` : "Line recharged");
            onDone?.();
        } catch (error) {
            const { result, message } = failure(error);
            setOutcome({ ok: false, message: result === "unknown" ? message : `Not recharged: ${message}` });
            onDone?.();
        } finally {
            setBusy(false);
        }
    };

    const parsed = parseRows(bulkText);
    const badRows = parsed.filter((r) => !rowOk(r)).length;

    const runBulk = async () => {
        if (parsed.length === 0 || badRows > 0) return;
        if (!confirm(`Recharge ${parsed.length} line${parsed.length === 1 ? "" : "s"} from the MeiSIM wallet? Stay on this page until it finishes.`)) return;
        setBusy(true);
        const done: BulkRow[] = parsed.map((r) => ({ ...r }));
        setRows([...done]);
        for (const row of done) {
            row.status = "running";
            setRows([...done]);
            try {
                const data = await rechargeMeisimLine({ network: row.network, line: row.line, value: row.value, plan_code: row.plan_code });
                row.status = "applied";
                row.message = data.message;
            } catch (error) {
                const { result, message } = failure(error);
                row.status = (["unknown", "refused"].includes(result) ? result : "failed") as BulkRow["status"];
                row.message = message;
            }
            setRows([...done]);
        }
        setBusy(false);
        onDone?.();
        const ok = done.filter((r) => r.status === "applied").length;
        toast[ok === done.length ? "success" : "error"](`${ok} of ${done.length} lines recharged`);
    };

    const option = "flex items-start gap-2 rounded-lg border border-border px-3 py-2 text-sm cursor-pointer has-[:checked]:border-primary";

    return (
        <div className="space-y-4">

                {!preset && (
                    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/50 p-1 text-sm" role="tablist">
                        {(["one", "bulk"] as const).map((m) => (
                            <button key={m} role="tab" aria-selected={mode === m} disabled={busy} onClick={() => setMode(m)}
                                className={`rounded-md py-1.5 ${mode === m ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}>
                                {m === "one" ? "One line" : "Bulk"}
                            </button>
                        ))}
                    </div>
                )}

                <datalist id="meisim-networks">
                    {networkNames.map((n) => <option key={n} value={n} />)}
                </datalist>

                {mode === "one" ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <label htmlFor="recharge-network" className="text-sm font-medium">Carrier</label>
                                <input id="recharge-network" list="meisim-networks" value={network}
                                    onChange={(e) => { setNetwork(e.target.value); setOffer(null); }}
                                    placeholder={networks.isLoading ? "Loading…" : "Pick a carrier"} className={inputClass} />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="recharge-line" className="text-sm font-medium">Phone number or ICCID</label>
                                <input id="recharge-line" value={line} onChange={(e) => { setLine(e.target.value); setOffer(null); }}
                                    className={`${inputClass} font-mono`} />
                            </div>
                        </div>
                        {networks.isError && <p className="text-xs text-destructive">Could not load MeiSIM's carriers; type the carrier name.</p>}

                        {offer && (
                            <div className="space-y-3">
                                {offer.plans.length > 0 && (
                                    <fieldset className="space-y-1.5">
                                        <legend className="text-sm font-medium mb-1">Plans</legend>
                                        {offer.plans.map((p) => (
                                            <label key={p.code} className={option}>
                                                <input type="radio" name="recharge-choice" className="mt-0.5"
                                                    checked={choice?.kind === "plan" && choice.code === p.code}
                                                    onChange={() => pick({ kind: "plan", code: p.code }, p.value)} />
                                                <span>{p.name} <span className="text-xs text-muted-foreground font-mono">{p.code}</span>{p.value != null && ` · ${p.value}`}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                )}
                                {offer.credit_amounts.length > 0 && (
                                    <fieldset className="space-y-1.5">
                                        <legend className="text-sm font-medium mb-1">Credit only</legend>
                                        <div className="flex flex-wrap gap-2">
                                            {offer.credit_amounts.map((a) => (
                                                <label key={a} className={option}>
                                                    <input type="radio" name="recharge-choice"
                                                        checked={choice?.kind === "credit" && choice.amount === a}
                                                        onChange={() => pick({ kind: "credit", amount: a }, a)} />
                                                    {a}
                                                </label>
                                            ))}
                                        </div>
                                        {offer.plans.length > 0 && (
                                            <p className="text-xs text-muted-foreground">Credit without a plan is used at the carrier's pay-as-you-go rate.</p>
                                        )}
                                    </fieldset>
                                )}
                                {offer.plans.length === 0 && offer.credit_amounts.length === 0 && (
                                    <p className="text-sm text-destructive">MeiSIM offered no plans or amounts for this line.</p>
                                )}
                                {choice?.kind === "plan" && (
                                    <div className="space-y-1.5">
                                        <label htmlFor="recharge-value" className="text-sm font-medium">Amount sent with the plan (topUpValue)</label>
                                        <input id="recharge-value" type="number" min={0} step="0.01" value={value}
                                            onChange={(e) => setValue(e.target.value)} className={inputClass} />
                                    </div>
                                )}
                                <details className="text-xs text-muted-foreground">
                                    <summary className="cursor-pointer">MeiSIM's answer</summary>
                                    <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted/50 p-2">{JSON.stringify(offer.raw, null, 2)}</pre>
                                </details>
                            </div>
                        )}

                        {outcome && (
                            <p role="status" className={`text-sm ${outcome.ok ? "text-green-600" : "text-destructive"}`}>{outcome.message}</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <label htmlFor="recharge-bulk" className="text-sm font-medium">One line per row: carrier, phone or ICCID, amount, plan code (optional)</label>
                            <textarea id="recharge-bulk" rows={5} value={bulkText} disabled={busy}
                                onChange={(e) => { setBulkText(e.target.value); setRows([]); }}
                                placeholder={"O2-UK, +447700900123, 10\nATT-US, 3055550123, 25, ATT-25"}
                                className={`${inputClass} font-mono resize-y`} />
                            <p className="text-xs text-muted-foreground">
                                Each line is checked with MeiSIM first. No plan code means plain credit, which must be one of the line's credit amounts.
                            </p>
                            {badRows > 0 && (
                                <p className="text-xs text-destructive" role="alert">{badRows} row{badRows === 1 ? "" : "s"} missing a carrier, line or amount</p>
                            )}
                        </div>
                        {rows.length > 0 && (
                            <ul className="divide-y divide-border rounded-lg border border-border text-xs" aria-live="polite">
                                {rows.map((r, i) => (
                                    <li key={i} className="px-3 py-2">
                                        <div className="flex justify-between gap-2 font-mono">
                                            <span>{r.line} · {r.network}</span>
                                            <span>{r.plan_code ? `${r.plan_code} (${r.value})` : `${r.value} credit`}</span>
                                        </div>
                                        <p className={r.status === "applied" ? "text-green-600" : r.status && r.status !== "running" ? "text-destructive" : "text-muted-foreground"}>
                                            {r.status ? STATUS[r.status] : "Waiting"}{r.message && r.status !== "applied" ? `: ${r.message}` : ""}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                <div>
                    {mode === "one" ? (
                        !offer ? (
                            <button onClick={check} disabled={busy || !network.trim() || !line.trim()}
                                className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                                {busy ? "Checking…" : "Check line"}
                            </button>
                        ) : (
                            <button onClick={recharge} disabled={busy || !choice || !(Number(value) > 0) || outcome?.ok}
                                className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                                {busy ? "Recharging…" : "Recharge"}
                            </button>
                        )
                    ) : (
                        <button onClick={runBulk} disabled={busy || parsed.length === 0 || badRows > 0}
                            className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                            {busy ? "Recharging…" : `Recharge ${parsed.length || ""} line${parsed.length === 1 ? "" : "s"}`}
                        </button>
                    )}
                </div>
        </div>
    );
}
