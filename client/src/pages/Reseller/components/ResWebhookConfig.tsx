import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Globe, Pencil, Plus, Radio, Trash2, Webhook } from "lucide-react";
import { getApiError } from "../../SuperAdmin/utils/errors";
import ConfirmModal from "../../SuperAdmin/components/ConfirmModal";
import PageHeader from "../../SuperAdmin/components/PageHeader";
import Button from "../../SuperAdmin/components/Button";
import WorkspaceDialog from "../../SuperAdmin/components/WorkspaceDialog";
import ServiceCard, { ServiceGrid } from "../../SuperAdmin/components/ServiceCard";
import {
    fetchResellerWebhooks,
    createResellerWebhook,
    updateResellerWebhook,
    deleteResellerWebhook,
    verifyResellerWebhook
} from "../../../services/resellerApi";

interface WebhookEndpoint {
    id: string;
    url: string;
    secret: string;
    description: string;
    events: string[];
    created_at: string;
}

const AVAILABLE_EVENTS = [
    { id: "order.completed", label: "Order Completed", desc: "When an order is successfully provisioned" },
    { id: "order.cancelled", label: "Order Cancelled", desc: "When an order is cancelled and refunded" },
    { id: "order.failed", label: "Order Failed", desc: "When order provisioning fails" },
    { id: "credentials.ready", label: "Credentials Ready", desc: "When service credentials are available" },
];

export default function ResWebhookConfig() {
    const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<WebhookEndpoint | null>(null);
    const [formUrl, setFormUrl] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formEvents, setFormEvents] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const r = await fetchResellerWebhooks();
            setWebhooks(Array.isArray(r.data) ? r.data : []);
        } catch {
            toast.error("Failed to load webhooks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const openCreate = () => {
        setEditing(null);
        setFormUrl("");
        setFormDesc("");
        setFormEvents(["order.completed", "credentials.ready"]);
        setShowModal(true);
    };

    const openEdit = (wh: WebhookEndpoint) => {
        setEditing(wh);
        setFormUrl(wh.url);
        setFormDesc(wh.description || "");
        setFormEvents(wh.events || []);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formUrl.trim()) return toast.error("URL is required");
        setSaving(true);
        try {
            const data = { url: formUrl, description: formDesc, events: formEvents };
            if (editing) {
                await updateResellerWebhook(editing.id, data);
                toast.success("Webhook updated");
            } else {
                await createResellerWebhook(data);
                toast.success("Webhook created");
            }
            setShowModal(false);
            fetchAll();
        } catch (e) {
            toast.error(getApiError(e, "Failed to save webhook"));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        setIsDeleting(true);
        try {
            await deleteResellerWebhook(confirmDeleteId);
            toast.success("Webhook deleted");
            setConfirmDeleteId(null);
            fetchAll();
        } catch {
            toast.error("Failed to delete webhook");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleVerifyPulse = async (id: string) => {
        setVerifyingId(id);
        try {
            const r = await verifyResellerWebhook(id);
            if (r.data.success) {
                toast.success(`Pulse verified — HTTP ${r.data.status_code}`);
            } else {
                toast.error(r.data.message || "Verification failed");
            }
        } catch {
            toast.error("Verification request failed");
        } finally {
            setVerifyingId(null);
        }
    };

    const toggleEvent = (eventId: string) => {
        setFormEvents(prev =>
            prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
        );
    };

    return (
        <div className="ws-stack">
            <PageHeader
                title="Webhooks"
                description="Receive real-time notifications when order events occur."
                actions={<Button onClick={openCreate}><Plus aria-hidden="true" /> Add endpoint</Button>}
            />

            <p className="ws-callout">
                Every delivery includes an <code>X-ProxySock-Signature</code> header. Verify this HMAC-SHA256 signature with the endpoint’s secret to confirm the request came from us.
            </p>

            <ServiceGrid
                loading={loading}
                empty={webhooks.length === 0}
                emptyIcon={Webhook}
                emptyTitle="No webhooks configured"
                emptyText="Add an endpoint to get instant notifications about completed orders, cancellations and credentials."
                emptyAction={<Button onClick={openCreate}><Plus aria-hidden="true" /> Add endpoint</Button>}
            >
                {webhooks.map(wh => (
                    <ServiceCard
                        key={wh.id}
                        icon={Globe}
                        kind="Endpoint"
                        title={wh.description || "Webhook endpoint"}
                        subtitle={wh.url}
                        facts={[
                            { label: "Events", value: (wh.events || []).length ? wh.events.join(", ") : "None" },
                            { label: "Created", value: new Date(wh.created_at).toLocaleDateString() },
                            { label: "Signing secret", value: wh.secret, copy: wh.secret, secret: true },
                        ]}
                        actions={<>
                            <button type="button" onClick={() => handleVerifyPulse(wh.id)} disabled={verifyingId === wh.id}><Radio size={14} aria-hidden="true" /> {verifyingId === wh.id ? "Sending…" : "Send test"}</button>
                            <button type="button" onClick={() => openEdit(wh)}><Pencil size={14} aria-hidden="true" /> Edit</button>
                            <button type="button" onClick={() => setConfirmDeleteId(wh.id)}><Trash2 size={14} aria-hidden="true" /> Delete</button>
                        </>}
                    />
                ))}
            </ServiceGrid>

            <ConfirmModal
                open={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete webhook"
                message="Delete this webhook endpoint? It will stop receiving events. This cannot be undone."
                confirmLabel="Delete"
                loading={isDeleting}
                destructive
            />

            <WorkspaceDialog
                open={showModal}
                onClose={() => { if (!saving) setShowModal(false); }}
                title={editing ? "Edit webhook" : "New webhook endpoint"}
                footer={<>
                    <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} loading={saving}>{editing ? "Save changes" : "Create endpoint"}</Button>
                </>}
            >
                <form className="grid gap-5" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="ws-field">
                        <label htmlFor="wh-url">Endpoint URL</label>
                        <input id="wh-url" type="url" className="ws-input" value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://your-server.com/webhooks/proxysock" required />
                    </div>
                    <div className="ws-field">
                        <label htmlFor="wh-desc">Description</label>
                        <input id="wh-desc" className="ws-input" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Production order notifications" />
                        <p className="ws-field-hint">Optional.</p>
                    </div>
                    <fieldset className="grid gap-2">
                        <legend className="ws-label">Events</legend>
                        {AVAILABLE_EVENTS.map(ev => (
                            <label key={ev.id} className="ws-check">
                                <input type="checkbox" checked={formEvents.includes(ev.id)} onChange={() => toggleEvent(ev.id)} />
                                <span><span className="block">{ev.label}</span><small className="ws-muted">{ev.desc}</small></span>
                            </label>
                        ))}
                    </fieldset>
                </form>
            </WorkspaceDialog>
        </div>
    );
}
