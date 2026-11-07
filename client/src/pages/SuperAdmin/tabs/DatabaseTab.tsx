import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { PlayIcon, TableCellsIcon, CircleStackIcon, ExclamationTriangleIcon, ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { fetchDatabaseTables, executeDatabaseQuery } from "../../../services/adminApi";
import { getApiError } from "../utils/errors";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";

interface DBTable {
    name: string;
    columns: { name: string; type: string }[];
}

export default function DatabaseTab() {
    const [tables, setTables] = useState<DBTable[]>([]);
    const [selectedTable, setSelectedTable] = useState<DBTable | null>(null);
    const [activeView, setActiveView] = useState<"data" | "schema" | "sql">("data");
    
    // SQL Editor
    const [customQuery, setCustomQuery] = useState("");
    
    // Data Browser
    const [dataPage, setDataPage] = useState(1);
    const DATA_PER_PAGE = 50;
    const [totalRows, setTotalRows] = useState(0);

    // Shared Result state
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<{ columns: string[], rows: unknown[][] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [executionTime, setExecutionTime] = useState(0);

    useEffect(() => {
        fetchDatabaseTables()
            .then(res => setTables(res.data.tables))
            .catch(() => toast.error("Failed to load database schema"));
    }, []);

    const fetchTotalRows = async (tableName: string) => {
        try {
            const res = await executeDatabaseQuery(`SELECT COUNT(*) as count FROM ${tableName};`);
            if (res.data.rows?.[0]?.[0]) {
                setTotalRows(parseInt(res.data.rows[0][0] as string, 10));
            }
        } catch { setTotalRows(0); }
    };

    const handleFetchTableData = useCallback(async (table: DBTable, pageNum: number) => {
        setLoading(true);
        setError(null);
        setResults(null);
        const startTime = performance.now();
        const offset = (pageNum - 1) * DATA_PER_PAGE;
        try {
            const res = await executeDatabaseQuery(`SELECT * FROM ${table.name} LIMIT ${DATA_PER_PAGE} OFFSET ${offset};`);
            setResults({ columns: res.data.columns, rows: res.data.rows });
        } catch (err) {
            setError(getApiError(err, "Query failed"));
        } finally {
            setExecutionTime(performance.now() - startTime);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedTable && activeView === "data") {
            handleFetchTableData(selectedTable, dataPage);
        }
    }, [selectedTable, activeView, dataPage, handleFetchTableData]);

    const handleRunCustomQuery = async () => {
        if (!customQuery.trim()) return toast.error("Query cannot be empty");
        setLoading(true);
        setError(null);
        setResults(null);
        const startTime = performance.now();
        try {
            const res = await executeDatabaseQuery(customQuery);
            setResults({ columns: res.data.columns, rows: res.data.rows });
        } catch (err) {
            setError(getApiError(err, "Query failed"));
        } finally {
            setExecutionTime(performance.now() - startTime);
            setLoading(false);
        }
    };

    const handleTableClick = (table: DBTable) => {
        if (selectedTable?.name !== table.name) {
            setSelectedTable(table);
            setDataPage(1);
            fetchTotalRows(table.name);
            setResults(null);
            setError(null);
            
            // Switch to Data tab if coming from none
            if (!selectedTable) setActiveView("data");
        } else {
            setSelectedTable(null); // toggle off
        }
    };

    const renderResultsTable = () => {
        if (error) return <pre className="ws-code ws-bad">ERROR: {error}</pre>;
        if (loading && !results) return (
            <div className="space-y-3 p-4" role="status" aria-label="Loading results">
                {Array.from({ length: 5 }).map((_, i) => <span key={i} className="ws-skeleton block" style={{ height: 12, maxWidth: `${95 - i * 10}%` }} />)}
            </div>
        );
        if (!results) return (
            <div className="ws-empty">
                <span className="ws-empty-mark"><TableCellsIcon aria-hidden="true" /></span>
                <h3>No data to display</h3>
                <p>Run a query or pick a table.</p>
            </div>
        );

        return (
            <div className="ws-table-panel flex min-h-0 flex-1 flex-col">
                <div className="flex shrink-0 items-center justify-between border-b border-[var(--ov-line)] px-4 py-2 text-[11px]">
                    <span>{results.rows.length} rows retrieved</span>
                    <span className="ws-muted tabular-nums">{executionTime.toFixed(1)} ms</span>
                </div>
                <div className="min-h-0 flex-1 overflow-auto">
                    {results.rows.length > 0 ? (
                        <table className="ws-table whitespace-nowrap">
                            <thead className="sticky top-0 z-10 bg-[var(--ov-panel)]">
                                <tr>
                                    <th className="w-12 text-center">#</th>
                                    {results.columns.map((col, i) => <th key={i} className="min-w-[120px] max-w-[400px]"><div className="truncate">{col}</div></th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {results.rows.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        <td className="select-none text-center ws-muted">{activeView === "data" ? ((dataPage - 1) * DATA_PER_PAGE + rowIndex + 1) : (rowIndex + 1)}</td>
                                        {row.map((val, colIndex) => (
                                            <td key={colIndex} className="max-w-[400px]">
                                                <div className="ws-mono truncate">
                                                    {val === null ? <span className="text-[10px] uppercase italic ws-muted">null</span>
                                                        : typeof val === "boolean" ? <span className={val ? "ws-good" : "ws-bad"}>{String(val)}</span>
                                                        : String(val)}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="p-8 text-center text-xs ws-muted">Query completed. The result is empty.</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="ws-stack flex h-[calc(100vh-8rem)] flex-col">
            <PageHeader title="Database" description="Browse tables, inspect schemas and run SQL queries." />

            <div className="flex min-h-0 flex-1 gap-6">
                <nav className="ws-panel flex w-64 shrink-0 flex-col !p-0" aria-label="Tables">
                    <h2 className="ws-section-title border-b border-[var(--ov-line)] px-4 py-3">Tables ({tables.length})</h2>
                    <ul className="min-h-0 flex-1 overflow-y-auto p-2">
                        {tables.map(table => (
                            <li key={table.name}>
                                <button
                                    type="button"
                                    aria-current={selectedTable?.name === table.name ? "true" : undefined}
                                    onClick={() => handleTableClick(table)}
                                    className={`w-full truncate rounded px-3 py-2 text-left font-mono text-[11px] ${selectedTable?.name === table.name ? "bg-[var(--ov-wash)] text-[var(--ov-accent)] shadow-[inset_2px_0_0_var(--ov-accent)]" : "ws-muted hover:bg-[var(--ov-wash)] hover:text-[var(--ov-text)]"}`}
                                >
                                    {table.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <section className="ws-panel flex min-w-0 flex-1 flex-col" aria-label="Table workspace">
                    <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
                        <div className="ws-tabs" role="group" aria-label="Database view" style={{ marginBottom: 0 }}>
                            <button type="button" aria-pressed={activeView === "data"} disabled={!selectedTable} onClick={() => setActiveView("data")}>Data</button>
                            <button type="button" aria-pressed={activeView === "schema"} disabled={!selectedTable} onClick={() => setActiveView("schema")}>Schema</button>
                            <button type="button" aria-pressed={activeView === "sql"} onClick={() => setActiveView("sql")}>Query tool</button>
                        </div>
                        {selectedTable && activeView !== "sql" && <span className="ws-mono pb-2 text-[11px] ws-muted">{selectedTable.name}</span>}
                    </div>

                    <div className="mt-4 flex min-h-0 flex-1 flex-col">
                        {activeView === "data" && selectedTable && (
                            <>
                                <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
                                    <button type="button" onClick={() => handleFetchTableData(selectedTable, dataPage)} aria-label="Refresh table data" className="ws-icon-button"><ArrowPathIcon className={loading ? "animate-spin" : ""} /></button>
                                    <div className="ws-pagination !border-0 !p-0">
                                        <span>Showing {Math.min((dataPage - 1) * DATA_PER_PAGE + 1, totalRows)}–{Math.min(dataPage * DATA_PER_PAGE, totalRows)} of {totalRows} rows</span>
                                        <div>
                                            <button type="button" disabled={dataPage === 1 || loading} onClick={() => setDataPage(p => p - 1)} aria-label="Previous page"><ChevronLeftIcon /></button>
                                            <button type="button" aria-current="page">{dataPage}</button>
                                            <button type="button" disabled={dataPage * DATA_PER_PAGE >= totalRows || loading} onClick={() => setDataPage(p => p + 1)} aria-label="Next page"><ChevronRightIcon /></button>
                                        </div>
                                    </div>
                                </div>
                                {renderResultsTable()}
                            </>
                        )}

                        {activeView === "schema" && selectedTable && (
                            <div className="ws-table-panel overflow-auto">
                                <table className="ws-table">
                                    <thead><tr><th>Column</th><th>Data type</th></tr></thead>
                                    <tbody>
                                        {selectedTable.columns.map(col => (
                                            <tr key={col.name}><td className="ws-mono">{col.name}</td><td className="ws-mono uppercase ws-muted">{col.type}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeView === "sql" && (
                            <div className="flex h-full min-h-0 flex-col gap-4">
                                <div className="ws-callout flex items-center gap-2"><ExclamationTriangleIcon className="h-4 w-4 shrink-0 ws-wait" aria-hidden="true" />Write access is enabled. Queries run directly against the database.</div>
                                <div className="ws-field shrink-0">
                                    <label htmlFor="sql-editor">PostgreSQL query</label>
                                    <textarea
                                        id="sql-editor"
                                        value={customQuery}
                                        onChange={(e) => setCustomQuery(e.target.value)}
                                        placeholder="SELECT * FROM users LIMIT 10;"
                                        className="ws-input h-40 resize-y font-mono leading-relaxed"
                                        spellCheck={false}
                                    />
                                </div>
                                <div className="flex shrink-0 justify-end">
                                    <Button onClick={handleRunCustomQuery} disabled={loading || !customQuery.trim()} loading={loading}><PlayIcon />{loading ? "Executing…" : "Run query"}</Button>
                                </div>
                                <h3 className="ws-section-title shrink-0">Results</h3>
                                {renderResultsTable()}
                            </div>
                        )}

                        {!selectedTable && activeView !== "sql" && (
                            <div className="ws-empty flex-1">
                                <span className="ws-empty-mark"><CircleStackIcon aria-hidden="true" /></span>
                                <h3>No table selected</h3>
                                <p>Pick a table to see its data and schema, or open the query tool to run SQL.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
