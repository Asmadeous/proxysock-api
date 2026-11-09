import { Users, User, Store } from "lucide-react";

interface ManagementFiltersProps {
    entityType: string;
    onEntityTypeChange: (type: string) => void;
}

const OPTIONS = [
    { value: "", label: "All", icon: Users },
    { value: "User", label: "Platform users", icon: User },
    { value: "Reseller", label: "Resellers", icon: Store },
];

export default function ManagementFilters({ entityType, onEntityTypeChange }: ManagementFiltersProps) {
    return (
        <div className="ws-tabs" role="group" aria-label="Account type">
            {OPTIONS.map(({ value, label, icon: Icon }) => (
                <button key={label} type="button" aria-pressed={entityType === value} onClick={() => onEntityTypeChange(value)}>
                    <Icon aria-hidden="true" />{label}
                </button>
            ))}
        </div>
    );
}
