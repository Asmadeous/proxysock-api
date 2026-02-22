import { useState, useEffect } from "react";
import { DocumentTextIcon, ServerIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import adminApi from "../../../services/adminApi";
import { toast } from "react-hot-toast";

interface LogEntry {
    id: number;
    user_type: string;
    user_id: string;
    action: string;
    auditable_type: string;
    auditable_id: string;
    ip_address: string;
    created_at: string;
    object_changes: Record<string, unknown> | null;
}

export default function SystemLogsTab() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState<"audit" | "api" | "errors">("audit");

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Audit logs from Rails — this endpoint may not exist yet, we'll fall back gracefully
                const res = await adminApi.get("/audit_logs", { params: { per: 50 } }).catch(() => ({ data: { logs: [] } }));
                setLogs(res.data.logs || res.data || []);
            } catch { toast.error("Failed to load logs"); }
            finally { setLoading(false); }
        };
        load();
    }, [activeSubTab]);

    const columns = [
        {
            key: "action", label: "Action", render: (row: LogEntry) => (
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-muted">
                        {row.action?.includes("delete") ? <ShieldExclamationIcon className="h-4 w-4 text-red-400" /> :
                            row.action?.includes("api") ? <ServerIcon className="h-4 w-4 text-blue-400" /> :
                                <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <span className="text-sm font-mono text-foreground">{row.action}</span>
                </div>
            )
        },
        {
            key: "user_type", label: "Actor", render: (row: LogEntry) => (
                <div>
                    <p className="text-sm text-foreground">{row.user_type}</p>
                    <p className="text-xs text-muted-foreground">#{String(row.user_id).slice(0, 8)}</p>
                </div>
            )
        },
        {
            key: "auditable_type", label: "Target", render: (row: LogEntry) => (
                <div>
                    <p className="text-sm text-muted-foreground">{row.auditable_type}</p>
                    <p className="text-xs text-muted-foreground">#{String(row.auditable_id).slice(0, 8)}</p>
                </div>
            )
        },
        { key: "ip_address", label: "IP", render: (row: LogEntry) => <span className="text-xs font-mono text-muted-foreground">{row.ip_address || "—"}</span> },
        { key: "created_at", label: "Time", sortable: true, render: (row: LogEntry) => <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span> },
        {
            key: "object_changes", label: "Changes", render: (row: LogEntry) => row.object_changes ? (
                <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(row.object_changes, null, 2)); toast.success("Copied"); }} className="text-xs text-blue-400 hover:underline">
                    View
                </button>
            ) : <span className="text-xs text-muted-foreground">—</span>
        },
    ];

    const subTabs = [
        { key: "audit", label: "Audit Logs", icon: DocumentTextIcon },
        { key: "api", label: "API Requests", icon: ServerIcon },
        { key: "errors", label: "Error Logs", icon: ShieldExclamationIcon },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">System Logs</h2>

            <div className="flex flex-wrap gap-2">
                {subTabs.map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setActiveSubTab(key as typeof activeSubTab)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeSubTab === key ? "bg-red-500 text-foreground" : "bg-card text-muted-foreground hover:text-foreground border border-border"}`}>
                        <Icon className="h-4 w-4" />{label}
                    </button>
                ))}
            </div>

            {activeSubTab === "audit" ? (
                <DataTable columns={columns} data={logs} loading={loading} emptyMessage="No audit logs found" />
            ) : activeSubTab === "api" ? (
                <div className="bg-card rounded-xl border border-border p-8 text-center">
                    <ServerIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">API request logs are available in your infrastructure monitoring (e.g. Datadog, Sentry, CloudWatch).</p>
                </div>
            ) : (
                <div className="bg-card rounded-xl border border-border p-8 text-center">
                    <ShieldExclamationIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Error tracking is managed via Sentry. Check your dashboard for real-time error reporting.</p>
                </div>
            )}
        </div>
    );
}
