import { useState, useEffect, useCallback } from "react";
import {
    CpuChipIcon, CircleStackIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon,
    ClockIcon, TrashIcon, ArrowUturnLeftIcon, ExclamationTriangleIcon, ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
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

function UsageBar({ pct, label }: { pct: number; label: string }) {
    return (
        <div>
            <div className="mb-2 flex justify-between gap-3 text-[11px]">
                <span className="ws-muted">{label}</span>
                <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="ws-meter" role="meter" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${Math.min(pct, 100)}%` }} />
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
            <div className="ws-stack">
                <PageHeader title="System monitoring" description="Infrastructure health, Proxmox, Sidekiq, Redis and WebSockets." />
                <div className="ws-panel ws-empty">
                    <span className="ws-empty-mark"><XCircleIcon aria-hidden="true" /></span>
                    <h3>{error}</h3>
                    <p>The monitoring endpoint did not respond.</p>
                    <Button onClick={handleRefresh}>Retry</Button>
                </div>
            </div>
        );
    }

    const pxNode = data?.proxmox || {};
    const redis = data?.redis || {};
    const ws = data?.websockets || {};
    const container = data?.containers || {};
    const jobs = data?.jobs || {};
    const origin = `${window.location.protocol}//${window.location.hostname}`;
    const hitTotal = (redis.keyspace_hits || 0) + (redis.keyspace_misses || 0);

    const systemMetrics = [
        { label: "Uptime", value: data ? formatUptime(data.system.uptime_seconds) : "—", icon: ClockIcon },
        { label: "Memory", value: data ? `${data.system.memory_mb} MB` : "—", icon: CpuChipIcon },
        { label: "CPU cores", value: data?.system.cpu_count || 0, icon: CpuChipIcon, note: data?.system.load_average ? `Load ${data.system.load_average.one}` : undefined },
        { label: "Database size", value: data ? `${data.database.database_size_mb} MB` : "—", icon: CircleStackIcon },
    ];

    return (
        <div className="ws-stack">
            <PageHeader
                title="System monitoring"
                description={`Infrastructure health, Proxmox, Sidekiq, Redis and WebSockets. Updated ${lastRefresh.toLocaleTimeString()}.`}
                actions={
                    <>
                        <a className="ws-button" data-variant="secondary" href={`${origin}/grafana/`} target="_blank" rel="noopener noreferrer">Grafana <ArrowTopRightOnSquareIcon /></a>
                        <a className="ws-button" data-variant="secondary" href={`${origin}/prometheus/`} target="_blank" rel="noopener noreferrer">Prometheus <ArrowTopRightOnSquareIcon /></a>
                        <button type="button" onClick={handleRefresh} disabled={loading} aria-label="Refresh" className="ws-icon-button"><ArrowPathIcon className={loading ? "animate-spin" : ""} /></button>
                    </>
                }
            />

            {(alerts.length > 0 || loadingAlerts) && (
                <section className="ws-panel" aria-labelledby="alerts-title">
                    <div className="ws-panel-heading">
                        <div><h2 id="alerts-title" className="flex items-center gap-2"><ExclamationTriangleIcon className="h-4 w-4 ws-bad" aria-hidden="true" />Active resource alerts</h2><p>{alerts.length} firing</p></div>
                    </div>
                    {loadingAlerts && alerts.length === 0 ? (
                        <div className="space-y-3" role="status" aria-label="Loading alerts">
                            <span className="ws-skeleton block" style={{ height: 14, maxWidth: "75%" }} />
                            <span className="ws-skeleton block" style={{ height: 14, maxWidth: "50%" }} />
                        </div>
                    ) : (
                        <ul className="ws-list">
                            {alerts.map(alert => (
                                <li key={alert.id} className="flex-col items-start sm:flex-row sm:items-center">
                                    <div className="min-w-0">
                                        <p className="flex flex-wrap items-center gap-2">
                                            <span className="ws-status" data-tone="bad">{alert.resource_type}</span>
                                            <strong className="font-medium">{alert.resource_name || alert.resource_id}</strong>
                                        </p>
                                        <p className="mt-1 text-[11px] ws-muted">
                                            <span className="ws-bad">{alert.metric.toUpperCase()}</span> {alert.value}% (threshold {alert.threshold}%)
                                            {alert.recipient_email && <> · Notified {alert.recipient_email}</>}
                                            {" · "}Started {new Date(alert.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <Button size="sm" variant="secondary" onClick={() => handleAcknowledgeAlert(alert.id)}>Acknowledge</Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            <section className="ws-panel" aria-labelledby="services-title">
                <div className="ws-panel-heading"><div><h2 id="services-title">Service health</h2><p>Hover a service for details.</p></div></div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {(data?.services || []).map((svc: AnyObj) => {
                        const tone = svc.status === "healthy" ? "good" : svc.status === "warning" ? "wait" : "bad";
                        const Icon = tone === "good" ? CheckCircleIcon : tone === "wait" ? ExclamationTriangleIcon : XCircleIcon;
                        return (
                            <div key={svc.name} title={svc.description || svc.details || ""} className="flex items-center gap-2 rounded border border-[var(--ov-line)] p-3">
                                <Icon className={`h-4 w-4 shrink-0 ws-${tone}`} aria-hidden="true" />
                                <div className="min-w-0">
                                    <p className="truncate text-xs">{svc.name}</p>
                                    <p className="text-[10px] capitalize ws-muted">{svc.status}</p>
                                </div>
                            </div>
                        );
                    })}
                    {loading && !data && Array.from({ length: 6 }).map((_, i) => <span key={i} className="ws-skeleton block" style={{ height: 52 }} />)}
                </div>
            </section>

            <div className="overview-metrics" style={{ marginBottom: 0 }}>
                {systemMetrics.map(({ label, value, icon: Icon, note }) => (
                    <div className="overview-metric" key={label}>
                        <span>{label}<Icon width={16} height={16} aria-hidden="true" /></span>
                        {loading && !data ? <span className="overview-skeleton" style={{ margin: "13px 0 8px" }} /> : <strong>{value}</strong>}
                        {note && <small>{note}</small>}
                    </div>
                ))}
            </div>

            <section className="ws-panel" aria-labelledby="proxmox-title">
                <div className="ws-panel-heading">
                    <div>
                        <h2 id="proxmox-title" className="flex items-center gap-2">Proxmox server {pxNode.status && <span className="ws-dot" data-ok={pxNode.status === "online" || !pxNode.error} aria-label={pxNode.error ? "Offline" : "Online"} />}</h2>
                        <p>{[pxNode.pve_version, pxNode.kernel_version && `Kernel ${pxNode.kernel_version}`, pxNode.uptime && `Up ${formatUptime(pxNode.uptime)}`].filter(Boolean).join(" · ") || "Hypervisor node status."}</p>
                    </div>
                </div>
                {pxNode.error ? <p className="text-xs ws-bad">{pxNode.error}</p> : (
                    <div className="space-y-6">
                        <dl className="ws-figures">
                            <div><dt>Node</dt><dd>{pxNode.node || "—"}</dd></div>
                            <div><dt>CPU · {pxNode.cpu_cores || 0} cores × {pxNode.cpu_sockets || 1}</dt><dd className="!text-sm">{pxNode.cpu_model || "—"}</dd></div>
                            <div><dt>Memory · {pxNode.memory_used_gb || 0} GB used</dt><dd>{pxNode.memory_total_gb ? `${pxNode.memory_total_gb} GB` : "—"}</dd></div>
                            <div><dt>VMs running · {pxNode.vms_total || 0} total</dt><dd>{pxNode.vms_running || 0}</dd></div>
                        </dl>
                        {pxNode.cpu_usage != null && (
                            <div className="ws-grid-2">
                                <UsageBar pct={pxNode.cpu_usage} label="CPU usage" />
                                {pxNode.memory_total_gb && <UsageBar pct={Math.round((pxNode.memory_used_gb / pxNode.memory_total_gb) * 100)} label="Memory usage" />}
                            </div>
                        )}
                        {pxNode.storage?.length > 0 && (
                            <div>
                                <h3 className="ws-section-title mb-3">Storage</h3>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {pxNode.storage.filter((s: AnyObj) => s.active).map((s: AnyObj) => (
                                        <UsageBar key={s.name} pct={s.usage_pct} label={`${s.name} (${s.type}) · ${s.used_gb || 0} / ${s.total_gb || 0} GB`} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="ws-panel" aria-labelledby="redis-title">
                    <div className="ws-panel-heading"><div><h2 id="redis-title" className="flex items-center gap-2">Redis <span className="ws-dot" data-ok={!redis.error} /></h2><p>Cache and job store.</p></div></div>
                    {redis.error ? <p className="text-xs ws-bad">{redis.error}</p> : (
                        <dl className="ws-rows">
                            <div><dt>Version</dt><dd className="ws-mono">{redis.version}</dd></div>
                            <div><dt>Uptime</dt><dd>{redis.uptime_seconds ? formatUptime(redis.uptime_seconds) : "—"}</dd></div>
                            <div><dt>Memory</dt><dd>{redis.used_memory_human}</dd></div>
                            <div><dt>Peak memory</dt><dd>{redis.used_memory_peak_human}</dd></div>
                            <div><dt>Clients</dt><dd>{redis.connected_clients}</dd></div>
                            <div><dt>Keys</dt><dd>{redis.db_size?.toLocaleString()}</dd></div>
                            <div><dt>Commands</dt><dd>{redis.total_commands_processed?.toLocaleString()}</dd></div>
                            <div><dt>Hit rate</dt><dd>{hitTotal > 0 ? `${((redis.keyspace_hits / hitTotal) * 100).toFixed(1)}%` : "N/A"}</dd></div>
                            <div><dt>Evicted</dt><dd className={redis.evicted_keys > 0 ? "ws-bad" : ""}>{redis.evicted_keys}</dd></div>
                            <div><dt>Role</dt><dd className="capitalize">{redis.role}</dd></div>
                        </dl>
                    )}
                </section>

                <section className="ws-panel" aria-labelledby="websockets-title">
                    <div className="ws-panel-heading"><div><h2 id="websockets-title" className="flex items-center gap-2">WebSockets <span className="ws-dot" data-ok={!!ws.pubsub_connected} /></h2><p>Action Cable connections.</p></div></div>
                    {ws.error ? <p className="text-xs ws-bad">{ws.error}</p> : (
                        <>
                            <dl className="ws-rows">
                                <div><dt>Adapter</dt><dd className="ws-mono capitalize">{ws.adapter}</dd></div>
                                <div><dt>PubSub</dt><dd className={ws.pubsub_connected ? "ws-good" : "ws-bad"}>{ws.pubsub_connected ? "Connected" : "Disconnected"}</dd></div>
                                <div><dt>Connections</dt><dd>{ws.connection_count ?? "N/A"}</dd></div>
                            </dl>
                            {Array.isArray(ws.allowed_origins) && ws.allowed_origins.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="ws-section-title mb-2">Allowed origins</h3>
                                    <ul className="ws-list">{ws.allowed_origins.map((o: string, i: number) => <li key={i} className="ws-mono">{String(o)}</li>)}</ul>
                                </div>
                            )}
                        </>
                    )}
                </section>

                <section className="ws-panel" aria-labelledby="container-title">
                    <div className="ws-panel-heading"><div><h2 id="container-title" className="flex items-center gap-2">Container <span className="ws-dot" data-ok={!!container.hostname} /></h2><p>Runtime limits and load.</p></div></div>
                    {container.error ? <p className="text-xs ws-bad">{container.error}</p> : (
                        <div className="space-y-4">
                            <dl className="ws-rows">
                                <div><dt>Hostname</dt><dd className="ws-mono">{container.hostname || "—"}</dd></div>
                                {container.container_id && <div><dt>Container ID</dt><dd className="ws-mono">{container.container_id?.slice(0, 12)}</dd></div>}
                                <div><dt>Docker</dt><dd>{container.running_in_docker ? "Yes" : "No"}</dd></div>
                                <div><dt>Memory limit</dt><dd>{container.memory_limit_mb === "unlimited" ? "Unlimited" : `${container.memory_limit_mb} MB`}</dd></div>
                                <div><dt>CPU limit</dt><dd>{container.cpu_limit === "unlimited" ? "Unlimited" : `${container.cpu_limit} cores`}</dd></div>
                                {data?.system?.load_average && <div><dt>Load (1m · 5m · 15m)</dt><dd>{data.system.load_average.one} · {data.system.load_average.five} · {data.system.load_average.fifteen}</dd></div>}
                            </dl>
                            {data?.system?.disk_usage?.usage_pct && (
                                <UsageBar pct={parseFloat(data.system.disk_usage.usage_pct)} label={`Disk · ${data.system.disk_usage.used} / ${data.system.disk_usage.total}`} />
                            )}
                        </div>
                    )}
                </section>
            </div>

            <section className="ws-panel" aria-labelledby="sidekiq-title">
                <div className="ws-panel-heading">
                    <div>
                        <h2 id="sidekiq-title">Sidekiq jobs</h2>
                        <p>{(jobs.processed || 0).toLocaleString()} processed · <span className={(jobs.failed || 0) > 0 ? "ws-bad" : ""}>{(jobs.failed || 0).toLocaleString()} failed</span> · {jobs.workers_size || 0} workers</p>
                    </div>
                </div>

                <dl className="ws-figures">
                    {[
                        { label: "Enqueued", value: jobs.enqueued ?? 0 },
                        { label: "Retries", value: jobs.retry_size ?? 0, tone: (jobs.retry_size ?? 0) > 0 ? "ws-wait" : "" },
                        { label: "Dead", value: jobs.dead_size ?? 0, tone: (jobs.dead_size ?? 0) > 0 ? "ws-bad" : "" },
                        { label: "Scheduled", value: jobs.scheduled_size ?? 0 },
                        { label: "Latency", value: `${jobs.default_queue_latency || 0}s` },
                    ].map((m) => (
                        <div key={m.label}><dt>{m.label}</dt><dd className={m.tone}>{typeof m.value === "number" ? m.value.toLocaleString() : m.value}</dd></div>
                    ))}
                </dl>

                {jobs.processes?.length > 0 && (
                    <div className="mt-6">
                        <h3 className="ws-section-title mb-2">Processes ({jobs.processes_count})</h3>
                        <ul className="ws-list">
                            {jobs.processes.map((p: AnyObj, i: number) => (
                                <li key={i}>
                                    <div className="min-w-0"><p className="ws-mono">{p.hostname}:{p.pid}</p><p className="text-[11px] ws-muted">Queues: {p.queues?.join(", ")}{p.tag ? ` · ${p.tag}` : ""}</p></div>
                                    <span className="shrink-0 ws-muted">{p.busy}/{p.concurrency} busy</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
                    <div className="ws-tabs" role="group" aria-label="Job set">
                        {([
                            { key: "queues", label: "Queues", count: undefined },
                            { key: "retries", label: "Retries", count: jobs.retry_size || 0 },
                            { key: "dead", label: "Dead", count: jobs.dead_size || 0 },
                            { key: "scheduled", label: "Scheduled", count: jobs.scheduled_size || 0 },
                        ] as { key: JobTab; label: string; count?: number }[]).map(({ key, label, count }) => (
                            <button type="button" key={key} aria-pressed={jobTab === key} onClick={() => setJobTab(key)}>
                                {label}{count !== undefined && <span className="ws-count">{count}</span>}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2 pb-2">
                        {(jobTab === "retries" || jobTab === "dead") && (
                            <>
                                <Button size="sm" variant="secondary" onClick={() => confirmRetryAll(jobTab)}>Retry all</Button>
                                <Button size="sm" variant="danger" onClick={jobTab === "dead" ? confirmClearDead : confirmClearRetries}>Clear all</Button>
                            </>
                        )}
                        <Button size="sm" variant="ghost" onClick={loadJobs} disabled={jobLoading}><ArrowPathIcon className={jobLoading ? "animate-spin" : ""} />Refresh</Button>
                    </div>
                </div>

                <div className="mt-2">
                    {jobLoading ? (
                        <div className="space-y-3 py-4" role="status" aria-label="Loading jobs">
                            <span className="ws-skeleton block" style={{ height: 14 }} />
                            <span className="ws-skeleton block" style={{ height: 14, maxWidth: "70%" }} />
                        </div>
                    ) : jobData.items.length === 0 ? (
                        <p className="py-6 text-center text-xs ws-muted">{jobTab === "queues" ? "No queues." : "No jobs."}</p>
                    ) : jobTab === "queues" ? (
                        <ul className="ws-list">
                            {jobData.items.map((q: AnyObj) => (
                                <li key={q.name}>
                                    <div><p>{q.name}</p><p className="text-[11px] ws-muted">{q.size} job{q.size !== 1 ? "s" : ""} · {q.latency}s latency</p></div>
                                    {q.size > 0 && <Button size="sm" variant="secondary" onClick={() => confirmClearQueue(q.name)}><TrashIcon />Clear</Button>}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <ul className="ws-list max-h-96 overflow-y-auto">
                            {jobData.items.map((j: AnyObj) => (
                                <li key={j.jid}>
                                    <div className="min-w-0 flex-1">
                                        <p className="flex flex-wrap gap-2"><span className="ws-mono">{j.klass}</span><span className="ws-mono ws-muted">{j.jid?.slice(0, 8)}</span></p>
                                        {j.error_message && <p className="mt-0.5 truncate text-[11px] ws-bad">{j.error_class}: {j.error_message}</p>}
                                        <p className="text-[11px] ws-muted">
                                            {j.retry_count != null && <>Retries: {j.retry_count} · </>}
                                            {j.at ? new Date(j.at).toLocaleString() : j.created_at ? new Date(j.created_at).toLocaleString() : ""}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <button type="button" onClick={() => handleRetryJob(j.jid)} aria-label="Retry job" title="Retry" className="ws-icon-button"><ArrowUturnLeftIcon /></button>
                                        <button type="button" onClick={() => handleDeleteJob(j.jid)} aria-label="Delete job" title="Delete" className="ws-icon-button"><TrashIcon /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            <div className="ws-grid-2">
                <section className="ws-panel" aria-labelledby="vms-title">
                    <div className="ws-panel-heading"><div><h2 id="vms-title">Virtual machines</h2><p>Provisioned VM lifecycle states.</p></div></div>
                    <dl className="ws-figures">
                        {[
                            { label: "Active", value: data?.vms?.active || 0 },
                            { label: "Provisioning", value: data?.vms?.provisioning || 0 },
                            { label: "Failed", value: data?.vms?.failed || 0, tone: (data?.vms?.failed || 0) > 0 ? "ws-bad" : "" },
                        ].map((m) => <div key={m.label}><dt>{m.label}</dt><dd className={m.tone}>{m.value}</dd></div>)}
                    </dl>
                    <dl className="ws-figures">
                        {[
                            { label: "Pending", value: data?.vms?.pending || 0 },
                            { label: "Terminated", value: data?.vms?.terminated || 0 },
                            { label: "Total", value: data?.vms?.total || 0 },
                        ].map((m) => <div key={m.label}><dt>{m.label}</dt><dd>{m.value}</dd></div>)}
                    </dl>
                    {(data?.vms?.recent_backups || []).length > 0 && (
                        <div className="mt-4">
                            <h3 className="ws-section-title mb-2">Recent backups</h3>
                            <ul className="ws-list">
                                {data!.vms.recent_backups.map((bk: AnyObj, i: number) => (
                                    <li key={i}>
                                        <span>VM {bk.vm_id}</span>
                                        <span className="ws-status" data-tone={bk.status === "success" ? "good" : "bad"}>{bk.status}</span>
                                        <span className="ws-muted">{new Date(bk.at).toLocaleDateString()}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                <section className="ws-panel" aria-labelledby="db-pool-title">
                    <div className="ws-panel-heading"><div><h2 id="db-pool-title">Database pool</h2><p>ActiveRecord connection usage.</p></div></div>
                    <dl className="ws-figures">
                        <div><dt>Pool size</dt><dd>{data?.database?.pool_size || 0}</dd></div>
                        <div><dt>In use</dt><dd>{data?.database?.connections_in_use || 0}</dd></div>
                        <div><dt>Available</dt><dd>{data?.database?.connections_available || 0}</dd></div>
                    </dl>
                </section>
            </div>

            <p className="text-[11px] ws-muted">
                Ruby {data?.system?.ruby_version} · Rails {data?.system?.rails_version} · <span className="capitalize">{data?.system?.environment}</span>
            </p>

            <ConfirmModal open={!!confirmAction} onClose={() => setConfirmAction(null)} onConfirm={executeConfirm}
                title={confirmAction?.title || ""} message={confirmAction?.message || ""} confirmLabel="Confirm" loading={actionLoading} />
        </div>
    );
}
