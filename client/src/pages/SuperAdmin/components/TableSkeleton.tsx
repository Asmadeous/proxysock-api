interface TableSkeletonProps {
    columns: number;
    rows?: number;
}

export default function TableSkeleton({ columns, rows = 8 }: TableSkeletonProps) {
    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="bg-muted/50 px-4 py-3.5 flex gap-6">
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={i} className="h-3 bg-muted rounded animate-pulse flex-1" />
                ))}
            </div>
            {/* Rows */}
            <div className="divide-y divide-border/50">
                {Array.from({ length: rows }).map((_, rowIdx) => (
                    <div key={rowIdx} className="px-4 py-3.5 flex gap-6 items-center">
                        {Array.from({ length: columns }).map((_, colIdx) => (
                            <div
                                key={colIdx}
                                className="h-3.5 bg-muted/70 rounded animate-pulse flex-1"
                                style={{ animationDelay: `${(rowIdx * columns + colIdx) * 30}ms` }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function StatsCardSkeleton() {
    return (
        <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
                <div className="h-3 w-14 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-7 w-24 rounded bg-muted animate-pulse mb-1.5" />
            <div className="h-3 w-20 rounded bg-muted/70 animate-pulse" />
        </div>
    );
}
