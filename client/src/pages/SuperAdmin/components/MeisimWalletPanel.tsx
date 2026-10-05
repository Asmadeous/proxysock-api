import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { createMeisimTopup, downloadMeisimStatement, previewMeisimTopup } from "../../../services/adminApi";

const apiError = (error: unknown, fallback: string) =>
    (error as { response?: { data?: { error?: string } } })?.response?.data?.error || fallback;

const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm";

// Fund the MeiSIM wallet through MeiSIM's Stripe checkout ($50-$10,000), and download its
// statement. Nothing is charged until the admin pays on Stripe.
export default function MeisimWalletPanel() {
    const [amount, setAmount] = useState("100");
    const [fee, setFee] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);

    const value = Number(amount);
    const valid = Number.isFinite(value) && value >= 50 && value <= 10000;

    const preview = async () => {
        if (!valid) return;
        setBusy(true);
        try {
            setFee(Number((await previewMeisimTopup(value)).fee));
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
            const url = URL.createObjectURL(await downloadMeisimStatement());
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
        <div className="space-y-4">
            <div className="space-y-1.5">
                <label htmlFor="meisim-topup" className="text-sm font-medium">Top up amount (USD)</label>
                <div className="flex gap-2">
                    <input id="meisim-topup" type="number" min={50} max={10000} value={amount}
                        onChange={(e) => { setAmount(e.target.value); setFee(null); }} className={inputClass} />
                    <button onClick={preview} disabled={!valid || busy}
                        className="px-3 rounded-lg border border-border text-sm disabled:opacity-50">Fee</button>
                </div>
                <p className={`text-xs ${valid ? "text-muted-foreground" : "text-destructive"}`}>
                    {!valid ? "Between $50 and $10,000" : fee != null ? `Card fee $${fee.toFixed(2)} · total $${(value + fee).toFixed(2)}` : "$50 – $10,000, paid by card on MeiSIM's Stripe checkout"}
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <button onClick={pay} disabled={!valid || busy}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                    Pay with card
                </button>
                <button onClick={statement} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted">
                    <Download className="w-4 h-4" aria-hidden="true" /> Statement (CSV, last 90 days)
                </button>
            </div>
        </div>
    );
}
