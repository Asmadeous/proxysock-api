import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "danger" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
    primary:   "bg-primary text-primary-foreground hover:bg-primary/90",
    danger:    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    secondary: "bg-muted text-foreground hover:bg-border border border-border",
    ghost:     "text-muted-foreground hover:text-foreground hover:bg-muted",
    outline:   "border border-border text-foreground hover:bg-muted bg-transparent",
};

const sizeClasses: Record<Size, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    children: ReactNode;
}

export default function Button({
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    children,
    className = "",
    ...rest
}: ButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            {...rest}
        >
            {loading ? (
                <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    {children}
                </>
            ) : children}
        </button>
    );
}
