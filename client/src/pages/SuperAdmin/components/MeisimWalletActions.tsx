import { useState } from "react";
import { toast } from "sonner";
import { createMeisimTopup, downloadMeisimStatement, previewMeisimTopup } from "../../../services/adminApi";
import MeisimVerifyDialog from "./MeisimVerifyDialog";

const apiError = (error: unknown, fallback: string) =>
    (error as { response?: { data?: { error?: string } } })?.response?.data?.error || fallback;

// Fund the MeiSIM dealer wallet through MeiSIM's own Stripe checkout ($50-$10,000),
// or download its statement. Nothing is charged until the admin pays on Stripe.
export default function MeisimWalletActions() {
    const [amount, setAmount] = useState("100");
    const [fee, setFee] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);
    const [verifyOpen, setVerifyOpen] = useState(false);

    const value = Number(amount);
    const valid = Number.isFinite(value) && value >= 50 && value <= 10000;

    const preview = async () => {
        if (!valid) return;
        setBusy(true);
        try {
            const data = await previewMeisimTopup(value);
            setFee(Number(data.fee));
        } catch (error) {
            toast.error(apiError(error, "Could not get the card fee"));
        } finally {
            setBusy(false);
        }
    };

    const pay = async () => {
        if (!valid) return;
        setBusy(true);
        try {
            const data = await createMeisimTopup(value);
            if (data.checkout_url) window.open(data.checkout_url, "_blank", "noopener,noreferrer");
            else toast.error("MeiSIM returned no checkout link");
        } catch (error) {
            toast.error(apiError(error, "Could not start the top-up"));
        } finally {
            setBusy(false);
        }
    };

    const statement = async () => {
        try {
            const blob = await downloadMeisimStatement();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `meisim-statement-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            toast.error(apiError(error, "Could not download the statement"));
        }
    };

    return (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
            <label htmlFor="meisim-topup" className="text-xs text-muted-foreground">Top up wallet (USD, $50–$10,000)</label>
            <div className="flex gap-2">
                <input
                    id="meisim-topup"
                    type="number"
                    min={50}
                    max={10000}
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setFee(null); }}
                    className="w-24 px-2 py-1.5 rounded-lg border border-border bg-background text-sm"
                />
                <button onClick={preview} disabled={!valid || busy}
                    className="px-3 py-1.5 rounded-lg bg-muted text-sm border border-border disabled:opacity-50">Fee</button>
                <button onClick={pay} disabled={!valid || busy}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50">Pay with card</button>
            </div>
            {!valid && <p className="text-xs text-destructive">Enter between $50 and $10,000.</p>}
            {fee != null && valid && (
                <p className="text-xs text-muted-foreground">Card fee ${fee.toFixed(2)} · you pay ${(value + fee).toFixed(2)}</p>
            )}
            <div className="flex items-center justify-between gap-2 pt-1">
                <button onClick={statement} className="text-xs text-primary underline underline-offset-2">Download statement (CSV)</button>
                <button onClick={() => setVerifyOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-muted text-sm border border-border">Verify eSIM</button>
            </div>
            <MeisimVerifyDialog open={verifyOpen} onOpenChange={setVerifyOpen} />
        </div>
    );
}
