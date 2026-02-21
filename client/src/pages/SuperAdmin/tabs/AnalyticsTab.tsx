import { useState, useEffect } from "react";
import {
    ChartBarIcon, CurrencyDollarIcon, UsersIcon, GlobeAltIcon,
    ArrowTrendingUpIcon, ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import StatsCard from "../components/StatsCard";
import {
    fetchDashboardAnalytics, fetchProductAnalytics,
    fetchRevenueAnalytics, fetchConversionAnalytics, fetchGeolocationAnalytics,
} from "../../../services/adminApi";

// ── Pure SVG Mini-Charts ──

function BarChart({ data, labelKey, valueKey, color = "#ef4444" }: { data: Record<string, unknown>[]; labelKey: string; valueKey: string; color?: string }) {
    if (!data.length) return <p className="text-muted-foreground text-sm text-center py-6">No data</p>;
    const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
    const barW = Math.min(40, Math.floor(600 / data.length) - 4);
    return (
        <svg viewBox={`0 0 ${data.length * (barW + 4)} 160`} className="w-full h-48">
            {data.map((d, i) => {
                const val = Number(d[valueKey]) || 0;
                const h = (val / max) * 120;
                return (
                    <g key={i}>
                        <rect x={i * (barW + 4)} y={140 - h} width={barW} height={h} rx={3} fill={color} opacity={0.85} />
                        <text x={i * (barW + 4) + barW / 2} y={155} textAnchor="middle" fontSize="8" fill="#9ca3af" className="select-none">
                            {String(d[labelKey] || "").slice(0, 6)}
                        </text>
                        <title>{`${d[labelKey]}: ${val.toLocaleString()}`}</title>
                    </g>
                );
            })}
        </svg>
    );
}

function DonutChart({ data, labelKey, valueKey }: { data: Record<string, unknown>[]; labelKey: string; valueKey: string }) {
    const total = data.reduce((s, d) => s + (Number(d[valueKey]) || 0), 0);
    if (!total) return <p className="text-muted-foreground text-sm text-center py-6">No data</p>;
    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
    let cumulative = 0;
    const slices = data.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const pct = val / total;
        const startAngle = cumulative * 2 * Math.PI;
        cumulative += pct;
        const endAngle = cumulative * 2 * Math.PI;
        const largeArc = pct > 0.5 ? 1 : 0;
        const x1 = 50 + 40 * Math.cos(startAngle - Math.PI / 2);
        const y1 = 50 + 40 * Math.sin(startAngle - Math.PI / 2);
        const x2 = 50 + 40 * Math.cos(endAngle - Math.PI / 2);
        const y2 = 50 + 40 * Math.sin(endAngle - Math.PI / 2);
        return (
            <path key={i} d={`M50,50 L${x1},${y1} A40,40 0 ${largeArc},1 ${x2},${y2} Z`} fill={colors[i % colors.length]} opacity={0.85}>
                <title>{`${d[labelKey]}: ${val} (${(pct * 100).toFixed(1)}%)`}</title>
            </path>
        );
    });
    return (
        <div className="flex items-center gap-4">
            <svg viewBox="0 0 100 100" className="w-32 h-32 flex-shrink-0">{slices}<circle cx={50} cy={50} r={22} fill="#1f2937" /></svg>
            <div className="space-y-1.5 min-w-0">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }} />
                        <span className="text-muted-foreground truncate capitalize">{String(d[labelKey])}</span>
                        <span className="text-muted-foreground ml-auto">{Number(d[valueKey]).toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LineChart({ data, color = "#ef4444" }: { data: { date: string; value: number }[]; color?: string }) {
    if (!data.length) return <p className="text-muted-foreground text-sm text-center py-6">No data</p>;
    const max = Math.max(...data.map((d) => d.value), 1);
    const w = 600;
    const h = 140;
    const points = data.map((d, i) => ({ x: (i / Math.max(data.length - 1, 1)) * w, y: h - (d.value / max) * (h - 20) }));
    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const area = `${line} L${w},${h} L0,${h} Z`;
    return (
        <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full h-44" preserveAspectRatio="none">
            <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
            <path d={area} fill="url(#areaGrad)" />
            <path d={line} fill="none" stroke={color} strokeWidth="2" />
            {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill={color}><title>{`${data[i].date}: ${data[i].value.toLocaleString()}`}</title></circle>
            ))}
        </svg>
    );
}

