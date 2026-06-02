import { useState, useRef, type ChangeEvent } from "react";
import {
    UserCircleIcon,
    EnvelopeIcon,
    KeyIcon,
    CameraIcon,
    CheckCircleIcon,
    ShieldCheckIcon,
    CalendarDaysIcon,
    BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { Field, inputClasses } from "../components/FormModal";
import Button from "../components/Button";
import { useAdminProfile, useUpdateAdminProfile } from "../queries/profile.queries";
import { formatImageUrl } from "../../../services/api";

export default function ProfileTab() {
    const { data: profile, isLoading } = useAdminProfile();
    const updateProfile = useUpdateAdminProfile();

    const [activeSection, setActiveSection] = useState<"info" | "password">("info");

    // Info form
    const [infoForm, setInfoForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        current_password_for_email: "",
    });
    const [infoDirty, setInfoDirty] = useState(false);
    const [emailChanging, setEmailChanging] = useState(false);

    // Password form
    const [passwordForm, setPasswordForm] = useState({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    // Avatar
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Sync form with loaded profile
    const syncedRef = useRef(false);
    if (profile && !syncedRef.current) {
        syncedRef.current = true;
        setInfoForm({
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            email: profile.email || "",
            current_password_for_email: "",
        });
    }

    const handleInfoChange = (field: string, value: string) => {
        setInfoForm((prev) => ({ ...prev, [field]: value }));
        setInfoDirty(true);
        if (field === "email" && value !== profile?.email) {
            setEmailChanging(true);
        } else if (field === "email") {
            setEmailChanging(false);
        }
    };

    const handlePasswordChange = (field: string, value: string) => {
        setPasswordForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarPreview(URL.createObjectURL(file));
        const formData = new FormData();
        formData.append("avatar", file);
        updateProfile.mutate(formData);
    };

    const handleInfoSubmit = () => {
        const payload: Record<string, unknown> = {};
        if (infoForm.first_name !== profile?.first_name) payload.first_name = infoForm.first_name;
        if (infoForm.last_name !== profile?.last_name) payload.last_name = infoForm.last_name;
        if (infoForm.email !== profile?.email) {
            payload.email = infoForm.email;
            payload.current_password = infoForm.current_password_for_email;
        }
        if (Object.keys(payload).length === 0) return;
        updateProfile.mutate(payload, {
            onSuccess: () => {
                setInfoDirty(false);
                setEmailChanging(false);
                setInfoForm((prev) => ({ ...prev, current_password_for_email: "" }));
                syncedRef.current = false;
            },
        });
    };

    const handlePasswordSubmit = () => {
        if (passwordForm.password.length < 8) return;
        if (passwordForm.password !== passwordForm.password_confirmation) return;
        updateProfile.mutate(
            {
                current_password: passwordForm.current_password,
                password: passwordForm.password,
                password_confirmation: passwordForm.password_confirmation,
            },
            {
                onSuccess: () => {
                    setPasswordForm({ current_password: "", password: "", password_confirmation: "" });
                },
            }
        );
    };

    const sections = [
        { id: "info" as const, label: "Profile Info", icon: UserCircleIcon },
        { id: "password" as const, label: "Change Password", icon: KeyIcon },
    ];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">My Profile</h2>
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                </div>
            </div>
        );
    }

    const avatarUrl = avatarPreview || (profile?.profile_picture_url ? formatImageUrl(profile.profile_picture_url) : null);
    const initials = `${(profile?.first_name || "A").charAt(0)}${(profile?.last_name || "").charAt(0)}`.toUpperCase();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">My Profile</h2>

            {/* Profile Header Card */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Banner gradient */}
                <div className="h-28 bg-gradient-to-r from-primary/80 via-primary/50 to-primary/20 relative">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wOCkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-60" />
                </div>

                <div className="px-6 pb-6 -mt-14 flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="h-24 w-24 rounded-2xl border-4 border-card bg-card shadow-lg overflow-hidden flex items-center justify-center">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-primary-foreground">{initials}</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        >
                            <CameraIcon className="h-6 w-6 text-white" />
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>

                    {/* User info summary */}
                    <div className="flex-1 min-w-0 pt-2">
                        <h3 className="text-xl font-bold text-foreground truncate">{profile?.full_name}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <EnvelopeIcon className="h-4 w-4" /> {profile?.email}
                            </span>
                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <ShieldCheckIcon className="h-4 w-4" />
                                <span className="capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">{profile?.role}</span>
                            </span>
                            {profile?.department && (
                                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <BuildingOfficeIcon className="h-4 w-4" /> {profile.department}
                                </span>
                            )}
                            {profile?.created_at && (
                                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <CalendarDaysIcon className="h-4 w-4" /> Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section tabs */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 w-fit">
                {sections.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === s.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                    >
                        <s.icon className="h-4 w-4" /> {s.label}
                    </button>
                ))}
            </div>

            {/* Profile Info Section */}
            {activeSection === "info" && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-6 max-w-2xl">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                        <p className="text-sm text-muted-foreground mt-1">Update your name and email address.</p>
                    </div>

                    <div className="grid gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="First Name">
                                <input
                                    className={inputClasses}
                                    type="text"
                                    value={infoForm.first_name}
                                    onChange={(e) => handleInfoChange("first_name", e.target.value)}
                                    placeholder="First name"
                                />
                            </Field>
                            <Field label="Last Name">
                                <input
                                    className={inputClasses}
                                    type="text"
                                    value={infoForm.last_name}
                                    onChange={(e) => handleInfoChange("last_name", e.target.value)}
                                    placeholder="Last name"
                                />
                            </Field>
                        </div>

                        <Field label="Email Address" hint={emailChanging ? "Changing your email requires your current password" : undefined}>
                            <div className="relative">
                                <input
                                    className={inputClasses + " pl-10"}
                                    type="email"
                                    value={infoForm.email}
                                    onChange={(e) => handleInfoChange("email", e.target.value)}
                                    placeholder="admin@example.com"
                                />
                                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                        </Field>

                        {emailChanging && (
                            <Field label="Current Password (required to change email)">
                                <div className="relative">
                                    <input
                                        className={inputClasses + " pl-10"}
                                        type="password"
                                        value={infoForm.current_password_for_email}
                                        onChange={(e) => handleInfoChange("current_password_for_email", e.target.value)}
                                        placeholder="Enter your current password"
                                    />
                                    <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                            </Field>
                        )}

                        <div className="pt-2">
                            <Button
                                onClick={handleInfoSubmit}
                                loading={updateProfile.isLoading}
                                disabled={!infoDirty || (emailChanging && !infoForm.current_password_for_email)}
                            >
                                <CheckCircleIcon className="h-4 w-4 mr-2" /> Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Section */}
            {activeSection === "password" && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-6 max-w-2xl">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Change Password</h3>
                        <p className="text-sm text-muted-foreground mt-1">Ensure your account uses a strong, unique password.</p>
                    </div>

                    <div className="grid gap-4">
                        <Field label="Current Password">
                            <div className="relative">
                                <input
                                    className={inputClasses + " pl-10"}
                                    type="password"
                                    value={passwordForm.current_password}
                                    onChange={(e) => handlePasswordChange("current_password", e.target.value)}
                                    placeholder="Enter current password"
                                />
                                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                        </Field>

                        <Field
                            label="New Password"
                            hint="Must be at least 8 characters"
                            error={passwordForm.password.length > 0 && passwordForm.password.length < 8 ? "Password must be at least 8 characters" : undefined}
                        >
                            <div className="relative">
                                <input
                                    className={inputClasses + " pl-10"}
                                    type="password"
                                    value={passwordForm.password}
                                    onChange={(e) => handlePasswordChange("password", e.target.value)}
                                    placeholder="Enter new password"
                                />
                                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                        </Field>

                        <Field
                            label="Confirm New Password"
                            error={passwordForm.password_confirmation.length > 0 && passwordForm.password !== passwordForm.password_confirmation ? "Passwords do not match" : undefined}
                        >
                            <div className="relative">
                                <input
                                    className={inputClasses + " pl-10"}
                                    type="password"
                                    value={passwordForm.password_confirmation}
                                    onChange={(e) => handlePasswordChange("password_confirmation", e.target.value)}
                                    placeholder="Confirm new password"
                                />
                                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                        </Field>

                        {/* Password strength indicator */}
                        {passwordForm.password.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                passwordForm.password.length >= 12
                                                    ? "w-full bg-emerald-500"
                                                    : passwordForm.password.length >= 8
                                                    ? "w-2/3 bg-amber-500"
                                                    : "w-1/3 bg-red-500"
                                            }`}
                                        />
                                    </div>
                                    <span className={`text-xs font-medium ${
                                        passwordForm.password.length >= 12
                                            ? "text-emerald-500"
                                            : passwordForm.password.length >= 8
                                            ? "text-amber-500"
                                            : "text-red-500"
                                    }`}>
                                        {passwordForm.password.length >= 12 ? "Strong" : passwordForm.password.length >= 8 ? "Fair" : "Weak"}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <Button
                                onClick={handlePasswordSubmit}
                                loading={updateProfile.isLoading}
                                disabled={
                                    !passwordForm.current_password ||
                                    passwordForm.password.length < 8 ||
                                    passwordForm.password !== passwordForm.password_confirmation
                                }
                                variant="primary"
                            >
                                <KeyIcon className="h-4 w-4 mr-2" /> Update Password
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
