import { useState } from "react";
import { PencilIcon, TrashIcon, PlusIcon, EyeIcon, EyeSlashIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { required, hasErrors, type ValidationErrors } from "../utils/validation";
import Button from "../components/Button";
import { useTabFilters } from "../hooks/useTabFilters";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import FormModal, { Field, inputClasses, selectClasses } from "../components/FormModal";
import EmptyState from "../components/EmptyState";
import {
    useAdminBlogPosts,
    useCreateBlogPost,
    useUpdateBlogPost,
    useDeleteBlogPost,
    usePublishBlogPost,
    useUnpublishBlogPost,
} from "../queries/blog.queries";

interface BlogRow {
    id: number;
    slug: string;
    title: string;
    category: string;
    author: string;
    published: boolean;
    featured: boolean;
    read_time: string;
    published_at: string;
    created_at: string;
}

const EMPTY_FORM = {
    title: "", slug: "", excerpt: "", content: "", category: "Proxies",
    author: "Tech Team", read_time: "5 min", tags: "", featured: false,
};

export default function BlogTab() {
    const { get, update } = useTabFilters();
    const search = get("search");
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<BlogRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<BlogRow | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState<ValidationErrors>({});

    const { data, isLoading } = useAdminBlogPosts({ search });
    const posts: BlogRow[] = data?.posts ?? data ?? [];

    const createPost = useCreateBlogPost();
    const updatePost = useUpdateBlogPost();
    const deletePost = useDeleteBlogPost();
    const publishPost = usePublishBlogPost();
    const unpublishPost = useUnpublishBlogPost();

    const validateForm = (): ValidationErrors => ({
        title: required(form.title, "Title"),
        slug: required(form.slug, "Slug"),
        content: required(form.content, "Content"),
    });

    const handleCreate = async () => {
        const errors = validateForm();
        if (hasErrors(errors)) { setFormErrors(errors); return; }
        const payload = { ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) };
        await createPost.mutateAsync(payload);
        setShowCreate(false);
        setForm(EMPTY_FORM);
        setFormErrors({});
    };

    const handleUpdate = async () => {
        if (!editTarget) return;
        const errors = validateForm();
        if (hasErrors(errors)) { setFormErrors(errors); return; }
        const payload = { ...form, tags: typeof form.tags === "string" ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : form.tags };
        await updatePost.mutateAsync({ slug: editTarget.slug, data: payload });
        setEditTarget(null);
        setFormErrors({});
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await deletePost.mutateAsync(deleteTarget.slug);
        setDeleteTarget(null);
    };

    const openEdit = (post: BlogRow) => {
        setEditTarget(post);
        setForm({ title: post.title, slug: post.slug, excerpt: "", content: "", category: post.category, author: post.author, read_time: post.read_time, tags: "", featured: post.featured });
    };

    const columns = [
        { key: "title", label: "Title", sortable: true, render: (row: BlogRow) => <span className="text-sm font-medium text-foreground">{row.title}</span> },
        { key: "category", label: "Category", sortable: true },
        { key: "author", label: "Author" },
        { key: "read_time", label: "Read Time" },
        { key: "published", label: "Status", render: (row: BlogRow) => <StatusBadge status={row.published ? "published" : "draft"} /> },
        {
            key: "created_at", label: "Created", sortable: true,
            render: (row: BlogRow) => <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span>,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Blog CMS</h2>
                    <p className="text-sm text-muted-foreground mt-1">{posts.length} posts</p>
                </div>
                <Button onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); }}>
                    <PlusIcon className="h-4 w-4" /> New Post
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={posts}
                loading={isLoading}
                searchPlaceholder="Search posts..."
                onSearch={(q) => update({ search: q })}
                emptyMessage={<EmptyState icon={DocumentTextIcon} title="No blog posts" description="Create your first post to get started." action={{ label: "New Post", onClick: () => setShowCreate(true) }} />}
                actions={(row: BlogRow) => (
                    <>
                        <button onClick={() => openEdit(row)} aria-label="Edit post" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                            <PencilIcon className="h-4 w-4" />
                        </button>
                        {row.published ? (
                            <button onClick={() => unpublishPost.mutate(row.slug)} aria-label="Unpublish post" className="p-1.5 rounded-lg text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10">
                                <EyeSlashIcon className="h-4 w-4" />
                            </button>
                        ) : (
                            <button onClick={() => publishPost.mutate(row.slug)} aria-label="Publish post" className="p-1.5 rounded-lg text-muted-foreground hover:text-green-400 hover:bg-green-500/10">
                                <EyeIcon className="h-4 w-4" />
                            </button>
                        )}
                        <button onClick={() => setDeleteTarget(row)} aria-label="Delete post" className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </>
                )}
            />

            {/* Create Modal */}
            <FormModal open={showCreate} onClose={() => { setShowCreate(false); setFormErrors({}); }} title="New Blog Post" onSubmit={handleCreate} submitLabel="Create" loading={createPost.isLoading} wide>
                <Field label="Title" error={formErrors.title}><input className={inputClasses} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                <Field label="Slug" error={formErrors.slug}><input className={inputClasses} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
                <Field label="Category">
                    <select className={selectClasses} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        {["Proxies", "VPN", "eSIM", "RDP", "VPS", "Security", "News"].map((c) => <option key={c}>{c}</option>)}
                    </select>
                </Field>
                <Field label="Author"><input className={inputClasses} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></Field>
                <Field label="Read Time"><input className={inputClasses} value={form.read_time} onChange={(e) => setForm({ ...form, read_time: e.target.value })} placeholder="e.g. 5 min" /></Field>
                <Field label="Excerpt"><textarea className={inputClasses} rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></Field>
                <Field label="Content (Markdown)" error={formErrors.content}><textarea className={inputClasses} rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></Field>
                <Field label="Tags (comma separated)"><input className={inputClasses} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="proxy, vpn, guide" /></Field>
            </FormModal>

            {/* Edit Modal */}
            <FormModal open={!!editTarget} onClose={() => { setEditTarget(null); setFormErrors({}); }} title="Edit Blog Post" onSubmit={handleUpdate} submitLabel="Update" loading={updatePost.isLoading} wide>
                <Field label="Title" error={formErrors.title}><input className={inputClasses} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                <Field label="Slug" error={formErrors.slug}><input className={inputClasses} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
                <Field label="Category">
                    <select className={selectClasses} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        {["Proxies", "VPN", "eSIM", "RDP", "VPS", "Security", "News"].map((c) => <option key={c}>{c}</option>)}
                    </select>
                </Field>
                <Field label="Author"><input className={inputClasses} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></Field>
                <Field label="Read Time"><input className={inputClasses} value={form.read_time} onChange={(e) => setForm({ ...form, read_time: e.target.value })} /></Field>
                <Field label="Excerpt"><textarea className={inputClasses} rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></Field>
                <Field label="Content (Markdown)" error={formErrors.content}><textarea className={inputClasses} rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></Field>
                <Field label="Tags (comma separated)"><input className={inputClasses} value={form.tags as string} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></Field>
            </FormModal>

            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Post"
                message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
                confirmLabel="Delete"
                loading={deletePost.isLoading}
            />
        </div>
    );
}
