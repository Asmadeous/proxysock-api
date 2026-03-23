import { useState, useEffect, useCallback } from "react";
import {
    DocumentTextIcon, ServerIcon,
    ArrowPathIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon,
    ClipboardIcon, MagnifyingGlassIcon, ExclamationTriangleIcon,
    CommandLineIcon,
} from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import { fetchAuditLogs, fetchSystemLogs, fetchErrorLogs } from "../../../services/adminApi";
import { toast } from "react-hot-toast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

type SubTab = "system" | "audit" | "errors";

const SEVERITY_COLORS: Record<string, string> = {
    fatal: "text-red-500 bg-red-500/10",
    error: "text-red-400 bg-red-500/10",
    warn: "text-yellow-400 bg-yellow-500/10",
    request: "text-blue-400 bg-blue-500/10",
    response: "text-green-400 bg-green-500/10",
    info: "text-muted-foreground bg-transparent",
};

const ACTION_COLORS: Record<string, string> = {
    create: "text-green-400",
    update: "text-blue-400",
    destroy: "text-red-400",
    delete: "text-red-400",
    login: "text-purple-400",
    refund: "text-yellow-400",
    onboard: "text-cyan-400",
    configure: "text-orange-400",
};

export default function SystemLogsTab() {
    const [subTab, setSubTab] = useState<SubTab>("system");

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">System Logs</h2>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex gap-2 border-b border-border pb-2">
                {([
                    { key: "system", label: "System Logs", icon: CommandLineIcon },
                    { key: "audit", label: "Audit Logs", icon: DocumentTextIcon },
                    { key: "errors", label: "Error Logs", icon: ExclamationTriangleIcon },
                ] as { key: SubTab; label: string; icon: typeof CommandLineIcon }[]).map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setSubTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${subTab === key
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>

            {subTab === "system" && <SystemLogPanel />}
            {subTab === "audit" && <AuditLogPanel />}
            {subTab === "errors" && <ErrorLogPanel />}
        </div>
    );
}

/* ─── System Log Panel (Rails / Sidekiq log files) ─────────────── */
function SystemLogPanel() {
    const [lines, setLines] = useState<AnyObj[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [source, setSource] = useState("rails");
    const [lineCount, setLineCount] = useState("200");
    const [logFile, setLogFile] = useState("");
    const [autoRefresh, setAutoRefresh] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { lines: lineCount, source };
            if (search) params.search = search;
            const res = await fetchSystemLogs(params);
            setLines(res.data.lines || []);
            setLogFile(res.data.file || "");
            if (res.data.error) toast.error(res.data.error);
        } catch {
            toast.error("Failed to load system logs");
        } finally {
            setLoading(false);
        }
    }, [lineCount, source, search]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh, load]);

    return (
        <div className="space-y-3">
            {/* Controls */}
            <div className="bg-card rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-muted-foreground mb-1">Search</label>
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && load()}
                            placeholder="Filter logs..."
                            className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs text-muted-foreground mb-1">Source</label>
                    <select
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                        <option value="rails">Rails</option>
                        <option value="sidekiq">Sidekiq</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-muted-foreground mb-1">Lines</label>
                    <select
                        value={lineCount}
                        onChange={(e) => setLineCount(e.target.value)}
                        className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                        <option value="100">100</option>
                        <option value="200">200</option>
                        <option value="500">500</option>
                        <option value="1000">1000</option>
                    </select>
                </div>
                <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${autoRefresh ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                    {autoRefresh ? "● Live" : "○ Live"}
                </button>
                <button
                    onClick={load}
                    disabled={loading}
                    className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition"
                >
                    <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Log file path */}
            {logFile && (
                <p className="text-xs text-muted-foreground font-mono px-1">
                    {logFile} — {lines.length} lines
                </p>
            )}

            {/* Log Output */}
            <div className="bg-[#0d1117] rounded-xl border border-border overflow-hidden">
                <div className="overflow-y-auto max-h-[600px] font-mono text-xs p-3 space-y-0">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                        </div>
                    ) : lines.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No log entries found</p>
                    ) : (
                        lines.map((line) => (
                            <div
                                key={line.id}
                                className={`py-0.5 px-2 rounded hover:bg-white/5 whitespace-pre-wrap break-all leading-5 ${SEVERITY_COLORS[line.severity] || "text-muted-foreground"}`}
                            >
                                {line.text}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Audit Log Panel ──────────────────────────────────────────── */
function AuditLogPanel() {
    const [logs, setLogs] = useState<AnyObj[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const PER = 50;
    const [actionFilter, setActionFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { page: String(page), per: String(PER) };
            if (actionFilter) params.action_filter = actionFilter;
            if (typeFilter) params.auditable_type = typeFilter;
            const res = await fetchAuditLogs(params);
            setLogs(res.data.logs || []);
            setTotal(res.data.total || 0);
        } catch {
            toast.error("Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    }, [page, actionFilter, typeFilter]);

    useEffect(() => { load(); }, [load]);

    const totalPages = Math.ceil(total / PER);

    const getActionColor = (action: string) => {
        const key = Object.keys(ACTION_COLORS).find((k) => action?.toLowerCase().includes(k));
        return key ? ACTION_COLORS[key] : "text-muted-foreground";
    };

    const columns = [
        {
            key: "action", label: "Action",
            render: (row: AnyObj) => (
                <span className={`text-sm font-mono ${getActionColor(row.action)}`}>{row.action}</span>
            ),
        },
        {
            key: "user_type", label: "Actor",
            render: (row: AnyObj) => (
                <div>
                    <p className="text-sm text-foreground">{row.user_type || "System"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{row.user_id ? `#${String(row.user_id).slice(0, 8)}` : "—"}</p>
                </div>
            ),
        },
        {
            key: "auditable_type", label: "Target",
            render: (row: AnyObj) => (
                <div>
                    <StatusBadge status={row.auditable_type || "unknown"} />
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">#{String(row.auditable_id).slice(0, 8)}</p>
                </div>
            ),
        },
        {
            key: "ip_address", label: "IP",
            render: (row: AnyObj) => <span className="text-xs font-mono text-muted-foreground">{row.ip_address || "—"}</span>,
        },
        {
            key: "created_at", label: "Time",
            render: (row: AnyObj) => (
                <div>
                    <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleTimeString()}</p>
                </div>
            ),
        },
        {
            key: "changes", label: "Changes",
            render: (row: AnyObj) =>
                row.object_changes ? (
                    <div className="flex gap-1">
                        <button onClick={() => setExpandedLog(expandedLog === row.id ? null : row.id)} className="text-xs text-blue-400 hover:underline">
                            {expandedLog === row.id ? "Hide" : "View"}
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(row.object_changes, null, 2)); toast.success("Copied"); }} className="p-0.5 text-muted-foreground hover:text-foreground" title="Copy">
                            <ClipboardIcon className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : <span className="text-xs text-muted-foreground">—</span>,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{total.toLocaleString()} audit entries</p>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${showFilters ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:text-foreground"}`}>
                        <FunnelIcon className="h-4 w-4" />Filters
                    </button>
                    <button onClick={() => { setLoading(true); load(); }} className="p-2 rounded-lg bg-card border border-border hover:bg-muted transition">
                        <ArrowPathIcon className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="bg-card rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Action</label>
                        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                            className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary">
                            <option value="">All</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="destroy">Destroy</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Target</label>
                        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                            className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary">
                            <option value="">All</option>
                            <option value="Order">Order</option>
                            <option value="User">User</option>
                            <option value="Reseller">Reseller</option>
                            <option value="Vm">Vm</option>
                            <option value="Product">Product</option>
                        </select>
                    </div>
                    {(actionFilter || typeFilter) && (
                        <button onClick={() => { setActionFilter(""); setTypeFilter(""); setPage(1); }}
                            className="px-3 py-1.5 text-xs text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20">Clear</button>
                    )}
                </div>
            )}

            <DataTable columns={columns} data={logs} loading={loading} emptyMessage="No audit logs found" />

            {expandedLog && (
                <div className="bg-card rounded-xl border border-border p-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">Changes — #{expandedLog.slice(0, 8)}</h4>
                    <pre className="bg-[#0d1117] rounded-lg p-3 text-xs font-mono text-muted-foreground overflow-x-auto max-h-64">
                        {JSON.stringify(logs.find((l) => l.id === expandedLog)?.object_changes, null, 2)}
                    </pre>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                            className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground disabled:opacity-50">
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                            className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground disabled:opacity-50">
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Error Log Panel ──────────────────────────────────────────── */
function ErrorLogPanel() {
    const [errors, setErrors] = useState<AnyObj[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [expanded, setExpanded] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchErrorLogs({ lines: "1000" });
            setErrors(res.data.errors || []);
            setTotal(res.data.total || 0);
        } catch {
            toast.error("Failed to load error logs");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {total} error{total !== 1 ? "s" : ""} found (scanning last 1000 lines)
                </p>
                <button onClick={load} disabled={loading} className="p-2 rounded-lg bg-card border border-border hover:bg-muted transition">
                    <ArrowPathIcon className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                </div>
            ) : errors.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-8 text-center">
                    <ServerIcon className="h-12 w-12 mx-auto text-green-500 mb-3" />
                    <p className="text-foreground font-medium">No errors found</p>
                    <p className="text-sm text-muted-foreground mt-1">System is running clean</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {errors.map((err, idx) => (
                        <div key={idx} className="bg-card rounded-xl border border-red-500/20 overflow-hidden">
                            <button
                                onClick={() => setExpanded(expanded === idx ? null : idx)}
                                className="w-full text-left p-3 hover:bg-muted/30 transition"
                            >
                                <div className="flex items-start gap-2">
                                    <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-red-400 font-mono truncate">{err.message}</p>
                                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                            {err.timestamp && <span>{err.timestamp}</span>}
                                            {err.trace?.length > 0 && <span>{err.trace.length} trace lines</span>}
                                        </div>
                                    </div>
                                </div>
                            </button>
                            {expanded === idx && err.trace?.length > 0 && (
                                <div className="border-t border-border bg-[#0d1117] p-3">
                                    <pre className="text-xs font-mono text-muted-foreground overflow-x-auto max-h-48 space-y-0.5">
                                        {err.trace.map((line: string, i: number) => (
                                            <div key={i} className="py-0.5">{line}</div>
                                        ))}
                                    </pre>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
