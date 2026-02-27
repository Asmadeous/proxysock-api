import { useState, useEffect, useCallback } from "react";
import {
    ServerStackIcon,
    CpuChipIcon,
    CircleStackIcon,
    BoltIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    ComputerDesktopIcon,
    ChartBarIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";
import StatsCard from "../components/StatsCard";
import { fetchMonitoringData } from "../../../services/adminApi";

interface ServiceStatus {
    name: string;
    status: string;
    checked_at: string;
}

interface BackupEntry {
    status: string;
    vm_id: string;
    at: string;
}

interface MonitoringData {
    system: {
        ruby_version: string;
        rails_version: string;
        environment: string;
        uptime_seconds: number;
        memory_mb: number;
        cpu_count: number;
    };
    application: {
        total_users: number;
        total_orders: number;
        orders_today: number;
        revenue_today: number;
        revenue_this_month: number;
        active_checkout_sessions: number;
        pending_orders: number;
        failed_orders_today: number;
    };
    database: {
        pool_size: number;
        connections_in_use: number;
        connections_available: number;
        database_size_mb: number;
    };
    jobs: {
        enqueued?: number;
        processed?: number;
        failed?: number;
        retry_size?: number;
        scheduled_size?: number;
        workers_size?: number;
        default_queue_latency?: number;
        message?: string;
    };
    vms: {
        total: number;
        active: number;
        provisioning: number;
        failed: number;
        terminated: number;
        pending: number;
        recent_backups: BackupEntry[];
    };
    services: ServiceStatus[];
    timestamp: string;
}

function formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

export default function MonitoringTab() {
    const [data, setData] = useState<MonitoringData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const loadData = useCallback(async () => {
        try {
            setError(null);
            const res = await fetchMonitoringData();
            setData(res.data);
            setLastRefresh(new Date());
        } catch (err) {
            console.error("Monitoring load error:", err);
            setError("Failed to fetch monitoring data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, [loadData]);

    const handleRefresh = () => {
        setLoading(true);
        loadData();
    };

    if (error && !data) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <XCircleIcon className="h-12 w-12 text-destructive" />
                <p className="text-destructive font-medium">{error}</p>
                <button onClick={handleRefresh} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">System Monitoring</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Real-time infrastructure & application health
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                        Updated {lastRefresh.toLocaleTimeString()}
                    </span>
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2 rounded-lg bg-card border border-border hover:bg-muted transition disabled:opacity-50"
                    >
                        <ArrowPathIcon className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <a
                        href={`${window.location.protocol}//${window.location.hostname}:3001`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition flex items-center gap-1.5"
                    >
                        <ChartBarIcon className="h-4 w-4" />
                        Grafana
                    </a>
                </div>
            </div>

            {/* Service Health */}
            <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BoltIcon className="h-5 w-5 text-yellow-500" />
                    Service Health
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(data?.services || []).map((svc) => (
                        <div
                            key={svc.name}
                            className={`flex items-center gap-2 p-3 rounded-lg border ${svc.status === "healthy"
                                    ? "border-green-500/30 bg-green-500/5"
                                    : "border-destructive/30 bg-destructive/5"
                                }`}
                        >
                            {svc.status === "healthy" ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0" />
                            ) : (
                                <XCircleIcon className="h-5 w-5 text-destructive shrink-0" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-foreground">{svc.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{svc.status}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* System Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="System Uptime"
                    value={data ? formatUptime(data.system.uptime_seconds) : "—"}
                    icon={ClockIcon}
                    loading={loading}
                />
                <StatsCard
                    title="Memory Usage"
                    value={data ? `${data.system.memory_mb} MB` : "—"}
                    icon={CpuChipIcon}
                    loading={loading}
                />
                <StatsCard
                    title="CPU Cores"
                    value={data?.system.cpu_count || 0}
                    icon={CpuChipIcon}
                    loading={loading}
                />
                <StatsCard
                    title="Database Size"
                    value={data ? `${data.database.database_size_mb} MB` : "—"}
                    icon={CircleStackIcon}
                    loading={loading}
                />
            </div>

            {/* Application Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Orders Today"
                    value={data?.application.orders_today || 0}
                    icon={ServerStackIcon}
                    loading={loading}
                />
                <StatsCard
                    title="Revenue Today"
                    value={data ? `$${data.application.revenue_today.toFixed(2)}` : "$0.00"}
                    icon={ServerStackIcon}
                    loading={loading}
                    change={data ? `$${data.application.revenue_this_month.toFixed(0)} this month` : undefined}
                />
                <StatsCard
                    title="Pending Orders"
                    value={data?.application.pending_orders || 0}
                    icon={ServerStackIcon}
                    loading={loading}
                />
                <StatsCard
                    title="Failed Today"
                    value={data?.application.failed_orders_today || 0}
                    icon={ServerStackIcon}
                    loading={loading}
                    positive={(data?.application.failed_orders_today || 0) === 0}
                    change={(data?.application.failed_orders_today || 0) > 0 ? "Needs attention" : "All clear"}
                />
            </div>

            {/* VM & Jobs Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* VM Status */}
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <ComputerDesktopIcon className="h-5 w-5 text-blue-500" />
                        Virtual Machines
                    </h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                            { label: "Active", value: data?.vms.active || 0, color: "text-green-500" },
                            { label: "Provisioning", value: data?.vms.provisioning || 0, color: "text-yellow-500" },
                            { label: "Failed", value: data?.vms.failed || 0, color: "text-destructive" },
                            { label: "Pending", value: data?.vms.pending || 0, color: "text-blue-500" },
                            { label: "Terminated", value: data?.vms.terminated || 0, color: "text-muted-foreground" },
                            { label: "Total", value: data?.vms.total || 0, color: "text-foreground" },
                        ].map((item) => (
                            <div key={item.label} className="text-center p-2 rounded-lg bg-muted/50">
                                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Recent Backups */}
                    {(data?.vms.recent_backups || []).length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Recent Backups</p>
                            <div className="space-y-1.5">
                                {data!.vms.recent_backups.map((bk, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-muted/30">
                                        <span className="text-muted-foreground">VM {bk.vm_id}</span>
                                        <span className={bk.status === "success" ? "text-green-500" : "text-destructive"}>
                                            {bk.status}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {new Date(bk.at).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidekiq Jobs */}
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <ServerStackIcon className="h-5 w-5 text-purple-500" />
                        Background Jobs (Sidekiq)
                    </h3>
                    {data?.jobs.message ? (
                        <p className="text-sm text-muted-foreground">{data.jobs.message}</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Enqueued", value: data?.jobs.enqueued ?? 0, color: "text-blue-500" },
                                { label: "Processed", value: data?.jobs.processed ?? 0, color: "text-green-500" },
                                { label: "Failed", value: data?.jobs.failed ?? 0, color: "text-destructive" },
                                { label: "Retrying", value: data?.jobs.retry_size ?? 0, color: "text-yellow-500" },
                                { label: "Scheduled", value: data?.jobs.scheduled_size ?? 0, color: "text-muted-foreground" },
                                { label: "Workers", value: data?.jobs.workers_size ?? 0, color: "text-foreground" },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <span className="text-sm text-muted-foreground">{item.label}</span>
                                    <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                                </div>
                            ))}
                            {data?.jobs.default_queue_latency !== undefined && (
                                <div className="col-span-2 flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <span className="text-sm text-muted-foreground">Queue Latency</span>
                                    <span className="text-lg font-bold text-foreground">
                                        {data.jobs.default_queue_latency}s
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Database Pool */}
            <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CircleStackIcon className="h-5 w-5 text-emerald-500" />
                    Database Connection Pool
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-xl font-bold text-foreground">{data?.database.pool_size || 0}</p>
                        <p className="text-xs text-muted-foreground">Pool Size</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-xl font-bold text-blue-500">{data?.database.connections_in_use || 0}</p>
                        <p className="text-xs text-muted-foreground">In Use</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-xl font-bold text-green-500">{data?.database.connections_available || 0}</p>
                        <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                </div>
            </div>

            {/* System Info Footer */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-card rounded-xl border border-border p-4">
                <span>Ruby {data?.system.ruby_version}</span>
                <span>•</span>
                <span>Rails {data?.system.rails_version}</span>
                <span>•</span>
                <span className="capitalize">{data?.system.environment}</span>
                <span>•</span>
                <span>Prometheus: <a href={`${window.location.protocol}//${window.location.hostname}:9090`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">:9090</a></span>
                <span>•</span>
                <span>Grafana: <a href={`${window.location.protocol}//${window.location.hostname}:3001`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">:3001</a></span>
            </div>
        </div>
    );
}
