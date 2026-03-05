import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { fetchResellerTickets, createResellerTicket, replyResellerTicket } from "../../../services/resellerApi";
import DataTable from "../../SuperAdmin/components/DataTable";
import StatusBadge from "../../SuperAdmin/components/StatusBadge";
import FormModal, { Field, inputClasses } from "../../SuperAdmin/components/FormModal";

export default function ResTickets() {
    const [tickets, setTickets] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ subject: "", message: "" });
    const [creating, setCreating] = useState(false);
    const [replyTarget, setReplyTarget] = useState<Record<string, unknown> | null>(null);
    const [replyMsg, setReplyMsg] = useState("");
    const [replyLoading, setReplyLoading] = useState(false);

    const loadTickets = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetchResellerTickets();
            setTickets(r.data.tickets || r.data || []);
        } catch {
            toast.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    const handleCreate = async () => {
        setCreating(true);
        try {
            await createResellerTicket(form);
            toast.success("Ticket created");
            setShowCreate(false);
            setForm({ subject: "", message: "" });
            loadTickets();
        } catch {
            toast.error("Failed to create ticket");
        } finally {
            setCreating(false);
        }
    };

    const handleReply = async () => {
        if (!replyTarget || !replyMsg.trim()) return;
        setReplyLoading(true);
        try {
            await replyResellerTicket(Number(replyTarget.id), replyMsg);
            toast.success("Reply sent");
            setReplyTarget(null);
            loadTickets();
        } catch {
            toast.error("Failed to send reply");
        } finally {
            setReplyLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Support Tickets</h2>
                <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">+ New Ticket</button>
            </div>
            <DataTable
                columns={[
                    { key: "subject", label: "Subject", sortable: true },
                    { key: "status", label: "Status", render: (r: Record<string, unknown>) => <StatusBadge status={String(r.status || "open")} /> },
                    { key: "created_at", label: "Created", render: (r: Record<string, unknown>) => <span className="text-xs text-muted-foreground">{new Date(String(r.created_at)).toLocaleDateString()}</span> },
                ]}
                data={tickets}
                loading={loading}
                actions={(row: Record<string, unknown>) => (
                    <button onClick={() => { setReplyTarget(row); setReplyMsg(""); }} className="px-2.5 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">Reply</button>
                )}
            />
            <FormModal open={showCreate} onClose={() => setShowCreate(false)} title="New Ticket" onSubmit={handleCreate} submitLabel="Submit" loading={creating}>
                <Field label="Subject"><input className={inputClasses} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
                <Field label="Message"><textarea className={`${inputClasses} h-24 resize-y`} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
            </FormModal>
            <FormModal open={!!replyTarget} onClose={() => setReplyTarget(null)} title={`Reply: ${String(replyTarget?.subject || "")}`} onSubmit={handleReply} submitLabel="Send" loading={replyLoading}>
                <Field label="Message"><textarea className={`${inputClasses} h-24 resize-y`} value={replyMsg} onChange={(e) => setReplyMsg(e.target.value)} /></Field>
            </FormModal>
        </div>
    );
}
