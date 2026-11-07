import { useState, useEffect, useRef } from "react";
import {
    ServerIcon,
    ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon,
    ClipboardIcon, MagnifyingGlassIcon, ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import { useSystemLogs, useAuditLogs, useErrorLogs } from "../queries/systemLogs.queries";
import { toast } from "sonner";

type AnyObj = Record<string, unknown>;
type SubTab = "system" | "audit" | "errors";

const SEVERITY_COLORS: Record<string, string> = {
    fatal: "ws-bad bg-[var(--ov-wash)]",
    error: "ws-bad bg-[var(--ov-wash)]",
    warn: "ws-wait bg-[var(--ov-wash)]",
    request: "ws-info bg-[var(--ov-wash)]",
    response: "ws-good bg-[var(--ov-wash)]",
    info: "ws-muted bg-transparent",
};

const ACTION_COLORS: Record<string, string> = {
    create: "ws-good",
    update: "ws-info",
    destroy: "ws-bad",
    delete: "ws-bad",
    login: "ws-info",
    refund: "ws-wait",
    onboard: "ws-info",
    configure: "ws-wait",
};

export default function SystemLogsTab() {
    const [subTab, setSubTab] = useState<SubTab>("system");

    return (
        <div className="ws-stack">
            <PageHeader title="System logs" description="Application logs, audit history and recent errors." />

            <div className="ws-tabs" role="group" aria-label="Log type">
                {([
                    { key: "system", label: "System logs" },
                    { key: "audit", label: "Audit logs" },
                    { key: "errors", label: "Error logs" },
                ] as { key: SubTab; label: string }[]).map(({ key, label }) => (
                    <button type="button" key={key} aria-pressed={subTab === key} onClick={() => setSubTab(key)}>{label}</button>
                ))}
            </div>

            {subTab === "system" && <SystemLogPanel />}
            {subTab === "audit" && <AuditLogPanel />}
            {subTab === "errors" && <ErrorLogPanel />}
        </div>
    );
}

/* ─── System Log Panel ─────────────────────────────────────────── */
function SystemLogPanel() {
    const [search, setSearch] = useState("");
    const [source, setSource] = useState("rails");
    const [lineCount, setLineCount] = useState("200");
    const [autoRefresh, setAutoRefresh] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, refetch } = useSystemLogs(
        { search, source, lineCount },
        autoRefresh ? 5000 : false
    );

    const lines: AnyObj[] = data?.lines || [];
    const logFile: string = data?.file || "";

    useEffect(() => {
        if (autoRefresh && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [lines, autoRefresh]);

    return (
        <div className="space-y-3">
            <div className="ws-toolbar flex-wrap items-end">
                <div className="ws-field min-w-[200px] flex-1">
                    <label htmlFor="log-search">Search</label>
                    <div className="ws-search" style={{ maxWidth: "none" }}>
                        <MagnifyingGlassIcon aria-hidden="true" />
                        <input id="log-search" type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && refetch()} placeholder="Filter logs..." />
                    </div>
                </div>
                <div className="ws-field">
                    <label htmlFor="log-source">Source</label>
                    <select id="log-source" value={source} onChange={(e) => setSource(e.target.value)} className="ws-input">
                        <option value="rails">Rails</option>
                        <option value="sidekiq">Sidekiq</option>
                    </select>
                </div>
                <div className="ws-field">
                    <label htmlFor="log-lines">Lines</label>
                    <select id="log-lines" value={lineCount} onChange={(e) => setLineCount(e.target.value)} className="ws-input">
                        <option value="100">100</option>
                        <option value="200">200</option>
                        <option value="500">500</option>
                        <option value="1000">1000</option>
                    </select>
                </div>
                <Button variant={autoRefresh ? "primary" : "secondary"} aria-pressed={autoRefresh} onClick={() => setAutoRefresh(!autoRefresh)}>
                    <span className="ws-dot" data-ok={autoRefresh} aria-hidden="true" />{autoRefresh ? "Live" : "Go live"}
                </Button>
                <button type="button" onClick={() => refetch()} disabled={isLoading} aria-label="Refresh logs" className="ws-icon-button"><ArrowPathIcon className={isLoading ? "animate-spin" : ""} /></button>
            </div>

            {logFile && (
                <p className="ws-mono text-[11px] ws-muted">
                    {logFile} — {lines.length} lines
                </p>
            )}

            <div className="ws-table-panel">
                <div className="max-h-[600px] overflow-y-auto p-3 font-mono text-[11px] scroll-smooth" ref={scrollRef}>
                    {isLoading ? (
                        <div className="space-y-2 py-4" role="status" aria-label="Loading logs">
                            {Array.from({ length: 6 }).map((_, i) => <span key={i} className="ws-skeleton block" style={{ height: 12, maxWidth: `${90 - i * 8}%` }} />)}
                        </div>
                    ) : lines.length === 0 ? (
                        <p className="py-8 text-center ws-muted">No log entries found.</p>
                    ) : (
                        lines.map((line) => (
                            <div
                                key={String(line.id)}
                                className={`whitespace-pre-wrap break-all rounded-sm px-2 py-0.5 leading-5 hover:bg-[var(--ov-wash)] ${SEVERITY_COLORS[String(line.severity)] || "ws-muted"}`}
                            >
                                {String(line.text)}
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
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const PER = 50;

    const { data, isLoading, refetch } = useAuditLogs({ page, per: PER, actionFilter, typeFilter });

    const logs: AnyObj[] = data?.logs || [];
    const total: number = data?.total || 0;
    const totalPages = Math.ceil(total / PER);

    const getActionColor = (action: string) => {
        const key = Object.keys(ACTION_COLORS).find((k) => action?.toLowerCase().includes(k));
        return key ? ACTION_COLORS[key] : "ws-muted";
    };

    const columns = [
        {
            key: "action", label: "Action",
            render: (row: AnyObj) => (
                <span className={`text-sm font-mono ${getActionColor(String(row.action))}`}>{String(row.action)}</span>
            ),
        },
        {
            key: "user_type", label: "Actor",
            render: (row: AnyObj) => (
                <div>
                    <p className="text-sm">{String(row.user_type || "System")}</p>
                    <p className="text-xs ws-muted font-mono">{row.user_id ? `#${String(row.user_id).slice(0, 8)}` : "—"}</p>
                </div>
            ),
        },
        {
            key: "auditable_type", label: "Target",
            render: (row: AnyObj) => (
                <div>
                    <StatusBadge status={String(row.auditable_type || "unknown")} />
                    <p className="text-xs ws-muted font-mono mt-0.5">#{String(row.auditable_id).slice(0, 8)}</p>
                </div>
            ),
        },
        {
            key: "ip_address", label: "IP",
            render: (row: AnyObj) => <span className="text-xs font-mono ws-muted">{String(row.ip_address || "—")}</span>,
        },
        {
            key: "created_at", label: "Time",
            render: (row: AnyObj) => (
                <div>
                    <p className="text-xs ws-muted">{new Date(String(row.created_at)).toLocaleDateString()}</p>
                    <p className="text-xs ws-muted">{new Date(String(row.created_at)).toLocaleTimeString()}</p>
                </div>
            ),
        },
        {
            key: "changes", label: "Changes",
            render: (row: AnyObj) =>
                row.object_changes ? (
                    <div className="flex gap-1">
                        <button type="button" onClick={() => setExpandedLog(expandedLog === String(row.id) ? null : String(row.id))} className="text-xs text-[var(--ov-accent)] hover:underline">
                            {expandedLog === String(row.id) ? "Hide" : "View"}
                        </button>
                        <button
                            onClick={() => { navigator.clipboard.writeText(JSON.stringify(row.object_changes, null, 2)); toast.success("Copied"); }}
                            className="ws-icon-button"
                            aria-label="Copy changes"
                        >
                            <ClipboardIcon className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : <span className="text-xs ws-muted">—</span>,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="ws-toolbar flex-wrap items-end">
                <div className="ws-field">
                    <label htmlFor="audit-action">Action</label>
                    <select id="audit-action" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="ws-input">
                        <option value="">All</option>
                        <option value="create">Create</option>
                        <option value="update">Update</option>
                        <option value="destroy">Destroy</option>
                    </select>
                </div>
                <div className="ws-field">
                    <label htmlFor="audit-target">Target</label>
                    <select id="audit-target" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="ws-input">
                        <option value="">All</option>
                        <option value="Order">Order</option>
                        <option value="User">User</option>
                        <option value="Reseller">Reseller</option>
                        <option value="Vm">Vm</option>
                        <option value="Product">Product</option>
                    </select>
                </div>
                {(actionFilter || typeFilter) && <Button variant="ghost" onClick={() => { setActionFilter(""); setTypeFilter(""); setPage(1); }}>Clear filters</Button>}
                <div className="ws-toolbar-actions">
                    <span className="text-[11px] ws-muted">{total.toLocaleString()} audit entries</span>
                    <button type="button" onClick={() => refetch()} aria-label="Refresh audit logs" className="ws-icon-button"><ArrowPathIcon className={isLoading ? "animate-spin" : ""} /></button>
                </div>
            </div>

            <DataTable columns={columns} data={logs} loading={isLoading} emptyMessage="No audit logs found" />

            {expandedLog && (
                <section className="ws-panel">
                    <h3 className="ws-section-title mb-3">Changes · #{expandedLog.slice(0, 8)}</h3>
                    <pre className="ws-code">
                        {JSON.stringify(logs.find((l) => l.id === expandedLog)?.object_changes, null, 2)}
                    </pre>
                </section>
            )}

            {totalPages > 1 && (
                <div className="ws-pagination">
                    <span>Page {page} of {totalPages}</span>
                    <div>
                        <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} aria-label="Previous page"><ChevronLeftIcon /></button>
                        <button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} aria-label="Next page"><ChevronRightIcon /></button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Error Log Panel ──────────────────────────────────────────── */
function ErrorLogPanel() {
    const [expanded, setExpanded] = useState<number | null>(null);

    const { data, isLoading, refetch } = useErrorLogs({ lines: "1000" });

    const errors: AnyObj[] = data?.errors || [];
    const total: number = data?.total || 0;

    return (
        <div className="space-y-3">
            <div className="ws-toolbar">
                <span className="text-[11px] ws-muted">{total} error{total !== 1 ? "s" : ""} found in the last 1000 lines</span>
                <div className="ws-toolbar-actions">
                    <button type="button" onClick={() => refetch()} disabled={isLoading} aria-label="Refresh errors" className="ws-icon-button"><ArrowPathIcon className={isLoading ? "animate-spin" : ""} /></button>
                </div>
            </div>

            {isLoading ? (
                <div className="ws-panel space-y-3" role="status" aria-label="Loading errors">
                    <span className="ws-skeleton block" style={{ height: 14 }} />
                    <span className="ws-skeleton block" style={{ height: 14, maxWidth: "70%" }} />
                </div>
            ) : errors.length === 0 ? (
                <div className="ws-panel ws-empty">
                    <span className="ws-empty-mark"><ServerIcon aria-hidden="true" /></span>
                    <h3>No errors found</h3>
                    <p>The system is running clean.</p>
                </div>
            ) : (
                <div className="ws-table-panel divide-y divide-[var(--ov-line)]">
                    {errors.map((err, idx) => (
                        <div key={idx}>
                            <button
                                type="button"
                                aria-expanded={expanded === idx}
                                onClick={() => setExpanded(expanded === idx ? null : idx)}
                                className="w-full p-4 text-left hover:bg-[var(--ov-wash)]"
                            >
                                <div className="flex items-start gap-2">
                                    <ExclamationTriangleIcon className="h-4 w-4 ws-bad mt-0.5 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="ws-mono truncate text-xs ws-bad">{String(err.message)}</p>
                                        <div className="mt-1 flex gap-3 text-[11px] ws-muted">
                                            {err.timestamp ? <span>{String(err.timestamp)}</span> : null}
                                            {Array.isArray(err.trace) && err.trace.length > 0 ? <span>{(err.trace as unknown[]).length} trace lines</span> : null}
                                        </div>
                                    </div>
                                </div>
                            </button>
                            {expanded === idx && Array.isArray(err.trace) && err.trace.length > 0 && (
                                <div className="px-4 pb-4">
                                    <pre className="ws-code">
                                        {(err.trace as string[]).map((line, i) => (
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
