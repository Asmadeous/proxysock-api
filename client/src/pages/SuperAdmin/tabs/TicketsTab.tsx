import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { ChatBubbleLeftRightIcon, XCircleIcon } from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import FormModal, { Field, inputClasses } from "../components/FormModal";
import { useAdminTickets, useReplyToTicket, useUpdateTicketStatus } from "../queries/tickets.queries";

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
    const updateStatusMutation = useUpdateTicketStatus();

    const handleReply = async () => {
        if (!replyTarget || !replyMsg.trim()) return;
        await replyToTicket.mutateAsync({ id: replyTarget.id, message: replyMsg });
        setReplyTarget(null);
        setReplyMsg("");
    };

    const handleCloseTicket = async (ticket: TicketRow) => {
        if (!confirm(`Are you sure you want to close ticket: ${ticket.subject}?`)) return;
        await updateStatusMutation.mutateAsync({ id: ticket.id, status: "closed" });
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
        <div className="ws-stack">
            <PageHeader title="Tickets" description={`${tickets.length} support tickets.`} />

            <div className="ws-tabs" role="group" aria-label="Ticket status">
                {STATUS_TABS.map(({ key, label }) => (
                    <button type="button" key={key} aria-pressed={statusFilter === key} onClick={() => setStatusFilter(key)}>{label}</button>
                ))}
            </div>

            <DataTable
                columns={columns}
                data={tickets}
                loading={isLoading}
                emptyMessage={<EmptyState icon={ChatBubbleLeftRightIcon} title="No tickets" description="Support tickets will appear here." />}
                actions={(row: TicketRow) => (
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setReplyTarget(row); setReplyMsg(""); }}
                            className="ws-button" data-variant="secondary" data-size="sm"
                        >
                            <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" /> Reply
                        </button>
                        {row.status !== "closed" && row.status !== "resolved" && (
                            <button onClick={() => handleCloseTicket(row)} className="ws-button" data-variant="danger" data-size="sm">
                                <XCircleIcon className="h-3.5 w-3.5" /> Close
                            </button>
                        )}
                    </div>
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
