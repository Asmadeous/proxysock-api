import { useState } from "react";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, RefreshCw, Key, ShieldCheck, Code } from "lucide-react";

import { rotateResellerApiKey } from "../../../services/resellerApi";
import { getApiError } from "../../SuperAdmin/utils/errors";
import ConfirmModal from "../../SuperAdmin/components/ConfirmModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResApiKeys() {
    const [resellerUser, setResellerUser] = useState(() => JSON.parse(localStorage.getItem("resellerUser") || "{}"));
    const [showKey, setShowKey] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const [showRotateConfirm, setShowRotateConfirm] = useState(false);

    const isEnterprise = resellerUser?.reseller_type === "infrastructure";
    const apiKey = isEnterprise ? resellerUser?.dedicated_api_key : resellerUser?.permanent_api_key;
    const username = resellerUser?.username;

    const handleRotate = async () => {
        setIsRotating(true);
        try {
            const { data } = await rotateResellerApiKey(resellerUser.id);
            const updatedUser = { ...resellerUser, dedicated_api_key: data.dedicated_api_key };
            localStorage.setItem("resellerUser", JSON.stringify(updatedUser));
            setResellerUser(updatedUser);
            toast.success("API Key rotated successfully");
            globalThis.dispatchEvent(new CustomEvent("reseller-user-updated", { detail: updatedUser }));
        } catch (err: any) {
            toast.error(getApiError(err, "Failed to rotate API key"));
        } finally {
            setIsRotating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    return (
        <>
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded bg-[var(--ov-wash)] flex items-center justify-center border border-[var(--ov-line)]">
                    <Key className="w-6 h-6 ws-info" />
                </div>
                <div>
                    <h2 className="text-3xl font-medium tracking-tight text-foreground font-inter">API Management</h2>
                    <p className="text-muted-foreground font-medium">Configure and manage your secure access credentials</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Credentials Card */}
                <div className="relative group overflow-hidden bg-[var(--ov-panel)] rounded border border-border/50 ">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--ov-wash)] rounded-full -mr-32 -mt-32 blur-3xl" />
                    
                    <div className="relative p-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-[10px] font-medium uppercase tracking-[0.2em] ws-info">
                                    {isEnterprise ? "Enterprise Integration" : "Programmatic Access"}
                                </label>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-medium tracking-tight">
                                        {isEnterprise ? "Dedicated Environment" : "API Only Credentials"}
                                    </h3>
                                    <ShieldCheck className="w-5 h-5 ws-good" />
                                </div>
                            </div>
                            {isEnterprise && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowRotateConfirm(true)}
                                    disabled={isRotating}
                                    className="rounded border-[var(--ov-line)] hover:bg-[var(--ov-wash)] ws-info font-medium px-4 py-5"
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${isRotating ? 'animate-spin' : ''}`} />
                                    Rotate Key
                                </Button>
                            )}
                        </div>

                        <div className="grid gap-6">
                            {/* Username (API Only) */}
                            {!isEnterprise && (
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground px-1">API Username</label>
                                    <div className="relative">
                                        <Input
                                            value={username}
                                            readOnly
                                            className="h-14 rounded bg-[var(--ov-wash)] border-none ring-1 ring-border/50 font-mono pr-20"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(username)}
                                            aria-label="Copy username"
                                            className="absolute right-2 top-2 bottom-2 rounded hover:bg-background"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* API Key */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground px-1">
                                    {isEnterprise ? "Dedicated API Key" : "Permanent API Key"}
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showKey ? "text" : "password"}
                                        readOnly
                                        value={apiKey || "Not Generated"}
                                        className="h-16 rounded bg-[var(--ov-wash)] border-none ring-1 ring-border/50 focus-visible:ring-2 focus-visible:ring-blue-600 font-mono text-lg pr-32 font-medium"
                                    />
                                    <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowKey(!showKey)}
                                            aria-label={showKey ? "Hide API key" : "Show API key"}
                                            className="h-full px-4 rounded hover:bg-background shadow-none"
                                        >
                                            {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => copyToClipboard(apiKey)}
                                            aria-label="Copy API key"
                                            className="h-full px-4 rounded hover:bg-background shadow-none"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {!isEnterprise && (
                                <div className="p-4 bg-[var(--ov-wash)] rounded border border-[var(--ov-line)]">
                                    <div className="flex items-center gap-2 ws-info font-medium mb-1">
                                        <RefreshCw className="w-4 h-4" />
                                        <p className="text-sm">Rotational Token System</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                        Use your <strong>Username</strong> and <strong>Permanent API Key</strong> ABOVE to generate single-use rotational tokens via <code>/api/v1/auth/token</code>. 
                                        Each subsequent API response will provide a new token in the <code>X-Next-Token</code> header.
                                    </p>
                                </div>
                            )}

                            {isEnterprise && (
                                <p className="text-xs text-muted-foreground font-medium px-2">
                                    This key is persistent. For security, we recommend rotating it every 90 days.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Information Grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-6 bg-[var(--ov-panel)] rounded border border-border/50 space-y-3">
                        <div className="w-10 h-10 rounded bg-[var(--ov-wash)] flex items-center justify-center border border-[var(--ov-line)]">
                            <ShieldCheck className="w-5 h-5 ws-wait" />
                        </div>
                        <h4 className="font-medium tracking-tight">Security Protocol</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                            {isEnterprise 
                                ? "Infrastructure partners use dedicated keys for direct backend service access. Keep this key confidential."
                                : "API Only partners must exchange their permanent key for short-lived tokens. This ensures maximum security for balance-heavy accounts."}
                        </p>
                    </div>
                    
                    <div className="p-6 bg-[var(--ov-panel)] rounded border border-border/50 space-y-3">
                        <div className="w-10 h-10 rounded bg-[var(--ov-wash)] flex items-center justify-center border border-[var(--ov-line)]">
                            <Code className="w-5 h-5 ws-info" />
                        </div>
                        <h4 className="font-medium tracking-tight">Authorization Format</h4>
                        <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                            {isEnterprise 
                                ? "Authorization: Key {dedicated_api_key}" 
                                : "Authorization: Bearer {rotational_token}"}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <ConfirmModal
            open={showRotateConfirm}
            onClose={() => setShowRotateConfirm(false)}
            onConfirm={() => { setShowRotateConfirm(false); handleRotate(); }}
            title="Rotate API Key"
            message="Are you sure you want to rotate your dedicated API key? All applications using the current key will stop working immediately."
            confirmLabel="Rotate Key"
            loading={isRotating}
            destructive={false}
        />
        </>
    );
}

