import { useState } from "react";
import WorkspaceDialog from "./WorkspaceDialog";
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
        <WorkspaceDialog
            open={open && !!preset}
            onClose={() => { if (!busy) onOpenChange(false); }}
            title={preset ? `Recharge ${preset.reference} via MeiSIM` : "Recharge via MeiSIM"}
            description={preset ? `Customer paid for $${preset.creditUsd.toFixed(2)} credit${preset.lineName ? ` on ${preset.lineName}` : ""}. Paid from the MeiSIM wallet; the request is marked done when MeiSIM confirms.` : undefined}
        >
            {preset && <MeisimLineTopupPanel preset={preset} onDone={onDone} onBusyChange={setBusy} />}
        </WorkspaceDialog>
    );
}
