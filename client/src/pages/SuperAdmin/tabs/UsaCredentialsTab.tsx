import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import {
    PlusIcon,
    TrashIcon,
    DevicePhoneMobileIcon,
    CloudArrowUpIcon,
    PhotoIcon,
    DocumentChartBarIcon,
    CheckCircleIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";

import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import FormModal from "../components/FormModal";
import {
    fetchAdminUsaCredentials,
    importUsaCredentials,
    deleteAdminUsaCredential
} from "../../../services/adminApi";

interface UsaCredentialRow {
    id: string;
    iccid: string;
    provider: string;
    status: string;
    has_qr_image: boolean;
    qr_image_url?: string;
    qr_activation_code?: string;
    created_at: string;
    assigned_at?: string;
    order_id?: string;
}

export default function UsaCredentialsTab() {
    const [credentials, setCredentials] = useState<UsaCredentialRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Import states
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchAdminUsaCredentials();
            setCredentials(res.data.credentials || []);
        } catch {
            toast.error("Failed to load credentials");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleImport = async () => {
        if (!excelFile) {
            toast.error("Please select an Excel file");
            return;
        }

        setActionLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", excelFile);
            formData.append("provider", "lyca");
            imageFiles.forEach((file) => {
                formData.append("images[]", file);
            });

            const res = await importUsaCredentials(formData);
            const { imported, updated, skipped, image_matched, errors } = res.data;

            toast.success(`Imported: ${imported}, Updated: ${updated}, Matched ${image_matched} images.`);
            
            if (errors && errors.length > 0) {
                console.error("Import errors:", errors);
                toast.error(`${skipped} rows skipped due to errors. Check console.`);
            }

            setImportModalOpen(false);
            setExcelFile(null);
            setImageFiles([]);
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to import credentials");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure? This will permanently remove the credential from inventory.")) return;
        try {
            await deleteAdminUsaCredential(id);
            toast.success("Credential deleted");
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to delete");
        }
    };

    const columns = [
        { key: "iccid", label: "ICCID", sortable: true, render: (row: UsaCredentialRow) => (
            <div className="flex flex-col">
                <span className="font-mono text-xs font-medium">{row.iccid}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{row.provider}</span>
            </div>
        )},
        { key: "qr_activation_code", label: "Activation Code", render: (row: UsaCredentialRow) => (
            <div className="max-w-[200px] truncate text-xs font-mono text-muted-foreground" title={row.qr_activation_code}>
                {row.qr_activation_code}
            </div>
        )},
        { key: "has_qr_image", label: "QR Image", render: (row: UsaCredentialRow) => (
            row.has_qr_image ? (
                <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    {row.qr_image_url && (
                        <a href={row.qr_image_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline">View</a>
                    )}
                </div>
            ) : (
                <XCircleIcon className="h-4 w-4 text-muted-foreground/30" />
            )
        )},
        { key: "status", label: "Status", sortable: true, render: (row: UsaCredentialRow) => (
            <StatusBadge status={row.status === "available" ? "active" : "inactive"} />
        )},
        { key: "created_at", label: "Added On", sortable: true, render: (row: UsaCredentialRow) => (
            <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span>
        )},
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <DevicePhoneMobileIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">USA eSIM Credentials</h1>
                        <p className="text-sm text-muted-foreground">Manage physical provisioning inventory for Lyca & Colt USA.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setImportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-all rounded-xl text-sm font-medium shadow-sm hover:shadow-md"
                >
                    <PlusIcon className="h-4 w-4" /> Bulk Import
                </button>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <DataTable
                    columns={columns}
                    data={credentials}
                    loading={loading}
                    emptyMessage="No USA eSIM credentials found. Click Bulk Import to upload your MVNO Excel file."
                    actions={(row: UsaCredentialRow) => (
                        <div className="flex items-center justify-end gap-2 pr-2">
                            {row.status === 'available' && (
                                <button onClick={() => handleDelete(row.id)} className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-muted rounded-lg transition-colors">
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}
                />
            </div>

            {/* ── IMPORT MODAL ────────────────────────────────────── */}
            <FormModal
                open={importModalOpen} onClose={() => { setImportModalOpen(false); setExcelFile(null); setImageFiles([]); }}
                title="Bulk Import Credentials (Lyca)"
                onSubmit={handleImport} submitLabel="Start Import"
                loading={actionLoading}
            >
                <div className="space-y-6 py-2">
                    {/* step 1: Excel */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <DocumentChartBarIcon className="h-4 w-4 text-blue-400" /> Step 1: Excel File (.xlsx)
                        </label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${excelFile ? 'border-green-500/50 bg-green-500/5' : 'border-border hover:border-blue-500/50'}`}
                        >
                            <CloudArrowUpIcon className={`h-8 w-8 ${excelFile ? 'text-green-500' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-medium">
                                {excelFile ? excelFile.name : "Select Lyca Excel File"}
                            </span>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={(e) => setExcelFile(e.target.files?.[0] || null)} />
                        </div>
                    </div>

                    {/* step 2: Images */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <PhotoIcon className="h-4 w-4 text-purple-400" /> Step 2: QR PNGs (Multiple)
                        </label>
                        <div 
                            onClick={() => imageInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${imageFiles.length > 0 ? 'border-green-500/50 bg-green-500/5' : 'border-border hover:border-purple-500/50'}`}
                        >
                            <PhotoIcon className={`h-8 w-8 ${imageFiles.length > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-medium">
                                {imageFiles.length > 0 ? `${imageFiles.length} Images Selected` : "Select PNG QR Code Folders/Files"}
                            </span>
                            <input type="file" ref={imageInputRef} className="hidden" multiple accept="image/png" onChange={(e) => setImageFiles(Array.from(e.target.files || []))} />
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">
                            System will match images to rows by looking for the ICCID in the filename.
                        </p>
                    </div>
                </div>
            </FormModal>
        </div>
    );
}
