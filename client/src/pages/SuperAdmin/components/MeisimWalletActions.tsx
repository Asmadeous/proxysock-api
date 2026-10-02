import { useState } from "react";
import { toast } from "sonner";
import { Download, ShieldCheck, Wallet } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createMeisimTopup, downloadMeisimStatement, previewMeisimTopup } from "../../../services/adminApi";
import MeisimVerifyDialog from "./MeisimVerifyDialog";

const apiError = (error: unknown, fallback: string) =>
    (error as { response?: { data?: { error?: string } } })?.response?.data?.error || fallback;

const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm";

// Fund the MeiSIM wallet through MeiSIM's Stripe checkout ($50-$10,000).
function TopupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
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
            if (data.checkout_url) {
                window.open(data.checkout_url, "_blank", "noopener,noreferrer");
                onOpenChange(false);
            } else {
                toast.error("MeiSIM returned no checkout link");
            }
        } catch (error) {
            toast.error(apiError(error, "Could not start the top-up"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Top up MeiSIM wallet</DialogTitle>
                    <DialogDescription>Paid by card on MeiSIM's Stripe checkout.</DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5">
                    <label htmlFor="meisim-topup" className="text-sm font-medium">Amount (USD)</label>
                    <div className="flex gap-2">
                        <input
                            id="meisim-topup"
                            type="number"
                            min={50}
                            max={10000}
                            value={amount}
                            onChange={(e) => { setAmount(e.target.value); setFee(null); }}
                            className={inputClass}
                        />
                        <button onClick={preview} disabled={!valid || busy}
                            className="px-3 rounded-lg border border-border text-sm disabled:opacity-50">Fee</button>
                    </div>
                    <p className={`text-xs ${valid ? "text-muted-foreground" : "text-destructive"}`}>
                        {!valid ? "Between $50 and $10,000" : fee != null ? `Card fee $${fee.toFixed(2)} · total $${(value + fee).toFixed(2)}` : "$50 – $10,000"}
                    </p>
                </div>
                <DialogFooter>
                    <button onClick={pay} disabled={!valid || busy}
                        className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                        Pay with card
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function MeisimWalletActions() {
    const [topupOpen, setTopupOpen] = useState(false);
    const [verifyOpen, setVerifyOpen] = useState(false);

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

    const action = "flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-sm font-medium transition-colors";

    return (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setTopupOpen(true)} className={action}>
                    <Wallet className="w-4 h-4" aria-hidden="true" /> Top up
                </button>
                <button onClick={() => setVerifyOpen(true)} className={action}>
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Verify eSIM
                </button>
            </div>
            <button onClick={statement} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Download className="w-3.5 h-3.5" aria-hidden="true" /> Statement (CSV)
            </button>
            <TopupDialog open={topupOpen} onOpenChange={setTopupOpen} />
            <MeisimVerifyDialog open={verifyOpen} onOpenChange={setVerifyOpen} />
        </div>
    );
}
