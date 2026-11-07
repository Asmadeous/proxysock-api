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
        <div className="ws-empty">
            {Icon && <span className="ws-empty-mark"><Icon aria-hidden="true" /></span>}
            <h3>{title}</h3>
            {description && <p>{description}</p>}
            {action && <Button onClick={action.onClick}>{action.label}</Button>}
        </div>
    );
}
