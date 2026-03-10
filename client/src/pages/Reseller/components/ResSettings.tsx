import { useState, useEffect } from "react";
import { UserIcon, BuildingOfficeIcon, EnvelopeIcon, KeyIcon } from "@heroicons/react/24/outline";
import { fetchResellerProfile, updateResellerProfile } from "../../../services/resellerApi";
import { toast } from "react-hot-toast";

export default function ResSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        id: null,
        company_name: "",
        email: "",
        username: "",
        dedicated_api_key: ""
    });

    useEffect(() => {
        fetchResellerProfile()
            .then(res => {
                // The /resellers index usually returns a list or a single object if filtered by token.
                // Assuming the backend returns the current reseller object or a list with it.
                const data = Array.isArray(res.data) ? res.data[0] : res.data;
                setProfile({
                    id: data.id,
                    company_name: data.company_name || "",
                    email: data.email || "",
                    username: data.username || "",
                    dedicated_api_key: data.dedicated_api_key || ""
                });
            })
            .catch(() => toast.error("Failed to load profile"))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        if (!profile.id) return;
        setSaving(true);
        try {
            await updateResellerProfile(profile.id, {
                company_name: profile.company_name,
                username: profile.username
            });
            toast.success("Profile updated successfully");
            // Update local storage if needed
            const user = JSON.parse(localStorage.getItem("resellerUser") || "{}");
            localStorage.setItem("resellerUser", JSON.stringify({ ...user, company_name: profile.company_name, username: profile.username }));
        } catch {
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-black tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1 font-medium italic">Manage your reseller node and partner identity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-card border-none shadow-2xl rounded-3xl p-8 space-y-6">
                        <h3 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter">
                            <UserIcon className="w-6 h-6 text-primary" /> Profile Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Username</label>
                                <div className="relative group">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        className="w-full bg-muted/30 border border-border/50 p-4 pl-12 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        value={profile.username}
                                        onChange={e => setProfile({ ...profile, username: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                                <div className="relative">
                                    <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        className="w-full bg-muted/10 border border-border/50 p-4 pl-12 rounded-2xl text-sm font-bold opacity-50 cursor-not-allowed"
                                        value={profile.email}
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Company Name</label>
                                <div className="relative group">
                                    <BuildingOfficeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        className="w-full bg-muted/30 border border-border/50 p-4 pl-12 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        value={profile.company_name}
                                        onChange={e => setProfile({ ...profile, company_name: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-primary text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {saving ? "Saving Changes..." : "Save Production Data"}
                            </button>
                        </div>
                    </div>

                    {profile.dedicated_api_key && (
                        <div className="bg-zinc-950 text-white rounded-3xl p-8 space-y-4 border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                <KeyIcon className="w-24 h-24" />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tighter">API Infrastructure Key</h3>
                            <p className="text-xs text-zinc-400 font-medium max-w-sm">Your dedicated static key for enterprise integrations. Keep this secret and secure.</p>
                            <div className="bg-white/5 p-4 rounded-xl font-mono text-xs text-primary font-bold border border-white/5">
                                {profile.dedicated_api_key}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-card border-none shadow-2xl rounded-3xl p-8 space-y-4">
                        <h4 className="text-sm font-black uppercase tracking-widest">Account Status</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Identity</div>
                                <div className="text-xs font-black text-emerald-600">VERIFIED</div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                                <div className="text-[10px] font-black text-primary uppercase tracking-widest">Node Level</div>
                                <div className="text-xs font-black text-primary">V4_ULTRA</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
