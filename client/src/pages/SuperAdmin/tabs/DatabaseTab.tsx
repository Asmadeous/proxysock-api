import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { PlayIcon, TableCellsIcon, CircleStackIcon, ExclamationTriangleIcon, NumberedListIcon, CodeBracketIcon, ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { fetchDatabaseTables, executeDatabaseQuery } from "../../../services/adminApi";

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
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || "Query failed");
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
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || "Query failed");
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
        if (error) return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono whitespace-pre-wrap rounded-lg">
                ERROR: {error}
            </div>
        );
        if (loading && !results) return (
            <div className="flex-1 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
            </div>
        );
        if (!results) return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                <TableCellsIcon className="h-12 w-12 opacity-20 mb-3" />
                <p className="text-sm">No data to display</p>
            </div>
        );

        return (
            <div className="flex-1 flex flex-col border border-border rounded-lg overflow-hidden relative">
                <div className="px-4 py-2 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
                    <span className="text-xs font-medium text-foreground">
                        {results.rows.length} rows retrieved
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {executionTime.toFixed(1)}ms
                    </span>
                </div>
                <div className="flex-1 overflow-auto bg-card">
                    {results.rows.length > 0 ? (
                        <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                            <thead className="sticky top-0 bg-background z-10 shadow-sm outline outline-1 outline-border">
                                <tr>
                                    <th className="px-3 py-2 font-semibold text-muted-foreground text-xs uppercase w-12 text-center border-r border-border">#</th>
                                    {results.columns.map((col, i) => (
                                        <th key={i} className="px-4 py-2 font-semibold text-foreground border-r border-border min-w-[120px] max-w-[400px]">
                                            <div className="truncate">{col}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {results.rows.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-3 py-1.5 text-muted-foreground text-xs text-center border-r border-border select-none bg-muted/10">
                                            {activeView === "data" ? ((dataPage - 1) * DATA_PER_PAGE + rowIndex + 1) : (rowIndex + 1)}
                                        </td>
                                        {row.map((val, colIndex) => (
                                            <td key={colIndex} className="px-4 py-1.5 border-r border-border max-w-[400px]">
                                                <div className="truncate font-mono text-xs">
                                                    {val === null ? (
                                                        <span className="text-muted-foreground italic text-[10px] uppercase">null</span>
                                                    ) : typeof val === 'boolean' ? (
                                                        <span className={val ? 'text-green-500' : 'text-red-500'}>{String(val)}</span>
                                                    ) : (
                                                        String(val)
                                                    )}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            Query completed successfully. Table/Result is empty.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <CircleStackIcon className="h-7 w-7 text-blue-500" />
                        Database GUI
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        PgAdmin-style relational database explorer
                    </p>
                </div>
            </div>

            <div className="flex gap-4 flex-1 min-h-0">
                {/* Sidebar */}
                <div className="w-64 shrink-0 flex flex-col bg-card border border-border rounded-xl min-h-0 shadow-sm">
                    <div className="p-3 border-b border-border bg-muted/20">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                            <TableCellsIcon className="h-4 w-4" /> Tables ({tables.length})
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {tables.map(table => (
                            <button
                                key={table.name}
                                onClick={() => handleTableClick(table)}
                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between
                                    ${selectedTable?.name === table.name ? "bg-blue-500 text-white font-medium shadow-md" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
                            >
                                <span className="truncate">{table.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    {/* Top Bar Tabs */}
                    <div className="flex items-center gap-1 border-b border-border bg-muted/20 p-2 shrink-0 overflow-x-auto">
                        <button
                            disabled={!selectedTable}
                            onClick={() => setActiveView("data")}
                            className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-lg transition-all ${!selectedTable ? 'opacity-50 cursor-not-allowed' : activeView === "data" ? "bg-background text-blue-500 shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-muted/50"}`}
                        >
                            <TableCellsIcon className="h-4 w-4" /> Data
                        </button>
                        <button
                            disabled={!selectedTable}
                            onClick={() => setActiveView("schema")}
                            className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-lg transition-all ${!selectedTable ? 'opacity-50 cursor-not-allowed' : activeView === "schema" ? "bg-background text-blue-500 shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-muted/50"}`}
                        >
                            <NumberedListIcon className="h-4 w-4" /> Schema
                        </button>
                        <div className="h-6 w-px bg-border mx-2"></div>
                        <button
                            onClick={() => setActiveView("sql")}
                            className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-lg transition-all ${activeView === "sql" ? "bg-background text-blue-500 shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-muted/50"}`}
                        >
                            <CodeBracketIcon className="h-4 w-4" /> Query Tool
                        </button>
                        
                        {/* Table Name Title */}
                        {selectedTable && activeView !== "sql" && (
                            <div className="ml-auto px-4 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground uppercase">Table:</span>
                                <span className="text-sm font-bold font-mono text-foreground">{selectedTable.name}</span>
                            </div>
                        )}
                    </div>

                    {/* View Wrapper */}
                    <div className="flex-1 min-h-0 flex flex-col p-4">
                        
                        {/* Data View */}
                        {activeView === "data" && selectedTable && (
                            <div className="flex flex-col h-full bg-background rounded-xl border border-border p-2">
                                <div className="flex justify-between items-center mb-2 px-2 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleFetchTableData(selectedTable, dataPage)} className="p-1.5 text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors">
                                            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-muted-foreground">Showing {Math.min((dataPage-1)*DATA_PER_PAGE + 1, totalRows)}-{Math.min(dataPage*DATA_PER_PAGE, totalRows)} of {totalRows} rows</span>
                                        <div className="flex items-center gap-1">
                                            <button 
                                                disabled={dataPage === 1 || loading} 
                                                onClick={() => setDataPage(p => p - 1)}
                                                className="p-1 text-foreground disabled:opacity-30 bg-muted/50 rounded hover:bg-muted"
                                            >
                                                <ChevronLeftIcon className="h-4 w-4" />
                                            </button>
                                            <span className="text-xs px-2 font-medium">{dataPage}</span>
                                            <button 
                                                disabled={dataPage * DATA_PER_PAGE >= totalRows || loading} 
                                                onClick={() => setDataPage(p => p + 1)}
                                                className="p-1 text-foreground disabled:opacity-30 bg-muted/50 rounded hover:bg-muted"
                                            >
                                                <ChevronRightIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {renderResultsTable()}
                            </div>
                        )}

                        {/* Schema View */}
                        {activeView === "schema" && selectedTable && (
                            <div className="flex flex-col h-full">
                                <div className="bg-background rounded-lg border border-border overflow-hidden">
                                     <table className="w-full text-left text-sm">
                                         <thead className="bg-muted/30 border-b border-border">
                                             <tr>
                                                 <th className="px-4 py-3 font-semibold text-foreground">Column Name</th>
                                                 <th className="px-4 py-3 font-semibold text-foreground">Data Type</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-border">
                                             {selectedTable.columns.map(col => (
                                                 <tr key={col.name} className="hover:bg-muted/10">
                                                     <td className="px-4 py-3 font-mono text-xs">{col.name}</td>
                                                     <td className="px-4 py-3 font-mono text-xs text-blue-400 uppercase">{col.type}</td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                </div>
                            </div>
                        )}

                        {/* SQL View */}
                        {activeView === "sql" && (
                            <div className="flex flex-col h-full gap-4">
                                <div className="h-2/5 shrink-0 flex flex-col border border-border rounded-lg overflow-hidden relative">
                                    <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border absolute top-0 w-full z-10">
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">SQL Query Editor</span>
                                        <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded border border-yellow-500/20">
                                            <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                                            <span>Write-access is enabled. Be careful.</span>
                                        </div>
                                    </div>
                                    <textarea
                                        value={customQuery}
                                        onChange={(e) => setCustomQuery(e.target.value)}
                                        placeholder="SELECT * FROM users LIMIT 10;"
                                        className="w-full h-full resize-none bg-black/40 text-green-400 font-mono text-sm p-4 pt-12 outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500/50 leading-relaxed overflow-y-auto"
                                        spellCheck={false}
                                    />
                                    <div className="p-3 bg-muted/20 border-t border-border flex justify-between items-center shrink-0 absolute bottom-0 w-full">
                                        <span className="text-xs text-muted-foreground">Type raw PostgreSQL query</span>
                                        <button
                                            onClick={handleRunCustomQuery}
                                            disabled={loading || !customQuery.trim()}
                                            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                                        >
                                            <PlayIcon className="h-4 w-4" />
                                            {loading ? "Executing..." : "Run Query"}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col min-h-0 bg-background rounded-lg p-2 border border-border">
                                    <h4 className="text-sm font-medium text-foreground mb-2 px-1">Results</h4>
                                    {renderResultsTable()}
                                </div>
                            </div>
                        )}

                        {!selectedTable && activeView !== "sql" && (
                            <div className="flex bg-card items-center justify-center flex-1 rounded-xl border-2 border-dashed border-border p-12 text-center h-full">
                                <div>
                                    <CircleStackIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-foreground">No table selected</h3>
                                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                        Select a table from the sidebar to view data and schema, or use the Query Tool to write custom SQL.
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
