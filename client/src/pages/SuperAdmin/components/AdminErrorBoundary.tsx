import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import type { ReactNode } from "react";
import { ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Button from "./Button";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="ws-empty-mark mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-base font-medium mb-1">Something went wrong</p>
            <p className="text-sm text-muted-foreground max-w-sm mb-5">
                {error instanceof Error ? error.message : "An unexpected error occurred in this section."}
            </p>
            <Button onClick={resetErrorBoundary}>
                <ArrowPathIcon className="h-4 w-4" />
                Try again
            </Button>
        </div>
    );
}

export default function AdminErrorBoundary({ children }: { children: ReactNode }) {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            {children}
        </ErrorBoundary>
    );
}
