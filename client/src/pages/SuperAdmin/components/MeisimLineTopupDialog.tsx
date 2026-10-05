import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import MeisimLineTopupPanel, { type RechargePreset } from "./MeisimLineTopupPanel";

// A queued customer top-up recharged through MeiSIM's API, from its row in the top-up queue.
export default function MeisimLineTopupDialog({ open, onOpenChange, preset, onDone }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    preset?: RechargePreset;
    onDone?: () => void;
}) {
    const [busy, setBusy] = useState(false);

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                {preset && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Recharge {preset.reference} via MeiSIM</DialogTitle>
                            <DialogDescription>
                                Customer paid for ${preset.creditUsd.toFixed(2)} credit{preset.lineName ? ` on ${preset.lineName}` : ""}.
                                Paid from the MeiSIM wallet; the request is marked done when MeiSIM confirms.
                            </DialogDescription>
                        </DialogHeader>
                        <MeisimLineTopupPanel preset={preset} onDone={onDone} onBusyChange={setBusy} />
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
