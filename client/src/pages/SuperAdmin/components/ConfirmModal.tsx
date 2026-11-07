import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "./Button";

interface ConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    loading?: boolean;
    destructive?: boolean;
}

export default function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
    loading = false,
    destructive = true,
}: ConfirmModalProps) {
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="ws-dialog-layer">
            <div className="ws-dialog-backdrop" onClick={onClose} aria-hidden="true" />
            <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message" className="ws-dialog">
                <div className="ws-dialog-header" style={{ justifyContent: "flex-start" }}>
                    <span className="ws-dialog-tone" data-tone={destructive ? undefined : "warn"}><AlertTriangle aria-hidden="true" /></span>
                    <h3 id="confirm-title">{title}</h3>
                </div>
                <div className="ws-dialog-body"><p id="confirm-message">{message}</p></div>
                <div className="ws-dialog-footer">
                    <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                    <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} loading={loading} type="button">{confirmLabel}</Button>
                </div>
            </div>
        </div>
    );
}
