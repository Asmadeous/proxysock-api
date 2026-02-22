import { useState, useMemo, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
    MagnifyingGlassIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (row: T) => ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    searchPlaceholder?: string;
    onSearch?: (query: string) => void;
    page?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    total?: number;
    emptyMessage?: string;
    actions?: (row: T) => ReactNode;
    onRowClick?: (row: T) => void;
    toolbar?: ReactNode;
}

export default function DataTable<T extends { id?: number | string }>({
    columns,
    data,
    loading = false,
    searchPlaceholder = "Search...",
    onSearch,
    page = 1,
    totalPages = 1,
    onPageChange,
    total,
    emptyMessage = "No data found",
    actions,
    onRowClick,
    toolbar,
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [localSearch, setLocalSearch] = useState("");

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const sortedData = useMemo(() => {
        if (!sortKey) return data;
        return [...data].sort((a, b) => {
            const aVal = (a as Record<string, unknown>)[sortKey];
            const bVal = (b as Record<string, unknown>)[sortKey];
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [data, sortKey, sortDir]);

    const handleSearchChange = (value: string) => {
        setLocalSearch(value);
        onSearch?.(value);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                {onSearch && (
                    <div className="relative flex-1 w-full sm:max-w-sm">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={localSearch}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl
                text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm"
                        />
                    </div>
                )}
                {toolbar && <div className="flex gap-2 flex-wrap">{toolbar}</div>}
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={col.sortable ? () => handleSort(col.key) : undefined}
                                        className={`px-4 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider
                      ${col.sortable ? "cursor-pointer hover:text-foreground select-none" : ""}
                      ${col.className || ""}`}
                                    >
                                        <div className="flex items-center gap-1">
                                            {col.label}
                                            {col.sortable && sortKey === col.key && (
                                                sortDir === "asc"
                                                    ? <ChevronUpIcon className="h-3 w-3" />
                                                    : <ChevronDownIcon className="h-3 w-3" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                                {actions && (
                                    <th className="px-4 py-3.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-muted-foreground">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((row, idx) => (
                                    <motion.tr
                                        key={row.id ?? idx}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        onClick={() => onRowClick?.(row)}
                                        className={`hover:bg-muted/50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                                    >
                                        {columns.map((col) => (
                                            <td key={col.key} className={`px-4 py-3 text-sm text-foreground whitespace-nowrap ${col.className || ""}`}>
                                                {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                                            </td>
                                        ))}
                                        {actions && (
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {actions(row)}
                                                </div>
                                            </td>
                                        )}
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {onPageChange && totalPages > 1 && (
                <div className="flex items-center justify-between px-1">
                    <p className="text-sm text-muted-foreground">
                        {total != null ? `${total} total` : `Page ${page} of ${totalPages}`}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 1}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const p = page <= 3 ? i + 1 : page + i - 2;
                            if (p < 1 || p > totalPages) return null;
                            return (
                                <button
                                    key={p}
                                    onClick={() => onPageChange(p)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                    ${p === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
