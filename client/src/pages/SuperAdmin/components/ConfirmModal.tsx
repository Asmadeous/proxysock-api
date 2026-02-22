import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl w-full max-w-sm p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-full ${destructive ? "bg-red-500/10" : "bg-yellow-500/10"}`}>
                            <ExclamationTriangleIcon className={`h-6 w-6 ${destructive ? "text-red-500" : "text-yellow-500"}`} />
                        </div>
                        <h3 className="text-lg font-semibold text-white">{title}</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-6">{message}</p>
                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                ${destructive ? "bg-red-500 hover:bg-red-600" : "bg-yellow-500 hover:bg-yellow-600"}`}
                        >
                            {loading ? "Processing..." : confirmLabel}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
