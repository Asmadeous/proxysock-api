interface TableSkeletonProps {
    columns: number;
    rows?: number;
}

export default function TableSkeleton({ columns, rows = 8 }: TableSkeletonProps) {
    return (
        <div className="ws-table-panel" role="status" aria-label="Loading">
            {Array.from({ length: rows + 1 }).map((_, row) => (
                <div className="ws-skeleton-row" key={row}>
                    {Array.from({ length: columns }).map((__, col) => <span className="ws-skeleton" key={col} style={row === 0 ? { height: 10, opacity: .6 } : undefined} />)}
                </div>
            ))}
        </div>
    );
}

export function StatsCardSkeleton() {
    return (
        <div className="ws-metric" role="status" aria-label="Loading">
            <span className="ws-skeleton" style={{ height: 10, maxWidth: 90 }} />
            <span className="ws-skeleton" style={{ height: 30, maxWidth: 120, margin: "16px 0 8px" }} />
            <span className="ws-skeleton" style={{ height: 8, maxWidth: 70 }} />
        </div>
    );
}
