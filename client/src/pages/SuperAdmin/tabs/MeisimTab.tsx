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

function Section({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
    return (
        <section className="bg-card rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">{icon}</div>
                <div>
                    <h2 className="font-semibold text-foreground">{title}</h2>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="space-y-2">
                    <Link to="/admin/overview" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Overview
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 ring-1 ring-violet-500/20">
                            <Smartphone className="h-6 w-6 text-violet-500" aria-hidden="true" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">MeiSIM</h1>
                            <p className="text-sm text-muted-foreground">Phone line &amp; travel eSIM dealer account</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Wallet balance</p>
                        <p className="text-2xl font-bold text-foreground tabular-nums">
                            {isLoading ? "…" : meisim?.error ? "Connection failed" : usd(meisim?.balance)}
                        </p>
                    </div>
                    {meisim?.markup_pct != null && (
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Dealer markup</p>
                            <p className="text-2xl font-bold text-foreground tabular-nums">{meisim.markup_pct}%</p>
                        </div>
                    )}
                    <button onClick={() => refetch()} aria-label="Refresh balance" className="p-2 rounded-lg border border-border hover:bg-muted">
                        <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3 items-start">
                <Section icon={<Wallet className="w-5 h-5" />} title="Wallet" description="Fund the dealer wallet by card and download its statement.">
                    <MeisimWalletPanel />
                </Section>
                <Section icon={<ShieldCheck className="w-5 h-5" />} title="Verify eSIMs"
                    description="Checks activation codes without using them up. $1 per code from the wallet; errors are refunded.">
                    <MeisimVerifyPanel onSubmitted={() => setVerifyRuns((n) => n + 1)} />
                    <MeisimVerifyHistory refreshKey={verifyRuns} />
                </Section>
                <Section icon={<Zap className="w-5 h-5" />} title="Recharge lines"
                    description="MeiSIM's top-up API, paid from the wallet. One line, or many in a row.">
                    <MeisimLineTopupPanel onDone={recharged} />
                    <MeisimLineTopupHistory refreshKey={rechargeRuns} />
                </Section>
            </div>

            <EsimTopupQueue onRecharged={recharged} />
        </div>
    );
}
