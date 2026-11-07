import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "danger" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    children: ReactNode;
}

export default function Button({ variant = "primary", size = "md", loading = false, disabled, children, className = "", type = "button", ...rest }: ButtonProps) {
    return (
        <button type={type} disabled={disabled || loading} data-variant={variant} data-size={size} className={`ws-button ${className}`} {...rest}>
            {loading && <span className="ws-spinner" aria-hidden="true" />}
            {children}
        </button>
    );
}
