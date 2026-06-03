import { useState, useEffect, useCallback } from "react";
import {
    ServerStackIcon, CpuChipIcon, CircleStackIcon, BoltIcon,
    CheckCircleIcon, XCircleIcon, ArrowPathIcon, ComputerDesktopIcon,
    ClockIcon, TrashIcon, ArrowUturnLeftIcon, SignalIcon,
    CommandLineIcon, CubeIcon, WifiIcon, ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import StatsCard from "../components/StatsCard";
import ConfirmModal from "../components/ConfirmModal";
import {
    fetchMonitoringData, fetchMonitoringQueues, fetchMonitoringRetries,
    fetchMonitoringDeadJobs, fetchMonitoringScheduled,
    retryMonitoringJob, deleteMonitoringJob, clearMonitoringQueue,
    clearMonitoringRetries, clearMonitoringDead, retryAllMonitoring,
    fetchResourceAlerts, acknowledgeResourceAlert
} from "../../../services/adminApi";
import { toast } from "sonner";
import { getApiError } from "../../../utils/apiError";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

function formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function StatusDot({ ok }: { ok: boolean }) {
    return <span className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />;
}

function UsageBar({ pct, label, color = "bg-red-500" }: { pct: number; label: string; color?: string }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground font-medium">{pct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
        </div>
    );
}

type JobTab = "queues" | "retries" | "dead" | "scheduled";