function FunnelChart({ data }: { data: { stage: string; count: number }[] }) {
    if (!data.length) return null;
    const max = Math.max(data[0].count, 1);
    return (
        <div className="space-y-2">
            {data.map((d, i) => {
                const pct = (d.count / max) * 100;
                return (
                    <div key={i}>
                        <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">{d.stage}</span><span className="text-foreground font-medium">{d.count.toLocaleString()}</span></div>
                        <div className="h-6 bg-muted rounded-lg overflow-hidden">
                            <div className="h-full rounded-lg transition-all duration-500" style={{ width: `${pct}%`, background: `hsl(${350 - i * 40}, 70%, 50%)` }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Geo Heatmap (simplified country list) ──
function GeoMap({ countries }: { countries: { country: string; users: number }[] }) {
    if (!countries.length) return <p className="text-muted-foreground text-sm text-center py-6">No geolocation data available</p>;
    const max = Math.max(...countries.map((c) => c.users), 1);
    return (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {countries.slice(0, 20).map((c, i) => {
                const pct = (c.users / max) * 100;
                return (
                    <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-20 truncate">{c.country}</span>
                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%`, opacity: 0.4 + (pct / 100) * 0.6 }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">{c.users.toLocaleString()}</span>
                    </div>
                );
            })}
        </div>
    );
}

// ── Main Tab ──

export default function AnalyticsTab() {
    const [loading, setLoading] = useState(true);
    const [dashboard, setDashboard] = useState<Record<string, unknown>>({});
    const [products, setProducts] = useState<{ top_products: Record<string, unknown>[]; type_breakdown: Record<string, unknown>[] }>({ top_products: [], type_breakdown: [] });
    const [revenue, setRevenue] = useState<{ data: { date: string; value: number }[] }>({ data: [] });
    const [conversions, setConversions] = useState<{ funnel: { stage: string; count: number }[]; conversion_rate: number; repeat_rate: number }>({ funnel: [], conversion_rate: 0, repeat_rate: 0 });
    const [geo, setGeo] = useState<{ countries: { country: string; users: number }[]; total_countries: number }>({ countries: [], total_countries: 0 });
    const [dateRange, setDateRange] = useState("30");

    useEffect(() => {
        const params = { start_date: new Date(Date.now() - Number(dateRange) * 86400000).toISOString().split("T")[0] };
        setLoading(true);
        Promise.allSettled([
            fetchDashboardAnalytics(params),
            fetchProductAnalytics(params),
            fetchRevenueAnalytics(params),
            fetchConversionAnalytics(params),
            fetchGeolocationAnalytics(),
        ]).then(([d, p, r, c, g]) => {
            if (d.status === "fulfilled") setDashboard(d.value.data);
            if (p.status === "fulfilled") setProducts(p.value.data);
            if (r.status === "fulfilled") {
                const rev = r.value.data.data?.map((x: Record<string, unknown>) => ({ date: String(x.period).slice(0, 10), value: Number(x.total) })) || [];
                setRevenue({ data: rev });
            }
            if (c.status === "fulfilled") setConversions(c.value.data);
            if (g.status === "fulfilled") setGeo(g.value.data);
            setLoading(false);
        });
    }, [dateRange]);

    const metrics = (dashboard as Record<string, Record<string, number>>).metrics || {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Business Intelligence</h2>
                    <p className="text-muted-foreground text-sm mt-1">Product analytics, revenue trends, and user insights</p>
                </div>
                <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-muted-foreground focus:outline-none focus:border-red-500">
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                </select>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatsCard title="Revenue" value={`$${Number(metrics.total_revenue || 0).toLocaleString()}`} icon={CurrencyDollarIcon} loading={loading} />
                <StatsCard title="Orders" value={Number(metrics.total_orders || 0)} icon={ShoppingCartIcon} loading={loading} />
                <StatsCard title="New Users" value={Number(metrics.new_users || 0)} icon={UsersIcon} loading={loading} />
                <StatsCard title="Avg Order Value" value={`$${Number(metrics.avg_order_value || 0).toFixed(2)}`} icon={ArrowTrendingUpIcon} loading={loading} />
            </div>

            {/* Revenue Trend + Product Type Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2"><ArrowTrendingUpIcon className="h-5 w-5 text-red-500" />Revenue Trend</h3>
                    {loading ? <div className="h-44 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" /></div> : <LineChart data={revenue.data} />}
                </div>
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-3">Product Mix</h3>
                    {loading ? <div className="h-32 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" /></div> : <DonutChart data={products.type_breakdown} labelKey="type" valueKey="revenue" />}
                </div>
            </div>

            {/* Top Products */}
            <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2"><ChartBarIcon className="h-5 w-5 text-red-500" />Top Products by Revenue</h3>
                {loading ? <div className="h-48 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" /></div> : <BarChart data={products.top_products} labelKey="name" valueKey="revenue" />}
            </div>

            {/* Conversion Funnel + Geolocation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-1">Conversion Funnel</h3>
                    <p className="text-xs text-muted-foreground mb-4">Rate: {conversions.conversion_rate}% signup→order · {conversions.repeat_rate}% repeat</p>
                    {loading ? <div className="h-32 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" /></div> : <FunnelChart data={conversions.funnel} />}
                </div>
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2"><GlobeAltIcon className="h-5 w-5 text-blue-500" />User Geolocation</h3>
                    <p className="text-xs text-muted-foreground mb-4">{geo.total_countries} countries</p>
                    {loading ? <div className="h-32 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500" /></div> : <GeoMap countries={geo.countries} />}
                </div>
            </div>
        </div>
    );
}
