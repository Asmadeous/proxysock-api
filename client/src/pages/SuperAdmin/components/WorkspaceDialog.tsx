import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface WorkspaceDialogProps {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
    description?: ReactNode;
    headerActions?: ReactNode;
    footer?: ReactNode;
    wide?: boolean;
    tall?: boolean;
    children: ReactNode;
}

// Modal in the customer dashboard style. Closes on Escape and on backdrop click.
export default function WorkspaceDialog({ open, onClose, title, description, headerActions, footer, wide, tall, children }: WorkspaceDialogProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div className="ws-dialog-layer" style={{ zIndex: 100 }}>
            <div className="ws-dialog-backdrop" onClick={onClose} aria-hidden="true" />
            <div role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined} className="ws-dialog" data-wide={wide} style={tall ? { height: "85dvh" } : undefined}>
                <div className="ws-dialog-header">
                    <div className="min-w-0">
                        <h3>{title}</h3>
                        {description && <div className="mt-1 text-[11px] text-[var(--ov-muted)]">{description}</div>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {headerActions}
                        <button type="button" onClick={onClose} aria-label="Close dialog" className="ws-icon-button"><X aria-hidden="true" /></button>
                    </div>
                </div>
                <div className="ws-dialog-body" style={tall ? { flex: 1 } : undefined}>{children}</div>
                {footer && <div className="ws-dialog-footer">{footer}</div>}
            </div>
        </div>
    );
}
