import { useState, useEffect, useMemo } from "react";
import { Copy, Eye, EyeOff } from "lucide-react";
import { fetchResellerProfile, updateResellerProfile } from "../../../services/resellerApi";
import { toast } from "sonner";
import { formatImageUrl } from "../../../services/api";
import CountrySelect from "../../../components/ui/CountrySelect";
import ChangePassword from "../../UserDashboard/ChangePassword";
import PageHeader from "../../SuperAdmin/components/PageHeader";
import Button from "../../SuperAdmin/components/Button";

const TIER_LABELS: Record<string, string> = { infrastructure: "Enterprise", single_product: "Single product", api_only: "API" };

export default function ResSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        id: null,
        company_name: "",
        email: "",
        username: "",
        dedicated_api_key: "",
        profile_picture_url: "",
        country_code: "US",
        country: "United States",
        city: ""
    });
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [showKey, setShowKey] = useState(false);
    const tier = JSON.parse(localStorage.getItem("resellerUser") || "{}")?.reseller_type as string | undefined;

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
                    dedicated_api_key: data.dedicated_api_key || "",
                    profile_picture_url: data.profile_picture_url || "",
                    country_code: data.country_code || "US",
                    country: data.country || "United States",
                    city: data.city || ""
                });
            })
            .catch(() => toast.error("Failed to load profile"))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        if (!profile.id) return;
        setSaving(true);
        try {
            let payload: any;
            if (profilePicture) {
                payload = new FormData();
                payload.append("reseller[company_name]", profile.company_name);
                payload.append("reseller[username]", profile.username);
                payload.append("reseller[country_code]", profile.country_code);
                payload.append("reseller[country]", profile.country);
                payload.append("reseller[city]", profile.city);
                payload.append("reseller[avatar]", profilePicture);
            } else {
                payload = {
                    reseller: {
                        company_name: profile.company_name,
                        username: profile.username,
                        country_code: profile.country_code,
                        country: profile.country,
                        city: profile.city
                    }
                };
            }

            const response = await updateResellerProfile(profile.id, payload);
            const updatedData = Array.isArray(response.data) ? response.data[0] : response.data;
            
            setProfile({
                id: updatedData.id,
                company_name: updatedData.company_name || "",
                email: updatedData.email || "",
                username: updatedData.username || "",
                dedicated_api_key: updatedData.dedicated_api_key || "",
                profile_picture_url: updatedData.profile_picture_url || "",
                country_code: updatedData.country_code || "US",
                country: updatedData.country || "United States",
                city: updatedData.city || ""
            });
            
            toast.success("Profile updated successfully");
            localStorage.setItem("resellerUser", JSON.stringify(updatedData));
            window.dispatchEvent(new Event("reseller-user-updated"));
            setProfilePicture(null); // Clear the file selection after success
        } catch {
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const tooLarge = !!profilePicture && profilePicture.size > 5 * 1024 * 1024;
    const preview = useMemo(() => (profilePicture ? URL.createObjectURL(profilePicture) : ""), [profilePicture]);
    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
    const avatar = preview || (profile.profile_picture_url ? formatImageUrl(profile.profile_picture_url) : "");

    return (
        <div className="ws-stack">
            <PageHeader title="Settings" description="Manage your reseller profile, company details and password." />

            {loading ? (
                <div className="ws-panel space-y-3" role="status" aria-label="Loading settings">
                    {[0, 1, 2, 3].map(i => <span key={i} className="ws-skeleton block" style={{ height: 40 }} />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <section className="ws-panel lg:col-span-2" aria-labelledby="profile-title">
                        <div className="ws-panel-heading"><div><h2 id="profile-title">Profile</h2><p>These details appear on your account and invoices.</p></div></div>
                        <form className="grid grid-cols-1 gap-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (!tooLarge) handleSave(); }}>
                            <div className="ws-field">
                                <label htmlFor="rs-username">Username</label>
                                <input id="rs-username" className="ws-input" value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })} />
                            </div>
                            <div className="ws-field">
                                <label htmlFor="rs-email">Email</label>
                                <input id="rs-email" className="ws-input" value={profile.email} readOnly aria-readonly="true" style={{ opacity: 0.6 }} />
                                <p className="ws-field-hint">Contact support to change your email.</p>
                            </div>
                            <div className="ws-field sm:col-span-2">
                                <label htmlFor="rs-company">Company name</label>
                                <input id="rs-company" className="ws-input" value={profile.company_name} onChange={e => setProfile({ ...profile, company_name: e.target.value })} />
                            </div>
                            <div className="ws-field">
                                <label>Country</label>
                                <CountrySelect value={profile.country_code} onSelect={(code, name) => setProfile({ ...profile, country_code: code, country: name })} />
                            </div>
                            <div className="ws-field">
                                <label htmlFor="rs-city">City</label>
                                <input id="rs-city" className="ws-input" value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} placeholder="New York" />
                            </div>
                            <div className="ws-field sm:col-span-2">
                                <label htmlFor="rs-avatar">Company logo or profile picture</label>
                                <div className="flex items-center gap-4">
                                    {avatar && <span className="ws-avatar" style={{ width: 44, height: 44 }}><img src={avatar} alt="" /></span>}
                                    <input id="rs-avatar" type="file" accept="image/jpeg, image/png, image/gif, image/webp" className="ws-input" onChange={e => setProfilePicture(e.target.files ? e.target.files[0] : null)} />
                                </div>
                                {tooLarge ? <p className="ws-field-error">File must be less than 5MB.</p> : <p className="ws-field-hint">Optional. JPG, PNG, GIF or WebP up to 5MB.</p>}
                            </div>
                            <div className="sm:col-span-2">
                                <Button type="submit" loading={saving} disabled={tooLarge}>{saving ? "Saving…" : "Save changes"}</Button>
                            </div>
                        </form>
                    </section>

                    <aside className="ws-stack">
                        <section className="ws-panel" aria-labelledby="account-title">
                            <div className="ws-panel-heading"><h2 id="account-title">Account</h2></div>
                            <dl className="ws-rows">
                                <div><dt>Tier</dt><dd>{tier ? TIER_LABELS[tier] ?? tier.replace(/_/g, " ") : "—"}</dd></div>
                                <div><dt>Country</dt><dd>{profile.country || "—"}</dd></div>
                                <div><dt>Email</dt><dd>{profile.email || "—"}</dd></div>
                            </dl>
                        </section>

                        {profile.dedicated_api_key && (
                            <section className="ws-panel" aria-labelledby="key-title">
                                <div className="ws-panel-heading"><div><h2 id="key-title">Dedicated API key</h2><p>Your static key for enterprise integrations. Keep it secret.</p></div></div>
                                <div className="proxy-secret">
                                    <span>API key</span>
                                    <div>
                                        <code>{showKey ? profile.dedicated_api_key : "•".repeat(24)}</code>
                                        <button type="button" onClick={() => setShowKey(v => !v)} aria-label={showKey ? "Hide API key" : "Show API key"}>{showKey ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                                        <button type="button" onClick={() => { navigator.clipboard.writeText(profile.dedicated_api_key); toast.success("API key copied"); }} aria-label="Copy API key"><Copy size={14} /></button>
                                    </div>
                                </div>
                            </section>
                        )}
                    </aside>
                </div>
            )}

            <ChangePassword />
        </div>
    );
}
