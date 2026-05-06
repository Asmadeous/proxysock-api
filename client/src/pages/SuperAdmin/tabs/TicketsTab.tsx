import { useState, useEffect, useCallback } from "react";
import { ChatBubbleLeftRightIcon, XCircleIcon } from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import OnlineBadge from "../../../components/OnlineBadge";
import FormModal, { Field, inputClasses } from "../components/FormModal";
import { fetchAdminTickets, replyToTicket, updateTicketStatus } from "../../../services/adminApi";
import { toast } from "react-hot-toast";
import { getApiError } from "../../../utils/apiError";

interface TicketRow {
    id: number;
    subject: string;
    status: string;
    priority: string;
    user_email: string;
    user_online: boolean;
    user_type: string;
    assigned_to: string;
    created_at: string;
    updated_at: string;
    messages_count: number;
}

export default function TicketsTab() {
    const [tickets, setTickets] = useState<TicketRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [replyTarget, setReplyTarget] = useState<TicketRow | null>(null);
    const [replyMsg, setReplyMsg] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (statusFilter) params.status = statusFilter;
            const res = await fetchAdminTickets(params);
            setTickets(res.data.tickets || res.data || []);
        } catch (err) { toast.error(getApiError(err, "Failed to load tickets")); }
        finally { setLoading(false); }
    }, [statusFilter]);

    useEffect(() => { load(); }, [load]);

    const handleReply = async () => {
        if (!replyTarget || !replyMsg.trim()) return;
        setActionLoading(true);
        try {
            await replyToTicket(replyTarget.id, replyMsg);
            toast.success("Reply sent");
            setReplyTarget(null);
            setReplyMsg("");
            load();
        } catch (err) { toast.error(getApiError(err, "Failed to reply to ticket")); }
        finally { setActionLoading(false); }
    };

    const handleCloseTicket = async (ticket: TicketRow) => {
        if (!confirm(`Are you sure you want to close ticket: ${ticket.subject}?`)) return;
        try {
            await updateTicketStatus(ticket.id, "closed");
            toast.success("Ticket closed");
            load();
        } catch (err) { toast.error(getApiError(err, "Failed to close ticket")); }
    };

    const columns = [
        {
            key: "subject", label: "Subject", sortable: true,
            render: (row: TicketRow) => (
                <div className="max-w-xs">
                    <p className="text-sm font-medium text-foreground truncate">{row.subject}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <OnlineBadge online={row.user_online} />
                        <p className="text-xs text-muted-foreground truncate">{row.user_email} ({row.user_type})</p>
                    </div>
                </div>
            ),
        },
        { key: "status", label: "Status", sortable: true, render: (row: TicketRow) => <StatusBadge status={row.status || "open"} /> },
        { key: "priority", label: "Priority", render: (row: TicketRow) => <StatusBadge status={row.priority || "normal"} /> },
        { key: "assigned_to", label: "Assigned To", render: (row: TicketRow) => <span className="text-sm text-muted-foreground">{row.assigned_to || "Unassigned"}</span> },
        { key: "messages_count", label: "Messages", render: (row: TicketRow) => <span className="text-sm">{row.messages_count || 0}</span> },
        { key: "created_at", label: "Created", sortable: true, render: (row: TicketRow) => <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span> },
    ];

    const tabs = [
        { key: "", label: "All" },
        { key: "open", label: "Open" },
        { key: "in_progress", label: "In Progress" },
        { key: "resolved", label: "Resolved" },
        { key: "closed", label: "Closed" },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Tickets & Support</h2>

            <div className="flex flex-wrap gap-2">
                {tabs.map(({ key, label }) => (
                    <button key={label} onClick={() => setStatusFilter(key)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === key ? "bg-red-500 text-foreground" : "bg-card text-muted-foreground hover:text-foreground border border-border"}`}>
                        {label}
                    </button>
                ))}
            </div>

            <DataTable
                columns={columns} data={tickets} loading={loading}
                emptyMessage="No tickets"
                actions={(row: TicketRow) => (
                    <div className="flex gap-2">
                        <button onClick={() => { setReplyTarget(row); setReplyMsg(""); }} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                            <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" /> Reply
                        </button>
                        {row.status !== "closed" && row.status !== "resolved" && (
                            <button onClick={() => handleCloseTicket(row)} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                                <XCircleIcon className="h-3.5 w-3.5" /> Close
                            </button>
                        )}
                    </div>
                )}
            />

            <FormModal open={!!replyTarget} onClose={() => setReplyTarget(null)} title={`Reply to: ${replyTarget?.subject}`} onSubmit={handleReply} submitLabel="Send Reply" loading={actionLoading}>
                <div className="bg-background/50 p-3 rounded-lg text-xs text-muted-foreground space-y-1">
                    <p><span className="text-muted-foreground">From:</span> {replyTarget?.user_email}</p>
                    <p><span className="text-muted-foreground">Status:</span> {replyTarget?.status}</p>
                    <p><span className="text-muted-foreground">Priority:</span> {replyTarget?.priority}</p>
                </div>
                <Field label="Your Reply">
                    <textarea className={`${inputClasses} h-28 resize-y`} value={replyMsg} onChange={(e) => setReplyMsg(e.target.value)} placeholder="Type your response..." />
                </Field>
            </FormModal>
        </div>
    );
}
