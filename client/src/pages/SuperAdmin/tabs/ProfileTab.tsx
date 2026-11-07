import { useState, useRef, useEffect, type ChangeEvent } from "react";
import {
    EnvelopeIcon,
    KeyIcon,
    CameraIcon,
    CheckCircleIcon,
    CalendarDaysIcon,
    BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { Field, inputClasses } from "../components/FormModal";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
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

    // Fill the form once the profile loads (and again if it changes after a save).
    useEffect(() => {
        if (!profile) return;
        setInfoForm({
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            email: profile.email || "",
            current_password_for_email: "",
        });
        setInfoDirty(false);
        setEmailChanging(false);
    }, [profile]);

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
        { id: "info" as const, label: "Personal information" },
        { id: "password" as const, label: "Password" },
    ];

    if (isLoading) {
        return (
            <div className="ws-stack">
                <PageHeader title="Profile" description="Your staff account details and password." />
                <div className="ws-panel space-y-3" role="status" aria-label="Loading profile">
                    <span className="ws-skeleton block" style={{ height: 48, width: 48 }} />
                    <span className="ws-skeleton block" style={{ height: 14, maxWidth: 240 }} />
                    <span className="ws-skeleton block" style={{ height: 12, maxWidth: 320 }} />
                </div>
            </div>
        );
    }

    const avatarUrl = avatarPreview || (profile?.profile_picture_url ? formatImageUrl(profile.profile_picture_url) : null);
    const initials = `${(profile?.first_name || "A").charAt(0)}${(profile?.last_name || "").charAt(0)}`.toUpperCase();

    return (
        <div className="ws-stack">
            <PageHeader title="Profile" description="Your staff account details and password." />

            <section className="ws-panel flex flex-col gap-5 sm:flex-row sm:items-center" aria-label="Account summary">
                <div className="relative shrink-0">
                    <span className="ws-avatar" style={{ width: 72, height: 72, fontSize: 20 }}>
                        {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
                    </span>
                    <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Change profile picture" className="ws-icon-button absolute -bottom-2 -right-2 border border-[var(--ov-line)] bg-[var(--ov-panel)]">
                        <CameraIcon />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="truncate text-xl font-medium tracking-[-.035em]">{profile?.full_name}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] ws-muted">
                        <span className="flex items-center gap-1.5"><EnvelopeIcon className="h-3.5 w-3.5" aria-hidden="true" />{profile?.email}</span>
                        {profile?.role && <span className="ws-status capitalize" data-tone="info">{profile.role}</span>}
                        {profile?.department && <span className="flex items-center gap-1.5"><BuildingOfficeIcon className="h-3.5 w-3.5" aria-hidden="true" />{profile.department}</span>}
                        {profile?.created_at && <span className="flex items-center gap-1.5"><CalendarDaysIcon className="h-3.5 w-3.5" aria-hidden="true" />Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>}
                    </div>
                </div>
            </section>

            <div className="ws-tabs" role="group" aria-label="Profile section">
                {sections.map((s) => (
                    <button type="button" key={s.id} aria-pressed={activeSection === s.id} onClick={() => setActiveSection(s.id)}>{s.label}</button>
                ))}
            </div>

            {/* Profile Info Section */}
            {activeSection === "info" && (
                <section className="ws-panel max-w-2xl">
                    <div className="ws-panel-heading"><div><h2>Personal information</h2><p>Update your name and email address.</p></div></div>

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
                                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ws-muted" aria-hidden="true" />
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
                                    <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ws-muted" aria-hidden="true" />
                                </div>
                            </Field>
                        )}

                        <div className="pt-2">
                            <Button
                                onClick={handleInfoSubmit}
                                loading={updateProfile.isLoading}
                                disabled={!infoDirty || (emailChanging && !infoForm.current_password_for_email)}
                            >
                                <CheckCircleIcon /> Save changes
                            </Button>
                        </div>
                    </div>
                </section>
            )}

            {/* Password Section */}
            {activeSection === "password" && (
                <section className="ws-panel max-w-2xl">
                    <div className="ws-panel-heading"><div><h2>Change password</h2><p>Ensure your account uses a strong, unique password.</p></div></div>

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
                                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ws-muted" aria-hidden="true" />
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
                                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ws-muted" aria-hidden="true" />
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
                                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ws-muted" aria-hidden="true" />
                            </div>
                        </Field>

                        {/* Password strength indicator */}
                        {passwordForm.password.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="ws-meter flex-1">
                                        <span style={{ width: passwordForm.password.length >= 12 ? "100%" : passwordForm.password.length >= 8 ? "66%" : "33%" }} />
                                    </div>
                                    <span className={`text-xs font-medium ${
                                        passwordForm.password.length >= 12
                                            ? "ws-good"
                                            : passwordForm.password.length >= 8
                                            ? "ws-wait"
                                            : "ws-bad"
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
                                <KeyIcon /> Update password
                            </Button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
