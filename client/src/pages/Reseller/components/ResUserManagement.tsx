import {
    UsersIcon,
    UserPlusIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export default function ResUserManagement() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-muted-foreground mt-1">Manage your sub-users and their permissions.</p>
                </div>
                <button className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <UserPlusIcon className="w-5 h-5" />
                    Create User
                </button>
            </div>

            <div className="bg-card border rounded-xl overflow-hidden">
                <div className="p-4 border-b flex gap-4">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input className="w-full bg-muted pl-10 pr-4 py-2 rounded-lg text-sm" placeholder="Search users by name or email..." />
                    </div>
                </div>
                <div className="p-8 text-center text-muted-foreground">
                    <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No sub-users found. Start by creating your first sub-user.</p>
                </div>
            </div>
        </div>
    );
}
