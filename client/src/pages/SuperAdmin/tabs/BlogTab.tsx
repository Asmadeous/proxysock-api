import { useState, useEffect, useCallback } from "react";
import { PencilIcon, TrashIcon, PlusIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import FormModal, { Field, inputClasses, selectClasses } from "../components/FormModal";
import { fetchAdminBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, publishBlogPost, unpublishBlogPost } from "../../../services/adminApi";
import { toast } from "react-hot-toast";
import { getApiError } from "../../../utils/apiError";

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

const EMPTY_FORM = { title: "", slug: "", excerpt: "", content: "", category: "Proxies", author: "Tech Team", read_time: "5 min", tags: "", featured: false };

export default function BlogTab() {
    const [posts, setPosts] = useState<BlogRow[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<BlogRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<BlogRow | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [actionLoading, setActionLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchAdminBlogPosts(search ? { q: search } : undefined);
            setPosts(res.data.posts || res.data || []);
            if (res.data.categories) setCategories(res.data.categories);
        } catch { toast.error("Failed to load blog posts"); }
        finally { setLoading(false); }
    }, [search]);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async () => {
        setActionLoading(true);
        try {
            const data = { ...form, tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) };
            await createBlogPost(data);
            toast.success("Post created");
            setShowCreate(false);
            setForm(EMPTY_FORM);
            load();
        } catch (err) { toast.error(getApiError(err, "Failed to create post")); }
        finally { setActionLoading(false); }
    };

    const handleUpdate = async () => {
        if (!editTarget) return;
        setActionLoading(true);
        try {
            const data = { ...form, tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) };
            await updateBlogPost(editTarget.slug, data);
            toast.success("Post updated");
            setEditTarget(null);
            load();
        } catch (err) { toast.error(getApiError(err, "Failed to update post")); }
        finally { setActionLoading(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setActionLoading(true);
        try { await deleteBlogPost(deleteTarget.slug); toast.success("Post deleted"); setDeleteTarget(null); load(); }
        catch (err) { toast.error(getApiError(err, "Failed to delete post")); }
        finally { setActionLoading(false); }
    };

    const handleTogglePublish = async (post: BlogRow) => {
        try {
            post.published ? await unpublishBlogPost(post.slug) : await publishBlogPost(post.slug);
            toast.success(post.published ? "Unpublished" : "Published");
            load();
        } catch (err) { toast.error(getApiError(err, "Failed to toggle publish")); }
    };

    const openEdit = (p: BlogRow) => {
        setEditTarget(p);
        setForm({ title: p.title, slug: p.slug, excerpt: "", content: "", category: p.category, author: p.author, read_time: p.read_time || "", tags: "", featured: p.featured });
    };

    const columns = [
        {
            key: "title", label: "Title", sortable: true,
            render: (row: BlogRow) => (
                <div>
                    <p className="text-sm font-medium text-foreground truncate max-w-xs">{row.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">{row.slug}</p>
                </div>
            ),
        },
        { key: "category", label: "Category" },
        { key: "author", label: "Author" },
        {
            key: "published", label: "Status",
            render: (row: BlogRow) => <StatusBadge status={row.published ? "published" : "draft"} />,
        },
        { key: "featured", label: "Featured", render: (row: BlogRow) => row.featured ? <span className="text-xs text-yellow-400">★ Featured</span> : <span className="text-xs text-muted-foreground">—</span> },
        { key: "created_at", label: "Created", render: (row: BlogRow) => <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span> },
    ];

    const formFields = (
        <>
            <Field label="Title"><input className={inputClasses} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Slug"><input className={inputClasses} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated-from-title" /></Field>
            <Field label="Category">
                <select className={selectClasses} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
            </Field>
            <Field label="Author"><input className={inputClasses} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></Field>
            <Field label="Excerpt"><textarea className={`${inputClasses} h-20 resize-none`} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></Field>
            <Field label="Content (HTML)"><textarea className={`${inputClasses} h-32 resize-y font-mono text-xs`} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></Field>
            <Field label="Read Time"><input className={inputClasses} value={form.read_time} onChange={(e) => setForm({ ...form, read_time: e.target.value })} placeholder="5 min" /></Field>
            <Field label="Tags (comma separated)"><input className={inputClasses} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></Field>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="rounded border-border bg-background text-red-500" />
                Featured post
            </label>
        </>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Blog Posts</h2>
                    <p className="text-sm text-muted-foreground mt-1">{posts.length} posts</p>
                </div>
                <button onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); }} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-foreground rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">
                    <PlusIcon className="h-4 w-4" /> New Post
                </button>
            </div>

            <DataTable
                columns={columns} data={posts} loading={loading}
                searchPlaceholder="Search blog posts..." onSearch={(q) => setSearch(q)}
                emptyMessage="No blog posts"
                actions={(row: BlogRow) => (
                    <>
                        <button onClick={() => handleTogglePublish(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" title={row.published ? "Unpublish" : "Publish"}>
                            {row.published ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" title="Edit"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10" title="Delete"><TrashIcon className="h-4 w-4" /></button>
                    </>
                )}
            />

            <FormModal open={showCreate} onClose={() => setShowCreate(false)} title="Create Blog Post" onSubmit={handleCreate} submitLabel="Create" loading={actionLoading} wide>{formFields}</FormModal>
            <FormModal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Blog Post" onSubmit={handleUpdate} submitLabel="Update" loading={actionLoading} wide>{formFields}</FormModal>
            <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Post" message={`Delete "${deleteTarget?.title}"?`} confirmLabel="Delete" loading={actionLoading} />
        </div>
    );
}
