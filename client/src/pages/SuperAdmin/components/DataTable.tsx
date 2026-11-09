import { useState, useMemo, useEffect, type ReactNode } from "react";
import { useDebounce } from "use-debounce";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

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
    emptyMessage?: ReactNode;
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

    const [debouncedSearch] = useDebounce(localSearch, 350);

    useEffect(() => {
        onSearch?.(debouncedSearch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    const search = onSearch && (
        <label className="ws-search">
            <span className="sr-only">{searchPlaceholder}</span>
            <Search aria-hidden="true" />
            <input type="search" placeholder={searchPlaceholder} value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} />
        </label>
    );
    const columnCount = columns.length + (actions ? 1 : 0);
    const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (page <= 3 ? i + 1 : page + i - 2)).filter(p => p >= 1 && p <= totalPages);

    return (
        <div className="ws-data-table">
            {(search || toolbar) && (
                <div className="ws-toolbar">
                    {search || <span />}
                    {toolbar && <div className="ws-toolbar-actions">{toolbar}</div>}
                </div>
            )}

            <div className="ws-table-panel">
                <div className="ws-table-scroll">
                    <table className="ws-table">
                        <thead>
                            <tr>
                                {columns.map((col) => (
                                    <th key={col.key} scope="col" className={col.className} aria-sort={col.sortable && sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                                        {col.sortable ? (
                                            <button type="button" onClick={() => handleSort(col.key)}>
                                                {col.label}
                                                {sortKey === col.key && (sortDir === "asc" ? <ChevronUp size={12} aria-hidden="true" /> : <ChevronDown size={12} aria-hidden="true" />)}
                                            </button>
                                        ) : col.label}
                                    </th>
                                ))}
                                {actions && <th scope="col" className="ws-actions">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={`loading-${i}`} aria-hidden="true">
                                        {Array.from({ length: columnCount }).map((__, c) => <td key={c}><span className="ws-skeleton" /></td>)}
                                    </tr>
                                ))
                            ) : sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={columnCount} className="ws-table-empty">{emptyMessage}</td>
                                </tr>
                            ) : (
                                sortedData.map((row, idx) => (
                                    <tr key={row.id ?? idx} onClick={onRowClick ? () => onRowClick(row) : undefined} data-clickable={Boolean(onRowClick)}>
                                        {columns.map((col) => (
                                            <td key={col.key} className={col.className}>
                                                {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                                            </td>
                                        ))}
                                        {actions && (
                                            <td className="ws-actions" onClick={(event) => event.stopPropagation()}>
                                                <div>{actions(row)}</div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {onPageChange && totalPages > 1 && (
                    <nav className="ws-pagination" aria-label="Pagination">
                        <span>{total != null ? `${total} total · ` : ""}Page {page} of {totalPages}</span>
                        <div>
                            <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page"><ChevronLeft aria-hidden="true" /></button>
                            {pages.map(p => (
                                <button type="button" key={p} onClick={() => onPageChange(p)} aria-current={p === page ? "page" : undefined}>{p}</button>
                            ))}
                            <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Next page"><ChevronRight aria-hidden="true" /></button>
                        </div>
                    </nav>
                )}
            </div>
        </div>
    );
}
