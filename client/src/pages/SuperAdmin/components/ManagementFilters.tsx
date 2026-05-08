import { UserIcon, BuildingStorefrontIcon, UsersIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface ManagementFiltersProps {
    entityType: string;
    onEntityTypeChange: (type: string) => void;
}

export default function ManagementFilters({ entityType, onEntityTypeChange }: ManagementFiltersProps) {
    return (
        <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg border border-border w-fit">
            <button
                onClick={() => onEntityTypeChange("")}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    entityType === "" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                <UsersIcon className="w-3.5 h-3.5" />
                All
            </button>
            <button
                onClick={() => onEntityTypeChange("User")}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    entityType === "User" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                <UserIcon className="w-3.5 h-3.5" />
                Platform Users
            </button>
            <button
                onClick={() => onEntityTypeChange("Reseller")}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    entityType === "Reseller" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                <BuildingStorefrontIcon className="w-3.5 h-3.5" />
                Resellers
            </button>
        </div>
    );
}
