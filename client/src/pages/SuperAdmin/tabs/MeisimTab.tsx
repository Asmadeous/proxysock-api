import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw, ShieldCheck, Smartphone, Wallet, Zap } from "lucide-react";
import { fetchProviderBalances } from "../../../services/adminApi";
import { adminQueryKeys } from "../queries/queryKeys";
import MeisimWalletPanel from "../components/MeisimWalletPanel";
import MeisimVerifyPanel from "../components/MeisimVerifyPanel";
import MeisimVerifyHistory from "../components/MeisimVerifyHistory";
import MeisimLineTopupPanel from "../components/MeisimLineTopupPanel";
import MeisimLineTopupHistory from "../components/MeisimLineTopupHistory";
import EsimTopupQueue from "../components/EsimTopupQueue";
import PageHeader from "../components/PageHeader";

function Section({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
    return (
        <section className="ws-panel space-y-4">
            <div className="ws-panel-heading" style={{ marginBottom: 0 }}>
                <div><h2 className="flex items-center gap-2"><span className="text-[var(--ov-accent)] [&>svg]:h-4 [&>svg]:w-4">{icon}</span>{title}</h2><p>{description}</p></div>
            </div>
            {children}
        </section>
    );
}

const usd = (n: unknown) =>
    n == null || Number.isNaN(Number(n)) ? "—" : `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Everything MeiSIM in one page, opened from the MeiSIM card on Overview: the dealer wallet,
// eSIM Verify, line recharges through MeiSIM's top-up API, and customers' paid top-ups.
export default function MeisimTab() {
    const [verifyRuns, setVerifyRuns] = useState(0);
    const [rechargeRuns, setRechargeRuns] = useState(0);
    const { data: balances, isLoading, isFetching, refetch } = useQuery({
        queryKey: adminQueryKeys.providerBalances.all(),
        queryFn: fetchProviderBalances,
    });
    const meisim = balances?.meisim;
    const recharged = () => {
        setRechargeRuns((n) => n + 1);
        refetch();
    };

    return (
        <div className="ws-stack">
            <Link to="/admin/overview" className="proxy-back"><ArrowLeft size={14} aria-hidden="true" /> Overview</Link>
            <PageHeader
                title="MeiSIM"
                description="Phone line and travel eSIM dealer account."
                actions={<button type="button" onClick={() => refetch()} aria-label="Refresh balance" className="ws-icon-button"><RefreshCw className={isFetching ? "animate-spin" : ""} aria-hidden="true" /></button>}
            />

            <div className="overview-metrics" style={{ marginBottom: 0 }}>
                <div className="overview-metric">
                    <span>Wallet balance<Wallet size={16} aria-hidden="true" /></span>
                    {isLoading ? <span className="overview-skeleton" style={{ margin: "13px 0 8px" }} /> : <strong className={meisim?.error ? "ws-bad" : ""}>{meisim?.error ? "Connection failed" : usd(meisim?.balance)}</strong>}
                </div>
                <div className="overview-metric">
                    <span>Dealer markup<Smartphone size={16} aria-hidden="true" /></span>
                    {isLoading ? <span className="overview-skeleton" style={{ margin: "13px 0 8px" }} /> : <strong>{meisim?.markup_pct != null ? `${meisim.markup_pct}%` : "—"}</strong>}
                </div>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-3">
                <Section icon={<Wallet />} title="Wallet" description="Fund the dealer wallet by card and download its statement.">
                    <MeisimWalletPanel />
                </Section>
                <Section icon={<ShieldCheck />} title="Verify eSIMs"
                    description="Checks activation codes without using them up. $1 per code from the wallet; errors are refunded.">
                    <MeisimVerifyPanel onSubmitted={() => setVerifyRuns((n) => n + 1)} />
                    <MeisimVerifyHistory refreshKey={verifyRuns} />
                </Section>
                <Section icon={<Zap />} title="Recharge lines"
                    description="MeiSIM's top-up API, paid from the wallet. One line, or many in a row.">
                    <MeisimLineTopupPanel onDone={recharged} />
                    <MeisimLineTopupHistory refreshKey={rechargeRuns} />
                </Section>
            </div>

            <EsimTopupQueue onRecharged={recharged} />
        </div>
    );
}
