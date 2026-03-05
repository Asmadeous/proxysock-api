import {
    UserIcon,
} from "@heroicons/react/24/outline";

export default function ResSettings() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your reseller profile and preferences.</p>
            </div>

            <div className="max-w-2xl space-y-6">
                <div className="bg-card border rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2"><UserIcon className="w-5 h-5" /> Profile Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Full Name</label>
                            <input className="w-full bg-muted p-2 rounded-lg text-sm" placeholder="Reseller User" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Email</label>
                            <input className="w-full bg-muted p-2 rounded-lg text-sm" placeholder="reseller@example.com" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs text-muted-foreground">Company Name</label>
                            <input className="w-full bg-muted p-2 rounded-lg text-sm" placeholder="My Reseller Business" />
                        </div>
                    </div>
                    <button className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium">Save Changes</button>
                </div>
            </div>
        </div>
    );
}
