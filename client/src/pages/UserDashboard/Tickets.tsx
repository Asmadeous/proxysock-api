import { useState, useEffect, useCallback } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useLocation } from "react-router-dom";
import { fetchTickets, createTicket, replyTicket } from "../../services/api";
import { fetchResellerTickets, createResellerTicket, replyResellerTicket } from "../../services/resellerApi";
import { getCableConsumer } from "../../services/cable";
import type { Subscription } from "@rails/actioncable";
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

interface TicketsProps {
    role?: "User" | "Reseller";
}

export default function Tickets({ role = "User" }: TicketsProps) {
    const [tickets, setTickets] = useState<TicketRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [activeTicket, setActiveTicket] = useState<TicketRow | null>(null);
    const [replyMsg, setReplyMsg] = useState("");
    const [replyLoading, setReplyLoading] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const location = useLocation();

    const [createData, setCreateData] = useState({ subject: "", priority: "normal", order_id: "", deposit_id: "", body: "" });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const fetchFn = role === "User" ? fetchTickets : fetchResellerTickets;
            const res = await fetchFn();
            setTickets(res.data.tickets || []);
        } catch {
            toast.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        let sub: Subscription | null = null;
        if (activeTicket) {
            const consumer = getCableConsumer();
            // We need to fetch messages for the ticket first or assume they are included in the ticket model
            // Actually Tickets.tsx doesn't show message history yet, only a reply modal.
            // Let's improve the Reply Modal to show history and update in real-time.
            sub = consumer.subscriptions.create(
                { channel: "TicketChannel", ticket_id: activeTicket.id },
                {
                    received: (data: any) => {
                        if (data.action === 'ticket_message_created') {
                            setMessages(prev => {
                                if (prev.find(m => m.id === data.message.id)) return prev;
                                return [...prev, data.message];
                            });
                        }
                    }
                }
            );
        }
        return () => { if (sub) sub.unsubscribe(); };
    }, [activeTicket]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const depId = params.get("deposit_id");
        const subject = params.get("subject");
        if (depId || subject) {
            setCreateData(prev => ({
                ...prev,
                deposit_id: depId || "",
                subject: subject || ""
            }));
            setShowCreate(true);
        }
    }, [location.search]);

    const handleCreate = async () => {
        setCreateLoading(true);
        try {
            // Need to pass body along with ticket data to create the initial message
            const payload = {
                subject: createData.subject,
                priority: createData.priority,
                order_id: createData.order_id || null,
                deposit_id: createData.deposit_id || null,
                body: createData.body,
            };
            const createFn = role === "User" ? createTicket : createResellerTicket;
            await createFn({ ...payload }); 
            toast.success("Ticket created");
            setShowCreate(false);
            setCreateData({ subject: "", priority: "normal", order_id: "", deposit_id: "", body: "" });
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
            const replyFn = role === "User" ? replyTicket : replyResellerTicket;
            await replyFn(activeTicket.id, replyMsg);
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
                {createData.deposit_id && (
                    <Field label="Deposit ID">
                        <input className={inputClasses} value={createData.deposit_id} readOnly disabled />
                    </Field>
                )}
                <Field label="Message *">
                    <textarea className={`${inputClasses} h-32 resize-y`} value={createData.body} onChange={(e) => setCreateData({ ...createData, body: e.target.value })} required placeholder="Describe your issue..." />
                </Field>
            </FormModal>

            {/* Reply Modal */}
            <FormModal open={!!activeTicket} onClose={() => { setActiveTicket(null); setMessages([]); }} title={`Ticket #${activeTicket?.id}: ${activeTicket?.subject}`} onSubmit={handleReply} submitLabel="Send Reply" loading={replyLoading}>
                <div className="max-h-60 overflow-y-auto space-y-3 mb-4 custom-scrollbar">
                    {messages.map((m: any) => (
                        <div key={m.id} className={`p-2 rounded-lg text-xs ${m.sender_type === 'Employee' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-muted border border-border'}`}>
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-primary">{m.sender_name}</span>
                                <span className="text-gray-500">{new Date(m.created_at).toLocaleTimeString()}</span>
                            </div>
                            <p className="whitespace-pre-wrap">{m.body}</p>
                        </div>
                    ))}
                </div>
                <Field label="Your Reply">
                    <textarea className={`${inputClasses} h-32 resize-y`} value={replyMsg} onChange={(e) => setReplyMsg(e.target.value)} required placeholder="Type your message here..." />
                </Field>
                <p className="text-xs text-gray-400 mt-2">Replies are added immediately to the ticket thread.</p>
            </FormModal>
        </div>
    );
}
