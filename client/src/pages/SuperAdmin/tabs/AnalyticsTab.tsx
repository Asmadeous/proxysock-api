import { useState } from "react";
import {
    ChartBarIcon, CurrencyDollarIcon, UsersIcon, GlobeAltIcon,
    ArrowTrendingUpIcon, ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import StatsCard from "../components/StatsCard";
import { StatsCardSkeleton } from "../components/TableSkeleton";
import {
    useDashboardAnalytics,
    useProductAnalytics,
    useRevenueAnalytics,
    useConversionAnalytics,
    useGeolocationAnalytics,
    type TopProduct,
    type TypeBreakdown,
} from "../queries/analytics.queries";

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

function ChartLoader() {
    return (
        <div className="flex items-center justify-center h-44">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
    );
}

// ── Main Tab ──

export default function AnalyticsTab() {
    const [dateRange, setDateRange] = useState("30");

    const startDate = new Date(Date.now() - Number(dateRange) * 86400000).toISOString().split("T")[0];
    const params = { startDate };

    const { data: dashboardData, isLoading: dashboardLoading } = useDashboardAnalytics(params);
    const { data: productsData, isLoading: productsLoading } = useProductAnalytics(params);
    const { data: revenueData, isLoading: revenueLoading } = useRevenueAnalytics(params);
    const { data: conversionData, isLoading: conversionLoading } = useConversionAnalytics(params);
    const { data: geoData, isLoading: geoLoading } = useGeolocationAnalytics();

    const metrics = dashboardData?.metrics ?? {} as Record<string, number>;
    const topProducts: TopProduct[] = productsData?.top_products ?? [];
    const typeBreakdown: TypeBreakdown[] = productsData?.type_breakdown ?? [];
    const revenueSeries = (revenueData?.data ?? []).map((x) => ({
        date: x.period.slice(0, 10),
        value: x.total,
    }));
    const funnel = conversionData?.funnel ?? [];
    const conversionRate = conversionData?.conversion_rate ?? 0;
    const repeatRate = conversionData?.repeat_rate ?? 0;
    const countries = geoData?.countries ?? [];
    const totalCountries = geoData?.total_countries ?? 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Business Intelligence</h2>
                    <p className="text-muted-foreground text-sm mt-1">Product analytics, revenue trends, and user insights</p>
                </div>
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-muted-foreground focus:outline-none focus:border-primary"
                >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                </select>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {dashboardLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)
                ) : (
                    <>
                        <StatsCard title="Revenue" value={`$${Number(metrics.total_revenue || 0).toLocaleString()}`} icon={CurrencyDollarIcon} />
                        <StatsCard title="Orders" value={Number(metrics.total_orders || 0)} icon={ShoppingCartIcon} />
                        <StatsCard title="New Users" value={Number(metrics.new_users || 0)} icon={UsersIcon} />
                        <StatsCard title="Avg Order Value" value={`$${Number(metrics.avg_order_value || 0).toFixed(2)}`} icon={ArrowTrendingUpIcon} />
                    </>
                )}
            </div>

            {/* Revenue Trend + Product Type Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                        <ArrowTrendingUpIcon className="h-5 w-5 text-primary" />Revenue Trend
                    </h3>
                    {revenueLoading ? <ChartLoader /> : <LineChart data={revenueSeries} />}
                </div>
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-3">Product Mix</h3>
                    {productsLoading ? <ChartLoader /> : <DonutChart data={typeBreakdown} labelKey="type" valueKey="revenue" />}
                </div>
            </div>

            {/* Top Products */}
            <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5 text-primary" />Top Products by Revenue
                </h3>
                {productsLoading ? <ChartLoader /> : <BarChart data={topProducts} labelKey="name" valueKey="revenue" />}
            </div>

            {/* Conversion Funnel + Geolocation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-1">Conversion Funnel</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                        Rate: {conversionRate}% signup→order · {repeatRate}% repeat
                    </p>
                    {conversionLoading ? <ChartLoader /> : <FunnelChart data={funnel} />}
                </div>
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                        <GlobeAltIcon className="h-5 w-5 text-blue-500" />User Geolocation
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">{totalCountries} countries</p>
                    {geoLoading ? <ChartLoader /> : <GeoMap countries={countries} />}
                </div>
            </div>
        </div>
    );
}
