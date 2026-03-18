import { useState } from "react";
import { toast } from "react-hot-toast";
import { Copy, Eye, EyeOff, RefreshCw, Key, ShieldCheck, Code } from "lucide-react";

import { rotateResellerApiKey } from "../../../services/resellerApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResApiKeys() {
    const [resellerUser, setResellerUser] = useState(() => JSON.parse(localStorage.getItem("resellerUser") || "{}"));
    const [showKey, setShowKey] = useState(false);
    const [isRotating, setIsRotating] = useState(false);

    const isEnterprise = resellerUser?.reseller_type === "infrastructure";
    const apiKey = isEnterprise ? resellerUser?.dedicated_api_key : resellerUser?.permanent_api_key;
    const username = resellerUser?.username;

    const handleRotate = async () => {
        if (!isEnterprise) {
            toast.error("API Only resellers use permanent keys. Rotation is for Enterprise only.");
            return;
        }

        if (!confirm("Are you sure you want to rotate your dedicated API key? All applications using the current key will stop working immediately.")) return;

        setIsRotating(true);
        try {
            const { data } = await rotateResellerApiKey(resellerUser.id);
            const updatedUser = { ...resellerUser, dedicated_api_key: data.dedicated_api_key };
            localStorage.setItem("resellerUser", JSON.stringify(updatedUser));
            setResellerUser(updatedUser);
            toast.success("API Key rotated successfully");
            globalThis.dispatchEvent(new CustomEvent("reseller-user-updated", { detail: updatedUser }));
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to rotate API key");
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
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                    <Key className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-foreground font-inter">API Management</h2>
                    <p className="text-muted-foreground font-medium">Configure and manage your secure access credentials</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Credentials Card */}
                <div className="relative group overflow-hidden bg-card rounded-[2rem] border border-border/50 shadow-xl shadow-blue-500/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                    
                    <div className="relative p-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/70">
                                    {isEnterprise ? "Enterprise Integration" : "Programmatic Access"}
                                </label>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold tracking-tight">
                                        {isEnterprise ? "Dedicated Environment" : "API Only Credentials"}
                                    </h3>
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                </div>
                            </div>
                            {isEnterprise && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRotate}
                                    disabled={isRotating}
                                    className="rounded-xl border-blue-600/20 hover:bg-blue-600/5 text-blue-600 font-bold px-4 py-5"
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
                                    <label className="text-xs font-bold text-muted-foreground px-1">API Username</label>
                                    <div className="relative">
                                        <Input
                                            value={username}
                                            readOnly
                                            className="h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border/50 font-mono pr-20"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(username)}
                                            className="absolute right-2 top-2 bottom-2 rounded-xl hover:bg-background"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* API Key */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground px-1">
                                    {isEnterprise ? "Dedicated API Key" : "Permanent API Key"}
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showKey ? "text" : "password"}
                                        readOnly
                                        value={apiKey || "Not Generated"}
                                        className="h-16 rounded-2xl bg-muted/40 border-none ring-1 ring-border/50 focus-visible:ring-2 focus-visible:ring-blue-600 font-mono text-lg pr-32 font-medium"
                                    />
                                    <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowKey(!showKey)}
                                            className="h-full px-4 rounded-xl hover:bg-background shadow-none"
                                        >
                                            {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => copyToClipboard(apiKey)}
                                            className="h-full px-4 rounded-xl hover:bg-background shadow-none"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {!isEnterprise && (
                                <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-600/10">
                                    <div className="flex items-center gap-2 text-blue-600 font-bold mb-1">
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
                    <div className="p-6 bg-card rounded-3xl border border-border/50 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-600/10 flex items-center justify-center border border-orange-600/20">
                            <ShieldCheck className="w-5 h-5 text-orange-600" />
                        </div>
                        <h4 className="font-bold tracking-tight">Security Protocol</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                            {isEnterprise 
                                ? "Infrastructure partners use dedicated keys for direct backend service access. Keep this key confidential."
                                : "API Only partners must exchange their permanent key for short-lived tokens. This ensures maximum security for balance-heavy accounts."}
                        </p>
                    </div>
                    
                    <div className="p-6 bg-card rounded-3xl border border-border/50 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center border border-purple-600/20">
                            <Code className="w-5 h-5 text-purple-600" />
                        </div>
                        <h4 className="font-bold tracking-tight">Authorization Format</h4>
                        <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                            {isEnterprise 
                                ? "Authorization: Key {dedicated_api_key}" 
                                : "Authorization: Bearer {rotational_token}"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

