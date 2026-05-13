import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ResellerErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("[ResellerDashboard] Uncaught error:", error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center p-8">
                    <div className="p-4 bg-destructive/10 rounded-full">
                        <AlertTriangle className="w-10 h-10 text-destructive" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">Something went wrong</h2>
                        <p className="text-sm text-muted-foreground max-w-md">
                            This section encountered an unexpected error. You can try reloading it or navigate to another tab.
                        </p>
                        {this.state.error && (
                            <p className="text-xs font-mono text-muted-foreground/60 mt-2">
                                {this.state.error.message}
                            </p>
                        )}
                    </div>
                    <Button onClick={this.handleReset} variant="outline">
                        Try Again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
