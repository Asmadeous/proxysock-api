import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getApiError } from "../../SuperAdmin/utils/errors";
import ConfirmModal from "../../SuperAdmin/components/ConfirmModal";
import {
    fetchResellerWebhooks,
    createResellerWebhook,
    updateResellerWebhook,
    deleteResellerWebhook,
    verifyResellerWebhook
} from "../../../services/resellerApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
    PlusIcon,
    TrashIcon,
    PencilIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    GlobeAltIcon,
    ShieldCheckIcon
} from "@heroicons/react/24/outline";
import { Loader2, Webhook } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    const [showSecret, setShowSecret] = useState<string | null>(null);
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
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Webhook Configuration</h1>
                    <p className="text-muted-foreground mt-1">Receive real-time notifications when order events occur.</p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <PlusIcon className="w-4 h-4" /> Add Endpoint
                </Button>
            </div>

            {/* Info Card */}
            <Card className="bg-blue-500/5 border-blue-500/10">
                <CardContent className="p-6">
                    <div className="flex gap-4 items-start">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                            <ShieldCheckIcon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-sm">Webhook Security</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Every webhook delivery includes an <code className="bg-muted px-1 rounded">X-ProxySock-Signature</code> header.
                                Verify this HMAC-SHA256 signature using your endpoint's secret to ensure authenticity.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Endpoints List */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : webhooks.length === 0 ? (
                <Card className="border-dashed border-2">
                    <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                        <Webhook className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="font-bold text-lg mb-2">No Webhooks Configured</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-md">
                            Set up webhook endpoints to receive instant notifications about order completions, cancellations, and credential availability.
                        </p>
                        <Button onClick={openCreate} className="gap-2">
                            <PlusIcon className="w-4 h-4" /> Create First Endpoint
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {webhooks.map(wh => (
                        <Card key={wh.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4 items-start flex-1 min-w-0">
                                        <div className="p-3 bg-primary/10 rounded-xl">
                                            <GlobeAltIcon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <code className="text-sm font-bold truncate block">{wh.url}</code>
                                            </div>
                                            {wh.description && (
                                                <p className="text-xs text-muted-foreground mb-2">{wh.description}</p>
                                            )}
                                            <div className="flex gap-2 flex-wrap mt-2">
                                                {(wh.events || []).map(ev => (
                                                    <Badge key={ev} variant="secondary" className="text-[10px]">{ev}</Badge>
                                                ))}
                                            </div>
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Secret:</span>
                                                <code className="text-[10px] font-mono text-muted-foreground">
                                                    {showSecret === wh.id ? wh.secret : "••••••••••••••••••••"}
                                                </code>
                                                <button
                                                    onClick={() => setShowSecret(showSecret === wh.id ? null : wh.id)}
                                                    aria-label={showSecret === wh.id ? "Hide webhook secret" : "Show webhook secret"}
                                                    className="text-[10px] text-primary font-bold hover:underline"
                                                >
                                                    {showSecret === wh.id ? "Hide" : "Show"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            size="sm" variant="outline"
                                            onClick={() => handleVerifyPulse(wh.id)}
                                            disabled={verifyingId === wh.id}
                                            className="gap-1 h-8"
                                        >
                                            {verifyingId === wh.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowPathIcon className="w-3 h-3" />}
                                            Verify Pulse
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => openEdit(wh)} className="gap-1 h-8">
                                            <PencilIcon className="w-3 h-3" /> Edit
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => setConfirmDeleteId(wh.id)} className="gap-1 h-8">
                                            <TrashIcon className="w-3 h-3" /> Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <ConfirmModal
                open={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Webhook"
                message="Are you sure you want to delete this webhook endpoint? This action cannot be undone."
                confirmLabel="Delete"
                loading={isDeleting}
                destructive
            />

            {/* Create/Edit Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit Webhook" : "New Webhook Endpoint"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Endpoint URL</label>
                            <Input
                                value={formUrl}
                                onChange={e => setFormUrl(e.target.value)}
                                placeholder="https://your-server.com/webhooks/proxysock"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Description (optional)</label>
                            <Input
                                value={formDesc}
                                onChange={e => setFormDesc(e.target.value)}
                                placeholder="Production webhook for order processing"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Events to Subscribe</label>
                            <div className="space-y-2">
                                {AVAILABLE_EVENTS.map(ev => (
                                    <label
                                        key={ev.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formEvents.includes(ev.id) ? "bg-primary/5 border-primary/20" : "border-border hover:bg-muted/50"
                                            }`}
                                        onClick={() => toggleEvent(ev.id)}
                                    >
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${formEvents.includes(ev.id) ? "bg-primary border-primary" : "border-muted-foreground/30"
                                            }`}>
                                            {formEvents.includes(ev.id) && <CheckCircleIcon className="w-3 h-3 text-white" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{ev.label}</p>
                                            <p className="text-[10px] text-muted-foreground">{ev.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {editing ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
