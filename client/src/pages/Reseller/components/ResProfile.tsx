import { Field, inputClasses } from "../../SuperAdmin/components/FormModal";

export default function ResProfile() {
    const user = JSON.parse(localStorage.getItem("resellerUser") || "{}");

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Profile</h2>
            <div className="bg-muted rounded-xl border border-border p-6 space-y-4 max-w-lg">
                <Field label="Company Name"><input className={inputClasses} defaultValue={user.company_name || ""} readOnly /></Field>
                <Field label="Email"><input className={inputClasses} defaultValue={user.email || ""} readOnly /></Field>
                <Field label="Username"><input className={inputClasses} defaultValue={user.username || ""} readOnly /></Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Country Code"><input className={inputClasses} defaultValue={user.country_code || ""} readOnly /></Field>
                    <Field label="City"><input className={inputClasses} defaultValue={user.city || ""} readOnly /></Field>
                </div>
                <Field label="Account Type"><input className={inputClasses} defaultValue={user.reseller_type || "standard"} readOnly /></Field>
            </div>
        </div>
    );
}
