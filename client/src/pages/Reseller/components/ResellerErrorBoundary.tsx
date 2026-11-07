import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "../../SuperAdmin/components/Button";

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
                <div className="overview-empty" role="alert">
                    <span className="overview-empty-mark" aria-hidden="true"><AlertTriangle size={26} strokeWidth={1.3} /></span>
                    <h3>Something went wrong</h3>
                    <p>This section hit an unexpected error. Try loading it again, or open another page from the sidebar.</p>
                    {this.state.error && <p className="ws-mono">{this.state.error.message}</p>}
                    <Button variant="secondary" onClick={this.handleReset}>Try again</Button>
                </div>
            );
        }

        return this.props.children;
    }
}
