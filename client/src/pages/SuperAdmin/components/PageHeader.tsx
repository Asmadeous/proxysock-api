import type { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
}

// Page title row in the customer dashboard style.
export default function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <header className="overview-heading">
            <div>
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
            {actions && <div className="overview-heading-actions">{actions}</div>}
        </header>
    );
}
