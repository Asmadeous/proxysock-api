import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, CreditCard, RefreshCw } from "lucide-react";
import { fetchResellerBalance, fetchResellerTransactions, createResellerDeposit, requestResellerPayout } from "../../../services/resellerApi";
import { getApiError } from "../../SuperAdmin/utils/errors";
import DataTable from "../../SuperAdmin/components/DataTable";
import PageHeader from "../../SuperAdmin/components/PageHeader";
import Button from "../../SuperAdmin/components/Button";
import WorkspaceDialog from "../../SuperAdmin/components/WorkspaceDialog";
import "../../UserDashboard/checkout.css";

const DEPOSIT_METHODS: { value: string; name: string; description: string; image?: string }[] = [
    { value: "bachs", name: "Bachs", description: "Card, bank transfer, mobile money or crypto. Charged in USD." },
    { value: "plisio", name: "Plisio", description: "Pay with cryptocurrency (BTC, ETH, USDT and more).", image: "/plisio.webp" },
    { value: "heleket", name: "Heleket", description: "Pay with cryptocurrency (BTC, ETH, USDT and more).", image: "/heleket.webp" },
];

const money = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ResWallet() {
    const user = JSON.parse(localStorage.getItem("resellerUser") || "{}");
    const isEnterprise = user?.reseller_type === "infrastructure";
    const isSingleProduct = user?.reseller_type === "single_product";
    const isBalanceBased = !isEnterprise; // api_only + single_product use balance
    const minDeposit = isSingleProduct ? 500 : 1500;

    const [balance, setBalance] = useState(0);
    const [earningsBalance, setEarningsBalance] = useState(0);
    const [transactions, setTransactions] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawMethod, setWithdrawMethod] = useState("bank_transfer");
    const [withdrawDetails, setWithdrawDetails] = useState<Record<string, string>>({});
    const [paymentGateway, setPaymentGateway] = useState("bachs");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [balRes, transRes] = await Promise.all([
                fetchResellerBalance(),
                fetchResellerTransactions()
            ]);
            setBalance(balRes.data.balance || 0);
            setEarningsBalance(balRes.data.earnings_balance || 0);
            setTransactions(transRes.data.transactions || []);
        } catch (error) {
            toast.error(getApiError(error, "Failed to load wallet data"));
        } finally {
            setLoading(false);
        }
    };

    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount < minDeposit) {
            toast.error(`Minimum deposit for ${isSingleProduct ? 'Single Product' : 'API'} resellers is $${minDeposit.toLocaleString()}.00`);
            return;
        }

        setIsProcessing(true);
        try {
            const res = await createResellerDeposit({ amount, gateway: paymentGateway });
            if (res.data.payment_url || res.data.checkout_url) {
                window.location.href = res.data.payment_url || res.data.checkout_url;
            } else {
                toast.success("Deposit initiated! Please follow the instructions.");
            }
            setIsDepositModalOpen(false);
        } catch (error) {
            toast.error(getApiError(error, "Deposit failed"));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (amount > earningsBalance) {
            toast.error("Insufficient earnings balance");
            return;
        }

        setIsProcessing(true);
        try {
            let details: Record<string, string> = {};
            if (withdrawMethod === "crypto") {
                details = { crypto_currency: withdrawDetails.crypto_currency || "USDT", crypto_address: withdrawDetails.crypto_address, crypto_gateway: withdrawDetails.crypto_gateway || "plisio" };
            } else if (withdrawMethod === "manual") {
                details = { 
                    account_name: withdrawDetails.account_name, 
                    account_number: withdrawDetails.account_number, 
                    bank_name: withdrawDetails.bank_name,
                    country: withdrawDetails.country
                };
            }

            await requestResellerPayout({
                amount,
                payment_method: withdrawMethod,
                payment_details: details
            });
            toast.success("Withdrawal request submitted for approval!");
            setIsWithdrawModalOpen(false);
            setWithdrawAmount("");
            setWithdrawDetails({});
            fetchData();
        } catch (error) {
            toast.error(getApiError(error, "Withdrawal failed"));
        } finally {
            setIsProcessing(false);
        }
    };

    const field = (id: string, label: string, key: string, placeholder: string) => (
        <div className="ws-field">
            <label htmlFor={id}>{label}</label>
            <input id={id} className="ws-input" placeholder={placeholder} value={withdrawDetails[key] || ""} onChange={(e) => setWithdrawDetails({ ...withdrawDetails, [key]: e.target.value })} />
        </div>
    );

    const renderWithdrawFields = () => {
        if (withdrawMethod === "manual") {
            return (
                <>
                    {field("w-account-name", "Account name", "account_name", "Full name")}
                    {field("w-account-number", "Account number", "account_number", "Account number or IBAN")}
                    {field("w-bank-name", "Bank name", "bank_name", "e.g. Chase Bank")}
                    {field("w-country", "Country", "country", "e.g. USA")}
                    <p className="ws-callout">Manual payouts are reviewed by our team and processed in 1–3 days.</p>
                </>
            );
        }
        if (withdrawMethod === "crypto") {
            return (
                <>
                    <div className="ws-field">
                        <label htmlFor="w-gateway">Gateway</label>
                        <select id="w-gateway" className="ws-input" value={withdrawDetails.crypto_gateway || "plisio"} onChange={(e) => setWithdrawDetails({ ...withdrawDetails, crypto_gateway: e.target.value })}>
                            <option value="plisio">Plisio</option>
                            <option value="heleket">Heleket</option>
                        </select>
                    </div>
                    <div className="ws-field">
                        <label htmlFor="w-currency">Currency</label>
                        <select id="w-currency" className="ws-input" value={withdrawDetails.crypto_currency || "USDT"} onChange={(e) => setWithdrawDetails({ ...withdrawDetails, crypto_currency: e.target.value })}>
                            <option value="BTC">Bitcoin (BTC)</option>
                            <option value="USDC">USD Coin (USDC)</option>
                            <option value="ETH">Ethereum (ETH)</option>
                            <option value="USDT">Tether (USDT ERC20)</option>
                        </select>
                    </div>
                    {field("w-address", "Wallet address", "crypto_address", `Paste your ${withdrawDetails.crypto_currency || "USDT"} address`)}
                    <p className="ws-callout">Check the address carefully. Crypto transfers cannot be reversed.</p>
                </>
            );
        }
        return null;
    };

    const metrics = isEnterprise
        ? [
            { title: "Earnings balance", value: loading ? undefined : money(Number(earningsBalance)), note: "Available to withdraw" },
            { title: "Infrastructure fee", value: `$${user?.subscription_fee || "0.00"}/mo`, note: user?.subscription_expires_at ? `Next bill ${new Date(user.subscription_expires_at).toLocaleDateString()}` : "Monthly subscription" },
            { title: "Ledger entries", value: loading ? undefined : transactions.length, note: "Transactions on your account" },
        ]
        : [
            { title: "Available credits", value: loading ? undefined : money(Number(balance)), note: "Wallet balance in USD" },
            { title: "Minimum top-up", value: money(minDeposit), note: isSingleProduct ? "Single product tier" : "API tier" },
            { title: "Ledger entries", value: loading ? undefined : transactions.length, note: "Transactions on your account" },
        ];

    const depositInvalid = !depositAmount || parseFloat(depositAmount) < minDeposit;

    return (
        <div className="ws-stack">
            <PageHeader
                title={isEnterprise ? "Earnings" : "Wallet"}
                description={isEnterprise ? "Manage your partnership earnings and infrastructure fee." : "Manage your API credits and top-ups."}
                actions={<>
                    <button type="button" className="ws-icon-button" onClick={fetchData} disabled={loading} aria-label="Refresh wallet" title="Refresh wallet"><RefreshCw className={loading ? "animate-spin" : ""} /></button>
                    {isBalanceBased && <Button onClick={() => setIsDepositModalOpen(true)}><ArrowUpRight aria-hidden="true" /> Add credits</Button>}
                    {isEnterprise && <Button onClick={() => setIsWithdrawModalOpen(true)}><ArrowDownLeft aria-hidden="true" /> Request payout</Button>}
                </>}
            />

            <section className="overview-metrics" aria-label="Wallet summary" aria-busy={loading}>
                {metrics.map(metric => (
                    <div className="overview-metric" key={metric.title}>
                        <span>{metric.title}</span>
                        <strong>{metric.value === undefined ? <span className="overview-skeleton" /> : metric.value}</strong>
                        <small>{metric.note}</small>
                    </div>
                ))}
            </section>

            <section aria-labelledby="ledger-title">
                <div className="overview-section-heading"><div><h2 id="ledger-title">Transactions</h2><p>Every credit and debit recorded on your account.</p></div></div>
                <DataTable
                    columns={[
                        { key: "description", label: "Description", render: (r) => <strong>{String(r.description ?? "—")}</strong> },
                        {
                            key: "amount", label: "Amount", render: (r: Record<string, unknown>) => {
                                const val = Number(r.amount);
                                return <span className={val >= 0 ? "ws-good" : "ws-bad"}>{val >= 0 ? "+" : "−"}{money(Math.abs(val))}</span>;
                            }
                        },
                        { key: "created_at", label: "Date", render: (r: Record<string, unknown>) => <span className="ws-muted">{new Date(String(r.created_at)).toLocaleString()}</span> },
                    ]}
                    data={transactions}
                    loading={loading}
                    emptyMessage="No transactions yet."
                />
            </section>

            {isBalanceBased && (
                <WorkspaceDialog
                    open={isDepositModalOpen}
                    onClose={() => { if (!isProcessing) setIsDepositModalOpen(false); }}
                    title="Add credits"
                    description={`Top up your API balance. The minimum is ${money(minDeposit)}.`}
                    footer={<>
                        <Button variant="secondary" onClick={() => setIsDepositModalOpen(false)} disabled={isProcessing}>Cancel</Button>
                        <Button onClick={handleDeposit} loading={isProcessing} disabled={depositInvalid}>{isProcessing ? "Creating payment session…" : "Continue"}</Button>
                    </>}
                >
                    <div className="grid gap-5">
                        <div className="ws-field">
                            <label htmlFor="deposit-amount">Amount (USD)</label>
                            <input id="deposit-amount" type="number" inputMode="decimal" min={minDeposit} step="0.01" className="ws-input" placeholder={`${minDeposit}.00`} value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                            {depositAmount && depositInvalid && <p className="ws-field-error">Minimum deposit is {money(minDeposit)}.</p>}
                        </div>
                        <fieldset disabled={isProcessing} className="checkout-methods">
                            <legend className="ws-label">Payment method</legend>
                            {DEPOSIT_METHODS.map(item => (
                                <label className="checkout-method" data-selected={paymentGateway === item.value} key={item.value}>
                                    <input type="radio" name="reseller-deposit-method" value={item.value} checked={paymentGateway === item.value} onChange={() => setPaymentGateway(item.value)} />
                                    {item.image ? <img src={item.image} alt="" style={{ width: 35, height: 30, objectFit: "contain", background: "#fff", borderRadius: 3, padding: 3 }} /> : <CreditCard size={20} aria-hidden="true" />}
                                    <span><strong>{item.name}</strong><small>{item.description}</small></span>
                                </label>
                            ))}
                        </fieldset>
                        <p className="ws-callout">{paymentGateway === "bachs" ? "Choose card, bank transfer, mobile money or crypto on the Bachs payment page." : "Choose an available cryptocurrency and network on the provider’s payment page."}</p>
                    </div>
                </WorkspaceDialog>
            )}

            {isEnterprise && (
                <WorkspaceDialog
                    open={isWithdrawModalOpen}
                    onClose={() => { if (!isProcessing) setIsWithdrawModalOpen(false); }}
                    title="Request payout"
                    description="Withdraw your earnings to your preferred destination."
                    footer={<>
                        <Button variant="secondary" onClick={() => setIsWithdrawModalOpen(false)} disabled={isProcessing}>Cancel</Button>
                        <Button onClick={handleWithdraw} loading={isProcessing} disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}>{isProcessing ? "Processing…" : "Confirm payout"}</Button>
                    </>}
                >
                    <div className="grid gap-5">
                        <dl className="ws-rows">
                            <div><dt>Withdrawable</dt><dd>{money(Number(earningsBalance))}</dd></div>
                        </dl>
                        <div className="ws-field">
                            <label htmlFor="w-method">Destination</label>
                            <select id="w-method" className="ws-input" value={withdrawMethod} onChange={(e) => setWithdrawMethod(e.target.value)}>
                                <option value="bank_transfer" disabled>Select a destination</option>
                                <option value="manual">Bank transfer / other</option>
                                <option value="crypto">Cryptocurrency</option>
                            </select>
                        </div>
                        <div className="ws-field">
                            <label htmlFor="w-amount">Amount (USD)</label>
                            <input id="w-amount" type="number" inputMode="decimal" min="0" max={earningsBalance} step="0.01" className="ws-input" placeholder="0.00" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                        </div>
                        {renderWithdrawFields()}
                    </div>
                </WorkspaceDialog>
            )}
        </div>
    );
}
