import { useState } from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import FormModal, { Field, inputClasses } from "../components/FormModal";
import { useAdminTickets, useReplyToTicket } from "../queries/tickets.queries";

interface TicketRow {
    id: number;
    subject: string;
    status: string;
    priority: string;
    user_email: string;
    user_type: string;
    assigned_to: string;
    created_at: string;
    updated_at: string;
    messages_count: number;
}

const STATUS_TABS = [
    { key: "", label: "All" },
    { key: "open", label: "Open" },
    { key: "pending", label: "Pending" },
    { key: "closed", label: "Closed" },
];

export default function TicketsTab() {
    const [statusFilter, setStatusFilter] = useState("");
    const [replyTarget, setReplyTarget] = useState<TicketRow | null>(null);
    const [replyMsg, setReplyMsg] = useState("");

    const { data, isLoading } = useAdminTickets({ statusFilter });
    const tickets: TicketRow[] = data?.tickets ?? data ?? [];

    const replyToTicket = useReplyToTicket();

    const handleReply = async () => {
        if (!replyTarget || !replyMsg.trim()) return;
        await replyToTicket.mutateAsync({ id: replyTarget.id, message: replyMsg });
        setReplyTarget(null);
        setReplyMsg("");
    };

    const columns = [
        {
            key: "subject", label: "Subject", sortable: true,
            render: (row: TicketRow) => <span className="text-sm font-medium text-foreground">{row.subject}</span>,
        },
        { key: "user_email", label: "User", render: (row: TicketRow) => <span className="text-xs text-muted-foreground">{row.user_email}</span> },
        { key: "user_type", label: "Type", render: (row: TicketRow) => <span className="text-xs capitalize text-muted-foreground">{row.user_type}</span> },
        { key: "priority", label: "Priority", render: (row: TicketRow) => <StatusBadge status={row.priority ?? "normal"} /> },
        { key: "status", label: "Status", sortable: true, render: (row: TicketRow) => <StatusBadge status={row.status} /> },
        { key: "assigned_to", label: "Assigned To", render: (row: TicketRow) => <span className="text-xs text-muted-foreground">{row.assigned_to ?? "Unassigned"}</span> },
        {
            key: "updated_at", label: "Updated", sortable: true,
            render: (row: TicketRow) => <span className="text-xs text-muted-foreground">{new Date(row.updated_at).toLocaleDateString()}</span>,
        },
    ];

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold text-foreground">Tickets</h2>
                <p className="text-sm text-muted-foreground mt-1">{tickets.length} tickets</p>
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-2">
                {STATUS_TABS.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <DataTable
                columns={columns}
                data={tickets}
                loading={isLoading}
                emptyMessage={<EmptyState icon={ChatBubbleLeftRightIcon} title="No tickets" description="Support tickets will appear here." />}
                actions={(row: TicketRow) => (
                    <button
                        onClick={() => { setReplyTarget(row); setReplyMsg(""); }}
                        className="px-2.5 py-1 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                    >
                        Reply
                    </button>
                )}
            />

            <FormModal
                open={!!replyTarget}
                onClose={() => setReplyTarget(null)}
                title={`Reply to: ${replyTarget?.subject}`}
                onSubmit={handleReply}
                submitLabel="Send Reply"
                loading={replyToTicket.isLoading}
            >
                <Field label="Message">
                    <textarea
                        className={inputClasses}
                        rows={5}
                        value={replyMsg}
                        onChange={(e) => setReplyMsg(e.target.value)}
                        placeholder="Write your reply..."
                    />
                </Field>
            </FormModal>
        </div>
    );
}
