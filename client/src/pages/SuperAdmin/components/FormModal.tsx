import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import Button from "./Button";

interface FormModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    onSubmit?: () => void;
    submitLabel?: string;
    loading?: boolean;
    wide?: boolean;
}

export default function FormModal({
    open,
    onClose,
    title,
    children,
    onSubmit,
    submitLabel = "Save",
    loading = false,
    wide = false,
}: FormModalProps) {
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="ws-dialog-layer">
            <div className="ws-dialog-backdrop" onClick={onClose} aria-hidden="true" />
            <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="ws-dialog" data-wide={wide}>
                <div className="ws-dialog-header">
                    <h3 id="modal-title">{title}</h3>
                    <button type="button" onClick={onClose} aria-label="Close dialog" className="ws-icon-button"><X aria-hidden="true" /></button>
                </div>
                <div className="ws-dialog-body">{children}</div>
                {onSubmit && (
                    <div className="ws-dialog-footer">
                        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                        <Button variant="primary" onClick={onSubmit} loading={loading} type="button">{submitLabel}</Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Form field helper ───────────────────────────
interface FieldProps {
    label: string;
    children: ReactNode;
    error?: string;
    hint?: string;
    id?: string;
}

export function Field({ label, children, error, hint, id }: FieldProps) {
    return (
        <div className="ws-field">
            <label htmlFor={id}>{label}</label>
            {children}
            {error && <p id={id ? `${id}-error` : undefined} role="alert" className="ws-field-error">{error}</p>}
            {!error && hint && <p className="ws-field-hint">{hint}</p>}
        </div>
    );
}

export const inputClasses = "ws-input";

export const selectClasses = "ws-input";
