import { useEffect } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
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
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="confirm-title"
                    aria-describedby="confirm-message"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-[95vw] sm:max-w-sm p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-full ${destructive ? "bg-destructive/10" : "bg-yellow-500/10"}`}>
                            <ExclamationTriangleIcon
                                className={`h-6 w-6 ${destructive ? "text-destructive" : "text-yellow-500"}`}
                                aria-hidden="true"
                            />
                        </div>
                        <h3 id="confirm-title" className="text-lg font-semibold text-foreground">{title}</h3>
                    </div>
                    <p id="confirm-message" className="text-sm text-muted-foreground mb-6">{message}</p>
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" size="md" onClick={onClose} type="button">
                            Cancel
                        </Button>
                        <Button
                            variant={destructive ? "danger" : "primary"}
                            size="md"
                            onClick={onConfirm}
                            loading={loading}
                            type="button"
                            className={!destructive ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}
                        >
                            {confirmLabel}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
