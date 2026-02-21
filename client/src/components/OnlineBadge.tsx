export default function OnlineBadge({ online, label }: { online: boolean; label?: string }) {
    return (
        <div className="flex items-center gap-1.5" title={online ? "Online" : "Offline"}>
            <span
                className={`relative flex h-2.5 w-2.5 flex-shrink-0 rounded-full ${online ? "bg-green-500" : "bg-gray-500"
                    }`}
            >
                {online && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                )}
            </span>
            {label && <span className="text-xs text-gray-400">{label}</span>}
        </div>
    );
}
