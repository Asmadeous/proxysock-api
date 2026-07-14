import React from "react";
import { motion } from "framer-motion";
import { 
    XMarkIcon, 
    ArrowPathIcon, 
    CheckCircleIcon, 
    ExclamationTriangleIcon,
    WalletIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface ManageSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string | number;
    autoRenew: boolean;
    renewalMethod: string;
    expiresAt: string;
    onUpdate: () => void;
    isReseller?: boolean;
    api: any; // The generic api client (axios instance)
    apiPrefix?: string; // e.g. '/web/api' for user, '' for reseller (resellerApi base already includes /api/v1)
}

export default function ManageSubscriptionModal({
    isOpen,
    onClose,
    orderId,
    autoRenew,
    renewalMethod,
    expiresAt,
    onUpdate,
    api,
    apiPrefix = '/web/api'
}: ManageSubscriptionModalProps) {
    const [localAutoRenew, setLocalAutoRenew] = React.useState(autoRenew);
    const [localMethod, setLocalMethod] = React.useState(renewalMethod);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        setLocalAutoRenew(autoRenew);
        setLocalMethod(renewalMethod);
    }, [autoRenew, renewalMethod]);

    const handleUpdate = async (updates: { auto_renew?: boolean; renewal_method?: string }) => {
        setLoading(true);
        try {
            await api.post(`${apiPrefix}/orders/${orderId}/update_subscription`, updates);
            toast.success("Subscription settings updated");
            if (updates.auto_renew !== undefined) setLocalAutoRenew(updates.auto_renew);
            if (updates.renewal_method !== undefined) setLocalMethod(updates.renewal_method);
            onUpdate();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to update settings");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-2xl border w-full max-w-lg shadow-2xl overflow-hidden"
            >
                <div className="p-6 border-b flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <ArrowPathIcon className="h-6 w-6 text-primary" />
                        Manage Auto-Renewal
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="font-semibold text-foreground">Auto-Renew Status</h4>
                                <p className="text-sm text-muted-foreground">Toggle automatic renewal for this service</p>
                            </div>
                            <button
                                onClick={() => handleUpdate({ auto_renew: !localAutoRenew })}
                                disabled={loading}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${localAutoRenew ? 'bg-primary' : 'bg-muted'}`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${localAutoRenew ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h4 className="font-semibold text-sm text-foreground">Preferred Payment Method</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'wallet', name: 'Wallet Balance', icon: WalletIcon },
                                    // { id: 'fastspring', name: 'FastSpring Checkout', icon: TicketIcon }
                                ].map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => handleUpdate({ renewal_method: method.id })}
                                        disabled={loading}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${localMethod === method.id
                                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                            : 'border-border hover:bg-muted'
                                            }`}
                                    >
                                        <method.icon className="h-4 w-4 text-muted-foreground" />
                                        <div className="text-left text-sm">
                                            <p className="font-medium text-foreground">{method.name}</p>
                                        </div>
                                        {localMethod === method.id && (
                                            <CheckCircleIcon className="h-4 w-4 text-primary ml-auto" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 text-sm text-yellow-600 dark:text-yellow-500/90">
                        <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                        <p>
                            Ensure your selected method has sufficient funds before <strong>{new Date(expiresAt).toLocaleDateString()}</strong> to avoid service interruption.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 rounded-xl bg-muted hover:bg-muted/80 font-medium transition-colors text-foreground"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
