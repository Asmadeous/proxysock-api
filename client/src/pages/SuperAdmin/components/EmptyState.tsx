import type { ComponentType, SVGProps } from "react";
import Button from "./Button";

interface EmptyStateProps {
    icon?: ComponentType<SVGProps<SVGSVGElement>>;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {Icon && (
                <div className="p-4 rounded-full bg-muted mb-4">
                    <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                </div>
            )}
            <p className="text-base font-semibold text-foreground mb-1">{title}</p>
            {description && (
                <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
            )}
            {action && (
                <Button onClick={action.onClick} className="mt-4">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