export default function MonitoringTab() {
    const [data, setData] = useState<AnyObj | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // Job Management State
    const [jobTab, setJobTab] = useState<JobTab>("queues");
    const [jobData, setJobData] = useState<AnyObj>({ items: [], total: 0 });
    const [jobLoading, setJobLoading] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => Promise<void> } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [alerts, setAlerts] = useState<AnyObj[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setError(null);
            const res = await fetchMonitoringData();
            setData(res.data);
            setLastRefresh(new Date());
            
            // Also load alerts
            setLoadingAlerts(true);
            const alertRes = await fetchResourceAlerts({ status: 'firing' });
            setAlerts(alertRes.data.alerts || []);
        } catch (err) {
            console.error("Monitoring load error:", err);
            setError("Failed to fetch monitoring data");
        } finally {
            setLoading(false);
            setLoadingAlerts(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [loadData]);

    const loadJobs = useCallback(async () => {
        setJobLoading(true);
        try {
            let res;
            switch (jobTab) {
                case "queues": res = await fetchMonitoringQueues(); setJobData({ items: res.data.queues || [], total: (res.data.queues || []).length }); break;
                case "retries": res = await fetchMonitoringRetries(); setJobData({ items: res.data.jobs || [], total: res.data.total || 0 }); break;
                case "dead": res = await fetchMonitoringDeadJobs(); setJobData({ items: res.data.jobs || [], total: res.data.total || 0 }); break;
                case "scheduled": res = await fetchMonitoringScheduled(); setJobData({ items: res.data.jobs || [], total: res.data.total || 0 }); break;
            }
        } catch (err) { toast.error(getApiError(err, "Failed to load job data")); }
        finally { setJobLoading(false); }
    }, [jobTab]);

    useEffect(() => { loadJobs(); }, [loadJobs]);

    const handleRefresh = () => { setLoading(true); loadData(); loadJobs(); };

    const handleAcknowledgeAlert = async (id: string) => {
        try {
            await acknowledgeResourceAlert(id);
            toast.success("Alert acknowledged (resolved)");
            setAlerts(alerts.filter(a => a.id !== id));
        } catch (err) {
            toast.error(getApiError(err, "Failed to acknowledge alert"));
        }
    };

    const handleRetryJob = async (jid: string) => {
        try { await retryMonitoringJob(jid); toast.success(`Job ${jid.slice(0, 8)} retried`); loadJobs(); }
        catch { toast.error("Failed to retry job"); }
    };
    const handleDeleteJob = async (jid: string) => {
        try { await deleteMonitoringJob(jid); toast.success(`Job ${jid.slice(0, 8)} deleted`); loadJobs(); }
        catch { toast.error("Failed to delete job"); }
    };

    const confirmClearQueue = (name: string) => setConfirmAction({
        title: "Clear Queue", message: `Clear all jobs in "${name}" queue?`,
        action: async () => { await clearMonitoringQueue(name); toast.success(`Queue "${name}" cleared`); loadJobs(); }
    });
    const confirmClearRetries = () => setConfirmAction({
        title: "Clear Retries", message: `Clear all ${data?.jobs?.retry_size || 0} retries?`,
        action: async () => { await clearMonitoringRetries(); toast.success("Retries cleared"); loadData(); loadJobs(); }
    });
    const confirmClearDead = () => setConfirmAction({
        title: "Clear Dead Jobs", message: `Permanently delete all ${data?.jobs?.dead_size || 0} dead jobs?`,
        action: async () => { await clearMonitoringDead(); toast.success("Dead jobs cleared"); loadData(); loadJobs(); }
    });
    const confirmRetryAll = (set: string) => setConfirmAction({
        title: "Retry All", message: `Retry all ${set === "dead" ? "dead" : "failed"} jobs?`,
        action: async () => { await retryAllMonitoring(set); toast.success("All jobs retried"); loadData(); loadJobs(); }
    });

    const executeConfirm = async () => {
        if (!confirmAction) return;
        setActionLoading(true);
        try { await confirmAction.action(); } catch (err) { toast.error(getApiError(err, "Action failed")); }
        finally { setActionLoading(false); setConfirmAction(null); }
    };

    if (error && !data) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <XCircleIcon className="h-12 w-12 text-destructive" />
                <p className="text-destructive font-medium">{error}</p>
                <button onClick={handleRefresh} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition">Retry</button>
            </div>
        );
    }

    const pxNode = data?.proxmox || {};
    const redis = data?.redis || {};
    const ws = data?.websockets || {};
    const container = data?.containers || {};
    const jobs = data?.jobs || {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">System Monitoring</h2>
                    <p className="text-muted-foreground text-sm mt-1">Infrastructure health, Proxmox, Sidekiq, Redis, and WebSockets</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Updated {lastRefresh.toLocaleTimeString()}</span>
                    <button onClick={handleRefresh} disabled={loading} className="p-2 rounded-lg bg-card border border-border hover:bg-muted transition disabled:opacity-50">
                        <ArrowPathIcon className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <a href={`${window.location.protocol}//${window.location.hostname}/grafana/`} target="_blank" rel="noopener noreferrer"
                        className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition flex items-center gap-1.5">
                        Grafana
                    </a>
                    <a href={`${window.location.protocol}//${window.location.hostname}/prometheus/`} target="_blank" rel="noopener noreferrer"
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1.5">
                        Prometheus
                    </a>
                </div>
            </div>

            {/* Service Health Row */}
            <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BoltIcon className="h-5 w-5 text-yellow-500" />Service Health
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {(data?.services || []).map((svc: AnyObj) => {
                        const isHealthy = svc.status === "healthy";
                        const isWarning = svc.status === "warning";
                        
                        return (
                            <div key={svc.name} 
                                 title={svc.description || svc.details || ""}
                                 className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                                     isHealthy ? "border-green-500/30 bg-green-500/5" : 
                                     isWarning ? "border-yellow-500/30 bg-yellow-500/5" : 
                                     "border-destructive/30 bg-destructive/5"
                                 }`}>
                                {isHealthy ? <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0" /> : 
                                 isWarning ? <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 shrink-0" /> : 
                                 <XCircleIcon className="h-5 w-5 text-destructive shrink-0" />}
                                <div>
                                    <p className="text-sm font-medium text-foreground">{svc.name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{svc.status}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Active Alerts ───────────────────────────────── */}
            {(alerts.length > 0 || loadingAlerts) && (
                <div className="bg-card rounded-xl border border-destructive/50 p-5 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-5 w-5" /> Active Resource Alerts
                            <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-bold">{alerts.length}</span>
                        </h3>
                    </div>
                    
                    {loadingAlerts && alerts.length === 0 ? (
                        <div className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-4 py-1">
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                                <div className="h-4 bg-muted rounded w-1/2"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.map(alert => (
                                <div key={alert.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20 gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-wider">
                                                {alert.resource_type}
                                            </span>
                                            <span className="font-semibold text-foreground">{alert.resource_name || alert.resource_id}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                                            <span><strong className="text-destructive">{alert.metric.toUpperCase()}</strong>: {alert.value}% (Threshold: {alert.threshold}%)</span>
                                            {alert.recipient_email && (
                                                <span className="flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    Notified: {alert.recipient_email}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Started: {new Date(alert.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleAcknowledgeAlert(alert.id)}
                                        className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-muted transition shrink-0"
                                    >
                                        Acknowledge
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* System Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Uptime" value={data ? formatUptime(data.system.uptime_seconds) : "—"} icon={ClockIcon} loading={loading} />
                <StatsCard title="Memory" value={data ? `${data.system.memory_mb} MB` : "—"} icon={CpuChipIcon} loading={loading} />
                <StatsCard title="CPU Cores" value={data?.system.cpu_count || 0} icon={CpuChipIcon} loading={loading}
                    change={data?.system.load_average ? `Load: ${data.system.load_average.one}` : undefined} />
                <StatsCard title="DB Size" value={data ? `${data.database.database_size_mb} MB` : "—"} icon={CircleStackIcon} loading={loading} />
            </div>

            {/* ── Proxmox Server ─────────────────────────────── */}
            <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <ServerStackIcon className="h-5 w-5 text-purple-500" />Proxmox Server
                    {pxNode.status && <StatusDot ok={pxNode.status === "online" || !pxNode.error} />}
                    {pxNode.pve_version && <span className="text-xs text-muted-foreground ml-auto font-mono">{pxNode.pve_version}</span>}
                </h3>
                {pxNode.error ? (
                    <p className="text-sm text-destructive">{pxNode.error}</p>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                <p className="text-xl font-bold text-foreground">{pxNode.node || "—"}</p>
                                <p className="text-xs text-muted-foreground">Node</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                <p className="text-xl font-bold text-foreground">{pxNode.cpu_model || "—"}</p>
                                <p className="text-xs text-muted-foreground">{pxNode.cpu_cores || 0} cores × {pxNode.cpu_sockets || 1} sockets</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                <p className="text-xl font-bold text-foreground">{pxNode.memory_total_gb ? `${pxNode.memory_total_gb} GB` : "—"}</p>
                                <p className="text-xs text-muted-foreground">{pxNode.memory_used_gb || 0} GB used</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                <p className="text-xl font-bold text-green-500">{pxNode.vms_running || 0}</p>
                                <p className="text-xs text-muted-foreground">VMs Running / {pxNode.vms_total || 0} total</p>
                            </div>
                        </div>
                        {pxNode.cpu_usage != null && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <UsageBar pct={pxNode.cpu_usage} label="CPU Usage" color="bg-purple-500" />
                                {pxNode.memory_total_gb && (
                                    <UsageBar pct={Math.round((pxNode.memory_used_gb / pxNode.memory_total_gb) * 100)} label="Memory Usage" color="bg-blue-500" />
                                )}
                            </div>
                        )}
                        {/* Storage */}
                        {pxNode.storage?.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">Storage</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {pxNode.storage.filter((s: AnyObj) => s.active).map((s: AnyObj) => (
                                        <div key={s.name} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-foreground font-medium">{s.name}</span>
                                                <span className="text-xs text-muted-foreground">{s.type}</span>
                                            </div>
                                            <UsageBar pct={s.usage_pct} label={`${s.used_gb || 0}GB / ${s.total_gb || 0}GB`} color="bg-emerald-500" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {pxNode.kernel_version && <p className="text-xs text-muted-foreground">Kernel: {pxNode.kernel_version}</p>}
                        {pxNode.uptime && <p className="text-xs text-muted-foreground">Server Uptime: {formatUptime(pxNode.uptime)}</p>}
                    </div>
                )}
            </div>

            {/* ── Redis + WebSocket + Container Row ─────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Redis */}
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                        <CircleStackIcon className="h-5 w-5 text-red-500" />Redis
                        <StatusDot ok={!redis.error} />
                    </h3>
                    {redis.error ? <p className="text-sm text-destructive">{redis.error}</p> : (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span className="text-foreground font-mono">{redis.version}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Uptime</span><span className="text-foreground">{redis.uptime_seconds ? formatUptime(redis.uptime_seconds) : "—"}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Memory</span><span className="text-foreground">{redis.used_memory_human}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Peak Memory</span><span className="text-foreground">{redis.used_memory_peak_human}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Clients</span><span className="text-foreground">{redis.connected_clients}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Keys</span><span className="text-foreground">{redis.db_size?.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Commands</span><span className="text-foreground">{redis.total_commands_processed?.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Hit Rate</span>
                                <span className="text-foreground">{redis.keyspace_hits + redis.keyspace_misses > 0 ? `${((redis.keyspace_hits / (redis.keyspace_hits + redis.keyspace_misses)) * 100).toFixed(1)}%` : "N/A"}</span>
                            </div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Evicted</span><span className={`${redis.evicted_keys > 0 ? "text-red-400" : "text-foreground"}`}>{redis.evicted_keys}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="text-foreground capitalize">{redis.role}</span></div>
                        </div>
                    )}
                </div>

                {/* WebSocket */}
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                        <WifiIcon className="h-5 w-5 text-blue-500" />WebSockets
                        <StatusDot ok={ws.pubsub_connected} />
                    </h3>
                    {ws.error ? <p className="text-sm text-destructive">{ws.error}</p> : (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Adapter</span><span className="text-foreground font-mono capitalize">{ws.adapter}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">PubSub</span>
                                <span className={ws.pubsub_connected ? "text-green-500" : "text-red-400"}>{ws.pubsub_connected ? "Connected" : "Disconnected"}</span>
                            </div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Connections</span><span className="text-foreground">{ws.connection_count ?? "N/A"}</span></div>
                            {ws.allowed_origins && (
                                <div>
                                    <p className="text-muted-foreground mb-1">Allowed Origins</p>
                                    <div className="space-y-0.5">
                                        {(Array.isArray(ws.allowed_origins) ? ws.allowed_origins : []).map((o: string, i: number) => (
                                            <p key={i} className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{String(o)}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Container Info */}
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                        <CubeIcon className="h-5 w-5 text-cyan-500" />Container
                        <StatusDot ok={!!container.hostname} />
                    </h3>
                    {container.error ? <p className="text-sm text-destructive">{container.error}</p> : (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Hostname</span><span className="text-foreground font-mono">{container.hostname || "—"}</span></div>
                            {container.container_id && <div className="flex justify-between"><span className="text-muted-foreground">Container ID</span><span className="text-foreground font-mono text-xs">{container.container_id?.slice(0, 12)}</span></div>}
                            <div className="flex justify-between"><span className="text-muted-foreground">Docker</span>
                                <span className={container.running_in_docker ? "text-blue-400" : "text-muted-foreground"}>{container.running_in_docker ? "Yes" : "No"}</span>
                            </div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Memory Limit</span><span className="text-foreground">{container.memory_limit_mb === "unlimited" ? "∞" : `${container.memory_limit_mb} MB`}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">CPU Limit</span><span className="text-foreground">{container.cpu_limit === "unlimited" ? "∞" : `${container.cpu_limit} cores`}</span></div>
                            {data?.system?.load_average && (
                                <div>
                                    <p className="text-muted-foreground mb-1">Load Average</p>
                                    <div className="flex gap-3">
                                        {["one", "five", "fifteen"].map((k) => (
                                            <div key={k} className="text-center">
                                                <p className="text-foreground font-medium">{data.system.load_average[k]}</p>
                                                <p className="text-[10px] text-muted-foreground">{k === "one" ? "1m" : k === "five" ? "5m" : "15m"}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {data?.system?.disk_usage?.usage_pct && (
                                <UsageBar pct={parseFloat(data.system.disk_usage.usage_pct)} label={`Disk: ${data.system.disk_usage.used} / ${data.system.disk_usage.total}`} color="bg-cyan-500" />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Sidekiq Job Management ─────────────────────── */}
            <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <CommandLineIcon className="h-5 w-5 text-purple-500" />Sidekiq Jobs
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Processed: <span className="text-foreground font-medium">{jobs.processed?.toLocaleString() || 0}</span></span>
                        <span className="text-muted-foreground">Failed: <span className={`font-medium ${(jobs.failed || 0) > 0 ? "text-red-400" : "text-foreground"}`}>{jobs.failed?.toLocaleString() || 0}</span></span>
                        <span className="text-muted-foreground">Workers: <span className="text-foreground font-medium">{jobs.workers_size || 0}</span></span>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                    {[
                        { label: "Enqueued", value: jobs.enqueued ?? 0, color: "text-blue-500" },
                        { label: "Retries", value: jobs.retry_size ?? 0, color: "text-yellow-500" },
                        { label: "Dead", value: jobs.dead_size ?? 0, color: "text-red-500" },
                        { label: "Scheduled", value: jobs.scheduled_size ?? 0, color: "text-muted-foreground" },
                        { label: "Latency", value: `${jobs.default_queue_latency || 0}s`, color: "text-foreground" },
                    ].map((m) => (
                        <div key={m.label} className="text-center p-3 rounded-lg bg-muted/50">
                            <p className={`text-xl font-bold ${m.color}`}>{typeof m.value === "number" ? m.value.toLocaleString() : m.value}</p>
                            <p className="text-xs text-muted-foreground">{m.label}</p>
                        </div>
                    ))}
                </div>

                {/* Sidekiq Processes */}
                {jobs.processes?.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Processes ({jobs.processes_count})</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {jobs.processes.map((p: AnyObj, i: number) => (
                                <div key={i} className="p-2.5 rounded-lg bg-muted/30 border border-border/50 text-xs">
                                    <div className="flex justify-between"><span className="text-foreground font-medium">{p.hostname}:{p.pid}</span><span className="text-muted-foreground">{p.busy}/{p.concurrency} busy</span></div>
                                    <p className="text-muted-foreground mt-0.5">Queues: {p.queues?.join(", ")}{p.tag ? ` · ${p.tag}` : ""}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Job Sub-tabs */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {([
                        { key: "queues", label: "Queues", icon: SignalIcon },
                        { key: "retries", label: `Retries (${jobs.retry_size || 0})`, icon: ArrowUturnLeftIcon },
                        { key: "dead", label: `Dead (${jobs.dead_size || 0})`, icon: ExclamationTriangleIcon },
                        { key: "scheduled", label: `Scheduled (${jobs.scheduled_size || 0})`, icon: ClockIcon },
                    ] as { key: JobTab; label: string; icon: typeof SignalIcon }[]).map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => setJobTab(key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${jobTab === key ? "bg-red-500 text-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                            <Icon className="h-4 w-4" />{label}
                        </button>
                    ))}
                </div>

                {/* Bulk Actions */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {jobTab === "retries" && (
                        <>
                            <button onClick={() => confirmRetryAll("retries")} className="px-2.5 py-1 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30">Retry All</button>
                            <button onClick={confirmClearRetries} className="px-2.5 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">Clear All</button>
                        </>
                    )}
                    {jobTab === "dead" && (
                        <>
                            <button onClick={() => confirmRetryAll("dead")} className="px-2.5 py-1 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30">Retry All</button>
                            <button onClick={confirmClearDead} className="px-2.5 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">Clear All</button>
                        </>
                    )}
                    <button onClick={loadJobs} disabled={jobLoading} className="px-2.5 py-1 text-xs bg-muted text-muted-foreground rounded-lg hover:text-foreground">
                        <ArrowPathIcon className={`h-3.5 w-3.5 inline mr-1 ${jobLoading ? "animate-spin" : ""}`} />Refresh
                    </button>
                </div>

                {/* Job List */}
                {jobLoading ? (
                    <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" /></div>
                ) : jobTab === "queues" ? (
                    <div className="space-y-2">
                        {jobData.items.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No queues</p> : jobData.items.map((q: AnyObj) => (
                            <div key={q.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{q.name}</p>
                                    <p className="text-xs text-muted-foreground">{q.size} job{q.size !== 1 ? "s" : ""} · {q.latency}s latency</p>
                                </div>
                                <div className="flex gap-2">
                                    {q.size > 0 && (
                                        <button onClick={() => confirmClearQueue(q.name)} className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 flex items-center gap-1">
                                            <TrashIcon className="h-3 w-3" />Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-1.5 max-h-96 overflow-y-auto">
                        {jobData.items.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No jobs</p> : jobData.items.map((j: AnyObj) => (
                            <div key={j.jid} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50 text-xs">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-foreground">{j.klass}</span>
                                        <span className="text-muted-foreground font-mono">{j.jid?.slice(0, 8)}</span>
                                    </div>
                                    {j.error_message && <p className="text-red-400 truncate mt-0.5">{j.error_class}: {j.error_message}</p>}
                                    {j.retry_count != null && <span className="text-muted-foreground">Retries: {j.retry_count}</span>}
                                    <p className="text-muted-foreground">{j.at ? new Date(j.at).toLocaleString() : j.created_at ? new Date(j.created_at).toLocaleString() : ""}</p>
                                </div>
                                <div className="flex gap-1 shrink-0 ml-2">
                                    <button onClick={() => handleRetryJob(j.jid)} className="p-1.5 rounded text-green-400 hover:bg-green-500/20" title="Retry">
                                        <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => handleDeleteJob(j.jid)} className="p-1.5 rounded text-red-400 hover:bg-red-500/20" title="Delete">
                                        <TrashIcon className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── VM Status + DB Pool ────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <ComputerDesktopIcon className="h-5 w-5 text-blue-500" />Virtual Machines
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: "Active", value: data?.vms?.active || 0, color: "text-green-500" },
                            { label: "Provisioning", value: data?.vms?.provisioning || 0, color: "text-yellow-500" },
                            { label: "Failed", value: data?.vms?.failed || 0, color: "text-destructive" },
                            { label: "Pending", value: data?.vms?.pending || 0, color: "text-blue-500" },
                            { label: "Terminated", value: data?.vms?.terminated || 0, color: "text-muted-foreground" },
                            { label: "Total", value: data?.vms?.total || 0, color: "text-foreground" },
                        ].map((item) => (
                            <div key={item.label} className="text-center p-2 rounded-lg bg-muted/50">
                                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                            </div>
                        ))}
                    </div>
                    {(data?.vms?.recent_backups || []).length > 0 && (
                        <div className="mt-3">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Recent Backups</p>
                            <div className="space-y-1.5">
                                {data!.vms.recent_backups.map((bk: AnyObj, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-muted/30">
                                        <span className="text-muted-foreground">VM {bk.vm_id}</span>
                                        <span className={bk.status === "success" ? "text-green-500" : "text-destructive"}>{bk.status}</span>
                                        <span className="text-muted-foreground">{new Date(bk.at).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <CircleStackIcon className="h-5 w-5 text-emerald-500" />Database Pool
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                            <p className="text-xl font-bold text-foreground">{data?.database?.pool_size || 0}</p>
                            <p className="text-xs text-muted-foreground">Pool Size</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                            <p className="text-xl font-bold text-blue-500">{data?.database?.connections_in_use || 0}</p>
                            <p className="text-xs text-muted-foreground">In Use</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                            <p className="text-xl font-bold text-green-500">{data?.database?.connections_available || 0}</p>
                            <p className="text-xs text-muted-foreground">Available</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-card rounded-xl border border-border p-4">
                <span>Ruby {data?.system?.ruby_version}</span><span>•</span>
                <span>Rails {data?.system?.rails_version}</span><span>•</span>
                <span className="capitalize">{data?.system?.environment}</span><span>•</span>
                <span>Prometheus: <a href={`${window.location.protocol}//${window.location.hostname}/prometheus/`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">/prometheus/</a></span>
                <span>•</span>
                <span>Grafana: <a href={`${window.location.protocol}//${window.location.hostname}/grafana/`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">/grafana/</a></span>
            </div>

            {/* Confirm Modal */}
            <ConfirmModal open={!!confirmAction} onClose={() => setConfirmAction(null)} onConfirm={executeConfirm}
                title={confirmAction?.title || ""} message={confirmAction?.message || ""} confirmLabel="Confirm" loading={actionLoading} />
        </div>
    );
}
