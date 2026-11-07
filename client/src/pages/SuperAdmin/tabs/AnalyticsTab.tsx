import { useState } from "react";
import {
    CurrencyDollarIcon, UsersIcon,
    ArrowTrendingUpIcon, ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import PageHeader from "../components/PageHeader";
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

function BarChart({ data, labelKey, valueKey, color = "currentColor" }: { data: Record<string, unknown>[]; labelKey: string; valueKey: string; color?: string }) {
    if (!data.length) return <p className="text-[var(--ov-muted)] text-sm text-center py-6">No data</p>;
    const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
    const barW = Math.min(40, Math.floor(600 / data.length) - 4);
    return (
        <svg viewBox={`0 0 ${data.length * (barW + 4)} 160`} className="h-48 w-full text-[var(--ov-accent)]">
            {data.map((d, i) => {
                const val = Number(d[valueKey]) || 0;
                const h = (val / max) * 120;
                return (
                    <g key={i}>
                        <rect x={i * (barW + 4)} y={140 - h} width={barW} height={h} rx={3} fill={color} opacity={0.85} />
                        <text x={i * (barW + 4) + barW / 2} y={155} textAnchor="middle" fontSize="8" style={{ fill: "var(--ov-muted)" }} className="select-none">
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
    if (!total) return <p className="text-[var(--ov-muted)] text-sm text-center py-6">No data</p>;
    const colors = ["#c9212d", "#e46b73", "#8f3040", "#b7791f", "#3b6fd6", "#278963"];
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
            <svg viewBox="0 0 100 100" className="w-32 h-32 flex-shrink-0">{slices}<circle cx={50} cy={50} r={22} style={{ fill: "var(--ov-panel)" }} /></svg>
            <div className="space-y-1.5 min-w-0">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }} />
                        <span className="text-[var(--ov-muted)] truncate capitalize">{String(d[labelKey])}</span>
                        <span className="text-[var(--ov-muted)] ml-auto">{Number(d[valueKey]).toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LineChart({ data, color = "currentColor" }: { data: { date: string; value: number }[]; color?: string }) {
    if (!data.length) return <p className="text-[var(--ov-muted)] text-sm text-center py-6">No data</p>;
    const max = Math.max(...data.map((d) => d.value), 1);
    const w = 600;
    const h = 140;
    const points = data.map((d, i) => ({ x: (i / Math.max(data.length - 1, 1)) * w, y: h - (d.value / max) * (h - 20) }));
    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const area = `${line} L${w},${h} L0,${h} Z`;
    return (
        <svg viewBox={`0 0 ${w} ${h + 20}`} className="h-44 w-full text-[var(--ov-accent)]" preserveAspectRatio="none">
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
                        <div className="flex justify-between text-sm mb-1"><span className="text-[var(--ov-muted)]">{d.stage}</span><span className="text-[var(--ov-text)] font-medium">{d.count.toLocaleString()}</span></div>
                        <div className="h-2 overflow-hidden rounded-sm bg-[var(--ov-wash)]">
                            <div className="h-full bg-[var(--ov-accent)] transition-all duration-500" style={{ width: `${pct}%`, opacity: Math.max(1 - i * 0.15, 0.3) }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function GeoMap({ countries }: { countries: { country: string; users: number }[] }) {
    if (!countries.length) return <p className="text-[var(--ov-muted)] text-sm text-center py-6">No geolocation data available</p>;
    const max = Math.max(...countries.map((c) => c.users), 1);
    return (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {countries.slice(0, 20).map((c, i) => {
                const pct = (c.users / max) * 100;
                return (
                    <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-[var(--ov-muted)] w-20 truncate">{c.country}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-sm bg-[var(--ov-wash)]">
                            <div className="h-full bg-[var(--ov-accent)]" style={{ width: `${pct}%`, opacity: 0.4 + (pct / 100) * 0.6 }} />
                        </div>
                        <span className="text-xs text-[var(--ov-muted)] w-12 text-right">{c.users.toLocaleString()}</span>
                    </div>
                );
            })}
        </div>
    );
}

function ChartLoader() {
    return (
        <div className="flex h-44 flex-col justify-end gap-3" role="status" aria-label="Loading chart">
            <span className="ws-skeleton block" style={{ height: 12 }} />
            <span className="ws-skeleton block" style={{ height: 12, maxWidth: "80%" }} />
            <span className="ws-skeleton block" style={{ height: 12, maxWidth: "60%" }} />
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

    const kpis = [
        { label: "Revenue", value: `$${Number(metrics.total_revenue || 0).toLocaleString()}`, icon: CurrencyDollarIcon },
        { label: "Orders", value: Number(metrics.total_orders || 0).toLocaleString(), icon: ShoppingCartIcon },
        { label: "New users", value: Number(metrics.new_users || 0).toLocaleString(), icon: UsersIcon },
        { label: "Avg order value", value: `$${Number(metrics.avg_order_value || 0).toFixed(2)}`, icon: ArrowTrendingUpIcon },
    ];

    return (
        <div className="ws-stack">
            <PageHeader
                title="Analytics"
                description="Product analytics, revenue trends and user insights."
                actions={
                    <select aria-label="Date range" value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="ws-input" style={{ width: "auto" }}>
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                    </select>
                }
            />

            <div className="overview-metrics" style={{ marginBottom: 0 }}>
                {kpis.map(({ label, value, icon: Icon }) => (
                    <div className="overview-metric" key={label}>
                        <span>{label}<Icon width={16} height={16} aria-hidden="true" /></span>
                        {dashboardLoading ? <span className="overview-skeleton" style={{ margin: "13px 0 8px" }} /> : <strong>{value}</strong>}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="ws-panel lg:col-span-2" aria-labelledby="revenue-trend-title">
                    <div className="ws-panel-heading"><div><h2 id="revenue-trend-title">Revenue trend</h2><p>Daily revenue for the selected range.</p></div></div>
                    {revenueLoading ? <ChartLoader /> : <LineChart data={revenueSeries} />}
                </section>
                <section className="ws-panel" aria-labelledby="product-mix-title">
                    <div className="ws-panel-heading"><div><h2 id="product-mix-title">Product mix</h2><p>Revenue by product type.</p></div></div>
                    {productsLoading ? <ChartLoader /> : <DonutChart data={typeBreakdown} labelKey="type" valueKey="revenue" />}
                </section>
            </div>

            <section className="ws-panel" aria-labelledby="top-products-title">
                <div className="ws-panel-heading"><div><h2 id="top-products-title">Top products by revenue</h2><p>Best-selling products in the selected range.</p></div></div>
                {productsLoading ? <ChartLoader /> : <BarChart data={topProducts} labelKey="name" valueKey="revenue" />}
            </section>

            <div className="ws-grid-2">
                <section className="ws-panel" aria-labelledby="funnel-title">
                    <div className="ws-panel-heading"><div><h2 id="funnel-title">Conversion funnel</h2><p>{conversionRate}% signup to order · {repeatRate}% repeat</p></div></div>
                    {conversionLoading ? <ChartLoader /> : <FunnelChart data={funnel} />}
                </section>
                <section className="ws-panel" aria-labelledby="geo-title">
                    <div className="ws-panel-heading"><div><h2 id="geo-title">User geolocation</h2><p>{totalCountries} countries</p></div></div>
                    {geoLoading ? <ChartLoader /> : <GeoMap countries={countries} />}
                </section>
            </div>
        </div>
    );
}
