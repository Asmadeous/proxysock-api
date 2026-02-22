import { type ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

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
    if (!open) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className={`relative bg-card rounded-2xl border border-border shadow-2xl w-full overflow-hidden
            ${wide ? "max-w-2xl" : "max-w-md"}`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-4">
                        {children}
                    </div>

                    {/* Footer */}
                    {onSubmit && (
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onSubmit}
                                disabled={loading}
                                className="px-5 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? "Saving..." : submitLabel}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// ── Form field helper ───────────────────────────
interface FieldProps {
    label: string;
    children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
            {children}
        </div>
    );
}

export const inputClasses =
    "w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors";

export const selectClasses =
    "w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary transition-colors";
