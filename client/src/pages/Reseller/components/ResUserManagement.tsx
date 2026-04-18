import { UsersIcon } from "@heroicons/react/24/outline";

export default function ResUserManagement() {
    return (
        <div className="space-y-6 max-w-3xl mx-auto py-8">
            <div>
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground mt-1">Manage your sub-users and their permissions.</p>
            </div>

            <div className="bg-card border border-dashed border-border/60 rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-4">
                <div className="p-5 rounded-full bg-muted/50">
                    <UsersIcon className="w-12 h-12 text-muted-foreground/50" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold">Sub-User Management</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        The ability to create and manage sub-users for your reseller account is coming soon.
                        Contact support if you need this feature urgently.
                    </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                    Coming Soon
                </span>
            </div>
        </div>
    );
}
