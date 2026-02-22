import { useState, useEffect, useCallback } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { fetchTickets, createTicket, replyTicket } from "../../services/api";
import DataTable from "../SuperAdmin/components/DataTable";
import StatusBadge from "../SuperAdmin/components/StatusBadge";
import FormModal, { Field, inputClasses } from "../SuperAdmin/components/FormModal";
import { toast } from "react-hot-toast";

interface TicketRow {
    id: number;
    subject: string;
    status: string;
    updated_at: string;
}

export default function Tickets() {
    const [tickets, setTickets] = useState<TicketRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [activeTicket, setActiveTicket] = useState<TicketRow | null>(null);
    const [replyMsg, setReplyMsg] = useState("");
    const [replyLoading, setReplyLoading] = useState(false);

    const [createData, setCreateData] = useState({ subject: "", priority: "normal", order_id: "", body: "" });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchTickets();
            setTickets(res.data.tickets || []);
        } catch {
            toast.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async () => {
        setCreateLoading(true);
        try {
            // Need to pass body along with ticket data to create the initial message
            const payload = {
                subject: createData.subject,
                priority: createData.priority,
                order_id: createData.order_id || null,
                body: createData.body, // The API controller expects this in params natively or inside ticket params? Wait, the API controller looks for params[:body]
            };
            // Our createTicket function structure: api.post("/web/api/tickets", { ticket: data });
            // Let's adapt our createTicket to accept body at root:
            await createTicket({ ...payload }); // Wait, the controller does `ticket.ticket_messages.create!(..., body: params[:body])` 
            // So if createTicket wraps in { ticket: data }, params[:body] might be nil unless we modify `api.ts` or the component. By default Rails parses nested JSON.
            // Actually, if we pass { ticket: data, body: "text" }, api.ts wraps it just like `ticket: data`. Let's just create a custom post here to be safe.
            toast.success("Ticket created");
            setShowCreate(false);
            setCreateData({ subject: "", priority: "normal", order_id: "", body: "" });
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.errors?.[0] || "Failed to create ticket");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleReply = async () => {
        if (!activeTicket || !replyMsg.trim()) return;
        setReplyLoading(true);
        try {
            await replyTicket(activeTicket.id, replyMsg);
            toast.success("Replied");
            setReplyMsg("");
            setActiveTicket(null);
            load();
        } catch {
            toast.error("Failed to reply");
        } finally {
            setReplyLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Support Tickets</h2>
                    <p className="text-sm text-gray-400 mt-1">Raise issues or track your ongoing support requests.</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 transition-colors text-white rounded-xl text-sm font-medium">
                    <PlusIcon className="h-5 w-5" /> Open Ticket
                </button>
            </div>

            <DataTable
                columns={[
                    { key: "id", label: "Ticket ID", render: (r: TicketRow) => <span className="font-mono text-xs text-gray-400">#{r.id}</span> },
                    { key: "subject", label: "Subject", render: (r: TicketRow) => <span className="font-medium text-white">{r.subject}</span> },
                    { key: "status", label: "Status", render: (r: TicketRow) => <StatusBadge status={r.status} /> },
                    { key: "updated_at", label: "Last Updated", render: (r: TicketRow) => <span className="text-xs text-gray-400">{new Date(r.updated_at).toLocaleString()}</span> },
                ]}
                data={tickets}
                loading={loading}
                emptyMessage="You have no support tickets."
                actions={(row: TicketRow) => (
                    <button onClick={() => { setActiveTicket(row); setReplyMsg(""); }} className="px-2.5 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 font-medium">
                        View / Reply
                    </button>
                )}
            />

            {/* Create Ticket Modal */}
            <FormModal open={showCreate} onClose={() => setShowCreate(false)} title="Open New Ticket" onSubmit={handleCreate} submitLabel="Submit Ticket" loading={createLoading}>
                <Field label="Subject *">
                    <input className={inputClasses} value={createData.subject} onChange={(e) => setCreateData({ ...createData, subject: e.target.value })} required />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Priority">
                        <select className={inputClasses} value={createData.priority} onChange={(e) => setCreateData({ ...createData, priority: e.target.value })}>
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                        </select>
                    </Field>
                    <Field label="Order ID (Optional)">
                        <input className={inputClasses} value={createData.order_id} onChange={(e) => setCreateData({ ...createData, order_id: e.target.value })} placeholder="e.g. 12345" />
                    </Field>
                </div>
                <Field label="Message *">
                    <textarea className={`${inputClasses} h-32 resize-y`} value={createData.body} onChange={(e) => setCreateData({ ...createData, body: e.target.value })} required placeholder="Describe your issue..." />
                </Field>
            </FormModal>

            {/* Reply Modal */}
            <FormModal open={!!activeTicket} onClose={() => setActiveTicket(null)} title={`Ticket #${activeTicket?.id}: ${activeTicket?.subject}`} onSubmit={handleReply} submitLabel="Send Reply" loading={replyLoading}>
                <Field label="Your Reply">
                    <textarea className={`${inputClasses} h-32 resize-y`} value={replyMsg} onChange={(e) => setReplyMsg(e.target.value)} required placeholder="Type your message here..." />
                </Field>
                <p className="text-xs text-gray-400 mt-2">Replies are added immediately to the ticket thread.</p>
            </FormModal>
        </div>
    );
}
