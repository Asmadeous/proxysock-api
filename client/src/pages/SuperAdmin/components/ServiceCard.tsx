import { useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { ClipboardDocumentIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Service cards for the staff and reseller service pages. They reuse the
// customer dashboard's proxy-service markup (proxy-management.css).

export interface ServiceFact {
    label: string;
    value: ReactNode;
    copy?: string;
    secret?: boolean;
}

interface ServiceCardProps {
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    kind: string;
    status?: string;
    title: ReactNode;
    subtitle?: ReactNode;
    facts: ServiceFact[];
    note?: ReactNode;
    actions?: ReactNode;
    children?: ReactNode;
}

const GOOD = ["active", "running", "completed", "delivered", "enabled"];

export function serviceStatusAttr(status: string) {
    const value = (status || "").toLowerCase();
    if (GOOD.includes(value)) return "active";
    if (["failed", "error", "cancelled", "terminated", "expired"].includes(value)) return "failed";
    return value;
}

async function copyText(value: string) {
    try { await navigator.clipboard.writeText(value); toast.success("Copied to clipboard"); }
    catch { toast.error("Couldn't copy. Select the text and copy it manually."); }
}

function FactValue({ fact }: { fact: ServiceFact }) {
    const [shown, setShown] = useState(false);
    const value = fact.secret && !shown ? "••••••••" : fact.value;
    return (
        <dd className="flex min-w-0 items-center gap-1.5">
            <span className="min-w-0 truncate">{value}</span>
            {fact.secret && (
                <button type="button" className="shrink-0 text-[var(--ov-accent)]" aria-label={shown ? `Hide ${fact.label.toLowerCase()}` : `Show ${fact.label.toLowerCase()}`} onClick={() => setShown(v => !v)}>
                    {shown ? <EyeSlashIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
                </button>
            )}
            {fact.copy && (
                <button type="button" className="shrink-0 text-[var(--ov-accent)]" aria-label={`Copy ${fact.label.toLowerCase()}`} onClick={() => copyText(fact.copy!)}>
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                </button>
            )}
        </dd>
    );
}

export default function ServiceCard({ icon: Icon, kind, status, title, subtitle, facts, note, actions, children }: ServiceCardProps) {
    return (
        <article className="proxy-service">
            <div className="proxy-service-top">
                <span><Icon width={16} height={16} aria-hidden="true" />{kind}</span>
                {status !== undefined && <span className="overview-status" data-status={serviceStatusAttr(status)}>{(status || "unknown").replace(/_/g, " ")}</span>}
            </div>
            <h2 className="truncate">{title}</h2>
            <p className="proxy-order">{subtitle}</p>
            <dl className="proxy-facts">
                {facts.map(fact => (
                    <div key={fact.label} className="min-w-0"><dt>{fact.label}</dt><FactValue fact={fact} /></div>
                ))}
            </dl>
            {note && <p className="proxy-usage">{note}</p>}
            {children}
            {actions && <div className="proxy-card-actions">{actions}</div>}
        </article>
    );
}

interface ServiceGridProps {
    loading: boolean;
    empty: boolean;
    emptyIcon: ComponentType<SVGProps<SVGSVGElement>>;
    emptyTitle?: string;
    emptyText?: string;
    emptyAction?: ReactNode;
    children: ReactNode;
}

export function ServiceGrid({ loading, empty, emptyIcon: EmptyIcon, emptyTitle = "No services found", emptyText = "Try a different search or clear the filters.", emptyAction, children }: ServiceGridProps) {
    if (loading) {
        return (
            <div className="proxy-grid" role="status" aria-label="Loading services">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="proxy-service">
                        <span className="overview-skeleton" />
                        <span className="overview-skeleton" style={{ marginTop: 18, maxWidth: "70%" }} />
                        <span className="overview-skeleton" style={{ marginTop: 18 }} />
                        <span className="overview-skeleton" style={{ marginTop: 10, maxWidth: "50%" }} />
                    </div>
                ))}
            </div>
        );
    }
    if (empty) {
        return (
            <div className="proxy-empty">
                <EmptyIcon width={25} height={25} aria-hidden="true" />
                <h2>{emptyTitle}</h2>
                <p>{emptyText}</p>
                {emptyAction}
            </div>
        );
    }
    return <div className="proxy-grid">{children}</div>;
}

export function ServiceSearch({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
    return (
        <label className="ws-search">
            <span className="sr-only">{placeholder}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            <input type="search" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
        </label>
    );
}
